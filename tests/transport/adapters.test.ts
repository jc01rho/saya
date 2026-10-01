import { afterEach, describe, expect, test } from "bun:test";
import {
  AdapterSseParser,
  type AdapterStreamEvent,
  fetchCapabilities,
  fetchMessages,
  fetchRooms,
  listAdapters,
  sendMessage,
  streamAdapter,
} from "../../src/transport/adapters";

type FetchStub = typeof fetch;
const originalFetch = globalThis.fetch;

const capabilities = {
  ok: true,
  contract: { version: "0.1.0" },
  adapter: { name: "synthetic-adapter", version: "0.0.0" },
  provider: { id: "example", name: "Example" },
  account: { kind: "user" },
  revision: "0123456789abcdef",
  features: { "messages.send": { maxLength: 4096, receipt: "stored" } },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function html(status: number) {
  return new Response("<html><body>not this</body></html>", {
    status,
    headers: { "content-type": "text/html" },
  });
}

const requested: string[] = [];
function reply(answer: Response | Error) {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    requested.push(String(input));
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer);
  }) as unknown as FetchStub;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  requested.length = 0;
});

const signal = () => new AbortController().signal;

describe("an adapter's capabilities through the proxy", () => {
  test("a declaration in the contract's shape is connected", async () => {
    reply(json(capabilities));
    expect(await fetchCapabilities("example", signal())).toEqual({
      kind: "connected",
      capabilities: capabilities as never,
    });
    expect(requested).toEqual(["/adapters/example/capabilities"]);
  });

  test("an enum value this client does not know is still a declaration", async () => {
    reply(json({ ...capabilities, account: { kind: "future-kind" } }));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "connected",
    );
  });

  test("401 keeps its machine-readable code", async () => {
    reply(
      json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "ignored" } },
        401,
      ),
    );
    expect(await fetchCapabilities("example", signal())).toEqual({
      kind: "refused",
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  test("a proxy's 502 page or a network failure is unreachable", async () => {
    reply(html(502));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "unreachable",
    );
    reply(new TypeError("Failed to fetch"));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "unreachable",
    );
  });

  test("something that answers but is not the contract is a protocol failure", async () => {
    reply(html(200));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "protocol",
    );
    const { revision: _revision, ...missing } = capabilities;
    reply(json(missing));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "protocol",
    );
  });

  test("an aborted request rejects instead of reporting a state", async () => {
    const controller = new AbortController();
    controller.abort();
    reply(new DOMException("aborted", "AbortError"));
    await expect(
      fetchCapabilities("example", controller.signal),
    ).rejects.toBeInstanceOf(DOMException);
  });
});

describe("the proxy's adapter index", () => {
  test("lists ids", async () => {
    reply(json({ adapters: [{ id: "telegram" }, { id: "chat-two" }] }));
    expect(await listAdapters(signal())).toEqual({
      kind: "listed",
      ids: ["telegram", "chat-two"],
    });
  });

  test("an SPA fallback page or a malformed index means no adapters are set up", async () => {
    reply(html(200));
    expect((await listAdapters(signal())).kind).toBe("unconfigured");
    reply(json({ adapters: [{ id: "../escape" }] }));
    expect((await listAdapters(signal())).kind).toBe("unconfigured");
  });

  test("no proxy at all is unreachable", async () => {
    reply(new TypeError("Failed to fetch"));
    expect((await listAdapters(signal())).kind).toBe("unreachable");
  });
});

const message = {
  id: "9007199254740993",
  roomId: "-1001234567890",
  senderId: "42",
  sender: "Synthetic peer",
  text: "Synthetic message",
  kind: "text",
  sentAt: "2026-09-18T00:21:30.000Z",
  fromMe: false,
};

describe("rooms, messages and sending through the proxy", () => {
  test("rooms in the contract's shape, ids kept as strings", async () => {
    reply(
      json({
        ok: true,
        complete: true,
        rooms: [
          {
            id: "-1001234567890",
            title: "Synthetic room",
            kind: "group",
            unread: 3,
          },
        ],
      }),
    );
    const result = await fetchRooms("example", signal());
    expect(result.kind).toBe("ok");
    if (result.kind === "ok")
      expect(result.data.rooms[0]?.id).toBe("-1001234567890");
    expect(requested).toEqual(["/adapters/example/rooms"]);
  });

  test("messages ask with roomId, limit and before, and validate the answer", async () => {
    reply(json({ ok: true, hasEarlier: true, messages: [message] }));
    const result = await fetchMessages(
      "example",
      { roomId: "-1001234567890", limit: 50, before: "9007199254740995" },
      signal(),
    );
    expect(result.kind).toBe("ok");
    expect(requested).toEqual([
      "/adapters/example/messages?roomId=-1001234567890&limit=50&before=9007199254740995",
    ]);
    reply(json({ ok: true, messages: [message] }));
    expect(
      (await fetchMessages("example", { roomId: "1" }, signal())).kind,
    ).toBe("protocol");
  });

  test("a stored send carries the stored message; a full line is refused, not retried", async () => {
    let calls = 0;
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
      calls += 1;
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        roomId: "1",
        text: "Hi",
      });
      return Promise.resolve(
        json({ ok: true, message: { ...message, fromMe: true } }),
      );
    }) as unknown as FetchStub;
    const stored = await sendMessage(
      "example",
      { roomId: "1", text: "Hi" },
      signal(),
    );
    expect(stored.kind).toBe("ok");
    reply(
      json(
        { ok: false, error: { code: "RATE_LIMITED", message: "ignored" } },
        429,
      ),
    );
    expect(
      await sendMessage("example", { roomId: "1", text: "Hi" }, signal()),
    ).toEqual({
      kind: "refused",
      status: 429,
      code: "RATE_LIMITED",
    });
    expect(calls).toBe(1);
  });
});

function sseBody(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe("the adapter stream", () => {
  test("frames split anywhere still arrive whole and in order", async () => {
    const frames = [
      `event: ready\ndata: {"ok":true,"resumed":true,"cursor":{}}\n\n`,
      `event: message\ndata: ${JSON.stringify({ ok: true, message })}\n\n`,
      `event: cursor\ndata: {"ok":true,"cursor":{"-1001234567890":"9007199254740993"}}\n\n`,
      `event: ping\ndata: {"ok":true}\n\n`,
      `event: future-event\ndata: {"ok":true}\n\n`,
    ].join("");
    const pieces = [
      frames.slice(0, 7),
      frames.slice(7, 61),
      frames.slice(61, 200),
      frames.slice(200),
    ];
    reply(
      new Response(sseBody(pieces), {
        headers: { "content-type": "text/event-stream" },
      }),
    );
    const events: AdapterStreamEvent[] = [];
    const end = await streamAdapter("example", {
      since: { "-1001234567890": "9007199254740990" },
      signal: signal(),
      onEvent: (event) => events.push(event),
    });
    expect(end).toEqual({ kind: "eof" });
    expect(events.map((event) => event.type)).toEqual([
      "ready",
      "message",
      "cursor",
    ]);
    expect(requested).toEqual([
      "/adapters/example/stream?since=-1001234567890%3A9007199254740990",
    ]);
  });

  test("an error event ends the stream with its code", async () => {
    reply(
      new Response(
        sseBody([
          `event: error\ndata: {"ok":false,"error":{"code":"INTERNAL","message":"ignored"}}\n\n`,
        ]),
        { headers: { "content-type": "text/event-stream" } },
      ),
    );
    expect(
      await streamAdapter("example", {
        since: {},
        signal: signal(),
        onEvent: () => {},
      }),
    ).toEqual({ kind: "error", code: "INTERNAL" });
  });

  test("a payload outside the contract ends the parse as a protocol failure", () => {
    const seen: AdapterStreamEvent[] = [];
    const parser = new AdapterSseParser((event) => seen.push(event));
    parser.push(
      new TextEncoder().encode(`event: message\ndata: {"ok":true}\n\n`),
    );
    expect(parser.outcome).toEqual({ kind: "protocol" });
    expect(seen).toEqual([]);
  });

  test("a ninth stream's 503 BUSY is a refusal, not a disconnect", async () => {
    reply(
      json({ ok: false, error: { code: "BUSY", message: "ignored" } }, 503),
    );
    expect(
      await streamAdapter("example", {
        since: {},
        signal: signal(),
        onEvent: () => {},
      }),
    ).toEqual({ kind: "refused", status: 503, code: "BUSY" });
  });

  test("an aborted stream says so", async () => {
    const controller = new AbortController();
    controller.abort();
    reply(new DOMException("aborted", "AbortError"));
    expect(
      await streamAdapter("example", {
        since: {},
        signal: controller.signal,
        onEvent: () => {},
      }),
    ).toEqual({ kind: "aborted" });
  });
});
