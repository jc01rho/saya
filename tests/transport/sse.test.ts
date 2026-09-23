import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { HttpProtocolError } from "../../src/transport/http";
import {
  type SseDiagnostic,
  SseParser,
  type SseRecord,
  streamEvents,
} from "../../src/transport/sse";

type Schema = components["schemas"];
const encoder = new TextEncoder();
const ready: Schema["StreamReady"] = { ok: true, resumed: false, cursor: {} };
const cursor: Schema["StreamCursor"] = {
  ok: true,
  cursor: { "18491246151592761": "9007199254740993" },
};
const message: Schema["StreamMessage"] = {
  ok: true,
  message: {
    id: "9007199254740993",
    roomId: "18491246151592761",
    senderId: "42",
    sender: "Synthetic peer",
    text: "한글 🌸",
    kind: "text",
    sentAt: null,
    fromMe: false,
  },
};
const failure: Schema["ErrorEnvelope"] = {
  ok: false,
  error: { code: "FUTURE_CORE_ERROR", message: "Synthetic failure" },
};

function frame(event: string, data: unknown, ending = "\n") {
  return `event: ${event}${ending}data: ${JSON.stringify(data)}${ending}${ending}`;
}

function parse(chunks: Uint8Array[]) {
  const events: SseRecord[] = [];
  const diagnostics: SseDiagnostic[] = [];
  const parser = new SseParser({
    onEvent: (event) => events.push(event),
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  });
  for (const chunk of chunks) parser.push(chunk);
  return { events, diagnostics, outcome: parser.finish(), parser };
}

function fragments(bytes: Uint8Array, size: number) {
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytes.length; offset += size)
    chunks.push(bytes.subarray(offset, offset + size));
  return chunks;
}

describe("incremental SSE byte boundary", () => {
  test("the same mixed-ending UTF-8 stream agrees at EVERY byte split", () => {
    const bytes = encoder.encode(
      `\uFEFF: initial comment\r\n${frame("ready", ready, "\r\n")}` +
        `event: message\rdata: {"ok":true,\r: comment inside a frame\r` +
        `data: "message":${JSON.stringify(message.message)}}\r\r` +
        `event: future-event\ndata: {"private":"not in diagnostics"}\n\n` +
        `id: ignored\nretry: 100\n${frame("ping", { ok: true })}` +
        frame("cursor", cursor, "\r\n"),
    );
    const expectedEvents: SseRecord[] = [
      { type: "ready", data: ready },
      { type: "message", data: message },
      { type: "ping", data: { ok: true } },
      { type: "cursor", data: cursor },
    ];
    for (let split = 0; split <= bytes.length; split++) {
      const result = parse([bytes.subarray(0, split), bytes.subarray(split)]);
      expect(result.events).toEqual(expectedEvents);
      expect(result.diagnostics).toEqual([{ type: "unknown-event" }]);
      expect(result.outcome).toEqual({ kind: "eof" });
    }
    expect(parse(fragments(bytes, 1)).events).toEqual(expectedEvents);
  });

  test("only the initial BOM is removed; later BOM text survives", () => {
    const payload = {
      ...message,
      message: { ...message.message, text: "\uFEFFretained" },
    };
    const result = parse(
      fragments(
        encoder.encode(
          `\uFEFF${frame("message", payload)}${frame("cursor", cursor)}`,
        ),
        1,
      ),
    );
    expect(result.events[0]).toEqual({ type: "message", data: payload });
    const later = parse([
      encoder.encode(
        `${frame("cursor", cursor)}\uFEFFevent: ping\ndata: {"ok":true}\n\n`,
      ),
    ]);
    expect(later.events).toEqual([
      { type: "cursor", data: cursor },
      {
        type: "discarded-frame",
        bytes: encoder.encode('\uFEFFevent: ping\ndata: {"ok":true}\n\n')
          .length,
      },
    ]);
  });

  test("a BOM after an initial blank line is not a stream-start BOM", () => {
    const later = `\uFEFF${frame("ping", { ok: true })}`;
    for (const ending of ["\n", "\r\n", "\r"]) {
      const bytes = encoder.encode(
        `${ending}${later}${frame("cursor", cursor)}`,
      );
      for (let split = 0; split <= bytes.length; split++) {
        const result = parse([bytes.subarray(0, split), bytes.subarray(split)]);
        expect(result.events).toEqual([
          { type: "discarded-frame", bytes: encoder.encode(later).length },
          { type: "cursor", data: cursor },
        ]);
      }
    }
  });

  test("defaults to message, takes the final event field, and ignores empty blocks", () => {
    const result = parse([
      encoder.encode(
        `:\n\n\nevent: ping\nevent:\ndata:${JSON.stringify(message)}\n\n${frame("cursor", cursor)}`,
      ),
    ]);
    expect(result.events).toEqual([
      { type: "message", data: message },
      { type: "cursor", data: cursor },
    ]);
  });

  test("never applies a final event without a terminating blank line", () => {
    for (const suffix of ["", "\n", "\r", "\r\n"]) {
      const result = parse([
        encoder.encode(
          `${frame("cursor", cursor)}event: message\ndata: ${JSON.stringify(message)}${suffix}`,
        ),
      ]);
      expect(result.events).toEqual([{ type: "cursor", data: cursor }]);
      expect(result.outcome).toEqual({ kind: "eof" });
    }
  });

  test("a lone CR blank line at EOF dispatches, at every split", () => {
    const bytes = encoder.encode(frame("cursor", cursor, "\r"));
    for (let split = 0; split <= bytes.length; split++) {
      const result = parse([bytes.subarray(0, split), bytes.subarray(split)]);
      expect(result.events).toEqual([{ type: "cursor", data: cursor }]);
      expect(result.outcome).toEqual({ kind: "eof" });
    }
  });

  test("validates ping and error, including unknown error codes; error is terminal", () => {
    const bytes = encoder.encode(
      `${frame("cursor", cursor)}${frame("error", failure)}${frame("message", message)}`,
    );
    for (let split = 0; split <= bytes.length; split++) {
      const result = parse([bytes.subarray(0, split), bytes.subarray(split)]);
      expect(result.events).toEqual([
        { type: "cursor", data: cursor },
        { type: "error", data: failure },
      ]);
      expect(result.outcome).toEqual({ kind: "error", error: failure.error });
    }
    for (const event of ["ping", "error", "ready", "cursor"] as const) {
      const result = parse([encoder.encode(frame(event, { ok: false }))]);
      expect(result.events).toEqual([]);
      expect(result.outcome).toEqual({ kind: "protocol-error" });
      expect(result.diagnostics).toEqual([{ type: "invalid-payload", event }]);
    }
  });
});

describe("bounded discard and cursor safety", () => {
  const huge = frame(
    "message",
    {
      ...message,
      message: { ...message.message, text: "한".repeat(100_000) },
    },
    "\r\n",
  );

  test("100,000 Hangul characters are discarded, then cursor and next message CONTINUE", () => {
    const bytes = encoder.encode(
      `${huge}${frame("cursor", cursor)}${frame("message", message)}`,
    );
    for (const size of [1, 4093, bytes.length]) {
      const result = parse(fragments(bytes, size));
      expect(result.events).toEqual([
        { type: "discarded-frame", bytes: encoder.encode(huge).length },
        { type: "cursor", data: cursor },
        { type: "message", data: message },
      ]);
      expect(result.outcome).toEqual({ kind: "eof" });
      expect(result.parser.bufferedBytes).toBe(0);
    }
  });

  test("discard mode stores no frame bytes while waiting for a delimiter", () => {
    const result = parse([encoder.encode(`data: ${"x".repeat(300_000)}`)]);
    expect(result.events).toEqual([]);
    expect(result.parser.bufferedBytes).toBe(0);
    expect(result.outcome).toEqual({ kind: "resource-limited" });
  });

  test("enforces the byte limit, including exact-limit frames", () => {
    const prefix = frame("cursor", cursor);
    const base = frame("ping", { ok: true });
    const atLimit = `:${"x".repeat(256 * 1024 - encoder.encode(base).length - 2)}\n${base}`;
    expect(encoder.encode(atLimit).length).toBe(256 * 1024);
    expect(parse([encoder.encode(prefix + atLimit)]).events).toEqual([
      { type: "cursor", data: cursor },
      { type: "ping", data: { ok: true } },
    ]);
    const overLimit = `:${atLimit}`;
    expect(parse([encoder.encode(prefix + overLimit)]).events).toEqual([
      { type: "cursor", data: cursor },
      { type: "discarded-frame", bytes: 256 * 1024 + 1 },
    ]);
  });

  test("missing next cursor, ready-only, and truncated cursor cannot authorize replay", () => {
    for (const text of [
      frame("ready", ready),
      huge,
      frame("cursor", cursor) + huge,
      huge + frame("ready", ready),
      huge + frame("cursor", cursor).slice(0, -1),
    ]) {
      expect(parse([encoder.encode(text)]).outcome).toEqual({
        kind: "resource-limited",
      });
    }
    const result = parse([
      encoder.encode(
        `${huge}${frame("cursor", { ok: true, cursor: { room: 123 } })}${frame("message", message)}`,
      ),
    ]);
    expect(result.outcome).toEqual({ kind: "protocol-error" });
    expect(result.events).toEqual([
      { type: "discarded-frame", bytes: encoder.encode(huge).length },
    ]);
  });

  test("malformed known messages produce a gap marker, never a replay loop", () => {
    for (const invalid of [
      frame("message", { ok: true }),
      "event: message\ndata: {broken\n\n",
    ]) {
      const result = parse([
        encoder.encode(
          `${invalid}${frame("cursor", cursor)}${frame("message", message)}`,
        ),
      ]);
      expect(result.events).toEqual([
        { type: "discarded-frame", bytes: encoder.encode(invalid).length },
        { type: "cursor", data: cursor },
        { type: "message", data: message },
      ]);
      expect(result.outcome).toEqual({ kind: "eof" });
      expect(result.diagnostics).toEqual([
        { type: "invalid-payload", event: "message" },
      ]);
    }
  });

  test("more than 1 MiB discarded bytes stops even without a delimiter", () => {
    const result = parse(
      fragments(
        encoder.encode(
          `data: ${"x".repeat(1024 * 1024)}\n\n${frame("cursor", cursor)}`,
        ),
        4096,
      ),
    );
    expect(result.events).toEqual([]);
    expect(result.outcome).toEqual({ kind: "resource-limited" });
    expect(result.parser.bufferedBytes).toBe(0);
  });

  test("the discard budget remains bounded across multiple discarded frames", () => {
    const result = parse([
      encoder.encode(`${huge}${frame("cursor", cursor)}`.repeat(4)),
    ]);
    expect(result.outcome).toEqual({ kind: "resource-limited" });
    expect(
      result.events.filter((event) => event.type === "discarded-frame"),
    ).toHaveLength(3);
  });
});

describe("fetch /stream boundary and cleanup", () => {
  test("reads the real HTTP stream once and preserves repeated since parameters", async () => {
    const requests: { path: string; since: string[]; accept: string | null }[] =
      [];
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        requests.push({
          path: url.pathname,
          since: url.searchParams.getAll("since"),
          accept: request.headers.get("accept"),
        });
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              for (const chunk of fragments(
                encoder.encode(
                  `${frame("ready", ready)}${frame("cursor", cursor)}${frame("message", message)}`,
                ),
                7,
              ))
                controller.enqueue(chunk);
              controller.close();
            },
          }),
          { headers: { "content-type": "text/event-stream; charset=utf-8" } },
        );
      },
    });
    try {
      const events: SseRecord[] = [];
      const outcome = await streamEvents({
        url: `${server.url}stream`,
        signal: AbortSignal.timeout(5000),
        query: new URLSearchParams([
          ["since", "1001:5300"],
          ["since", "1002:412"],
        ]),
        onEvent: (event) => events.push(event),
      });
      expect(outcome).toEqual({ kind: "eof" });
      expect(events.map((event) => event.type)).toEqual([
        "ready",
        "cursor",
        "message",
      ]);
      expect(requests).toEqual([
        {
          path: "/stream",
          since: ["1001:5300", "1002:412"],
          accept: "text/event-stream",
        },
      ]);
    } finally {
      await server.stop(true);
    }
  });

  test("reuses the HTTP error envelope boundary for 401/503 and rejects HTML", async () => {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(request) {
        const path = new URL(request.url).pathname;
        if (path === "/html") return new Response("<html>wrong</html>");
        return Response.json(failure, { status: path === "/401" ? 401 : 503 });
      },
    });
    try {
      for (const status of [401, 503]) {
        const events: SseRecord[] = [];
        expect(
          await streamEvents({
            url: `${server.url}${status}`,
            signal: AbortSignal.timeout(5000),
            onEvent: (event) => events.push(event),
          }),
        ).toEqual({
          kind: "failure",
          status,
          error: failure.error,
        });
        expect(events).toEqual([]);
      }
      await expect(
        streamEvents({
          url: `${server.url}html`,
          signal: AbortSignal.timeout(5000),
          onEvent() {},
        }),
      ).rejects.toBeInstanceOf(HttpProtocolError);
    } finally {
      await server.stop(true);
    }
  });

  test("terminal error cancels and unlocks an otherwise open reader", async () => {
    const original = globalThis.fetch;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(frame("error", failure)));
      },
      cancel() {
        cancelled = true;
      },
    });
    globalThis.fetch = Object.assign(
      async () =>
        new Response(body, {
          headers: { "content-type": "text/event-stream" },
        }),
      { preconnect: original.preconnect },
    );
    try {
      const events: SseRecord[] = [];
      const outcome = await streamEvents({
        signal: AbortSignal.timeout(5000),
        onEvent: (event) => events.push(event),
      });
      expect(outcome).toEqual({ kind: "error", error: failure.error });
      expect(events).toEqual([{ type: "error", data: failure }]);
      expect(cancelled).toBe(true);
      expect(body.locked).toBe(false);
    } finally {
      globalThis.fetch = original;
    }
  });

  test("abort wakes a pending read, cancels it, and prevents later dispatch", async () => {
    const original = globalThis.fetch;
    const abort = new AbortController();
    let pulled!: () => void;
    const pendingRead = new Promise<void>((resolve) => {
      pulled = resolve;
    });
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull() {
        pulled();
      },
      cancel() {
        cancelled = true;
      },
    });
    globalThis.fetch = Object.assign(
      async () =>
        new Response(body, {
          headers: { "content-type": "text/event-stream" },
        }),
      { preconnect: original.preconnect },
    );
    try {
      const events: SseRecord[] = [];
      const task = streamEvents({
        signal: abort.signal,
        onEvent: (event) => events.push(event),
      });
      await pendingRead;
      abort.abort();
      expect(await task).toEqual({ kind: "aborted" });
      expect(events).toEqual([]);
      expect(cancelled).toBe(true);
      expect(body.locked).toBe(false);
    } finally {
      globalThis.fetch = original;
    }
  }, 5000);
});
