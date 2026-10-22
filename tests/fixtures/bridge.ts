import type { ValidateFunction } from "ajv";
import type { components } from "../../src/contract/decoded";
import * as validators from "../../src/contract/validators.js";
import { Barriers, bounded, deferred } from "../harness/barriers";
import { type Dataset, FIRST_ROOM_ID, generateData } from "./data";

type Schema = components["schemas"];
export type Route =
  | "/health"
  | "/rooms"
  | "/context"
  | "/digest"
  | "/stream"
  | "/send"
  | "/notice"
  | "/attachments"
  | "/revisions"
  | "/file";
export type Fault = 401 | 429 | 503 | "malformed";
export type BridgeEvent = {
  type: "request" | "response" | "stream-open" | "stream-close" | "command";
  id: number;
  path?: string;
  status?: number;
};
export type StreamEvent = "ready" | "message" | "cursor" | "ping" | "error";
const streamValidators = {
  ready: validators.validateStreamReady,
  message: validators.validateStreamMessage,
  cursor: validators.validateStreamCursor,
  ping: validators.validateStreamPing,
  error: validators.validateErrorEnvelope,
};
const headers = { "cache-control": "no-store" };

function checked(value: unknown, validator: ValidateFunction, status = 200) {
  if (!validator(value))
    throw new Error(
      `Invalid synthetic envelope: ${validator.errors?.[0]?.instancePath}`,
    );
  return Response.json(value, { status, headers });
}

function failure(status: number, code: string, candidates?: Schema["Room"][]) {
  return checked(
    {
      ok: false,
      error: { code, message: `Synthetic ${code}` },
      ...(candidates ? { candidates } : {}),
    },
    validators.validateErrorEnvelope,
    status,
  );
}

export function startBridge(
  options: { dataset?: Dataset; port?: number } = {},
) {
  const data = generateData(options.dataset);
  const events = new Barriers<BridgeEvent>();
  const requests: { id: number; path: string; method: string }[] = [];
  const faults = new Map<Route, Fault[]>();
  const pauses = new Map<Route, ReturnType<typeof deferred<void>>>();
  const activePauses = new Set<ReturnType<typeof deferred<void>>>();
  const streams = new Map<
    number,
    ReadableStreamDefaultController<Uint8Array>
  >();
  const encoder = new TextEncoder();
  let serial = 0;
  let commandSerial = 0;
  let stopped = false;

  function closeStream(id: number) {
    const controller = streams.get(id);
    if (!controller) return;
    streams.delete(id);
    controller.close();
    events.emit({ type: "stream-close", id, path: "/stream" });
  }

  function context(
    room: Schema["Room"],
    limit: number,
    showCovered: boolean,
  ): Schema["Context"] {
    const all = data.messages.get(room.id) ?? [];
    const messages = all
      .slice(-limit)
      .map((message) =>
        message.covered === "safebot" && !showCovered
          ? { ...message, text: "" }
          : message,
      );
    const last = messages.at(-1);
    return {
      ok: true,
      room,
      messages,
      lastMessageFromMe: last?.fromMe ?? null,
      attention: {
        mentionsMe: messages.filter((m) => m.mentionsMe).map((m) => m.id),
        repliesToMe: messages.filter((m) => m.repliesToMe).map((m) => m.id),
        mentionsEveryone: messages
          .filter((m) => m.mentionsAll)
          .map((m) => m.id),
      },
      coverage: {
        localOnly: true,
        reachesLatestKnown: true,
        catalogLatestMessageId: room.lastMessageId,
        newestReadMessageId: last?.id ?? null,
        hasEarlier: all.length > messages.length,
        storedLocally: all.length,
      },
    };
  }

  /** The 0.15.0 reads, answered from the same invented dataset as `/context`. */
  function reads(
    path: "/notice" | "/attachments" | "/revisions" | "/file",
    url: URL,
  ): Response {
    const roomId = url.searchParams.get("roomId");
    const open = url.searchParams.get("open");
    if (!roomId || !/^-?\d+$/.test(roomId))
      return failure(400, "INVALID_REQUEST");
    if (open !== null && open !== "true" && open !== "false")
      return failure(400, "INVALID_REQUEST");
    const room = data.rooms.find((item) => item.id === roomId);
    if (!room) return failure(404, "CHAT_NOT_FOUND");
    if (path === "/notice")
      return checked(
        { ok: true, room, notice: data.notices.get(room.id) ?? null },
        validators.validateNoticeAnswer,
      );
    if (!room.readable) return failure(503, "KEY_UNAVAILABLE");
    const all = data.messages.get(room.id) ?? [];
    if (path === "/attachments") {
      const kind = url.searchParams.get("kind");
      const limit = Number(url.searchParams.get("limit") ?? 50);
      const beforeId = url.searchParams.get("beforeId");
      if (
        (kind !== null && !["photo", "video", "file", "link"].includes(kind)) ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 1000 ||
        (beforeId !== null && !/^\d+$/.test(beforeId))
      )
        return failure(400, "INVALID_REQUEST");
      // Fixture-side id ordering only; the client never does arithmetic on ids.
      const pool =
        beforeId === null
          ? all
          : all.filter((message) => BigInt(message.id) < BigInt(beforeId));
      const attachments = pool.slice(-limit).flatMap((message) => {
        if (message.covered) return [];
        const base = {
          messageId: message.id,
          senderId: message.senderId,
          sender: message.sender,
          sentAt: message.sentAt,
        };
        const file = data.files.get(message.id);
        const found: Schema["Attachment"][] = file
          ? [
              {
                ...base,
                kind: "file",
                url: `https://example.invalid/file/${message.id}`,
                name: file.name,
                size: new TextEncoder().encode(file.bytes).byteLength,
              },
            ]
          : [];
        for (const link of message.text.match(/https?:\/\/\S+/g) ?? [])
          found.push({ ...base, kind: "link", url: link });
        return found.filter((item) => kind === null || item.kind === kind);
      });
      return checked(
        { ok: true, room, attachments, count: attachments.length },
        validators.validateAttachments,
      );
    }
    const messageId = url.searchParams.get("messageId");
    if (!messageId || !/^\d+$/.test(messageId))
      return failure(400, "INVALID_REQUEST");
    const message = all.find((item) => item.id === messageId);
    if (path === "/revisions") {
      if (!message) return failure(404, "MESSAGE_NOT_FOUND");
      const revisions = data.revisions.get(messageId) ?? [];
      return checked(
        { ok: true, room, messageId, revisions, count: revisions.length },
        validators.validateRevisions,
      );
    }
    if (message?.kind !== "file") return failure(404, "MESSAGE_NOT_FOUND");
    const file = data.files.get(messageId);
    if (!file) return failure(410, "FILE_EXPIRED");
    return new Response(file.bytes, {
      headers: {
        ...headers,
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename="file.txt"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "x-kanao-source": "local",
      },
    });
  }

  async function route(request: Request, id: number): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname as Route;
    const pause = pauses.get(path);
    if (pause) {
      pauses.delete(path);
      const aborted = deferred<void>();
      const onAbort = () => aborted.resolve();
      request.signal.addEventListener("abort", onAbort, { once: true });
      try {
        if (!request.signal.aborted)
          await bounded(
            Promise.race([pause.promise, aborted.promise]),
            `paused ${path}`,
            30_000,
          );
      } finally {
        activePauses.delete(pause);
        request.signal.removeEventListener("abort", onAbort);
      }
      if (stopped || request.signal.aborted)
        return new Response(null, { status: 499 });
    }
    const fault = faults.get(path)?.shift();
    if (fault === "malformed")
      return Response.json({ ok: "malformed" }, { headers });
    if (fault)
      return failure(
        fault,
        fault === 401
          ? "UNAUTHORIZED"
          : fault === 429
            ? "RATE_LIMITED"
            : "BUSY",
      );
    if (request.method !== (path === "/send" ? "POST" : "GET"))
      return failure(405, "INVALID_REQUEST");
    if (path === "/health")
      return checked({ ok: true }, validators.validateHealthResponse);
    if (path === "/rooms")
      return checked(
        { ok: true, rooms: data.rooms },
        validators.validateRoomsResponse,
      );
    if (path === "/stream") {
      const since = url.searchParams.getAll("since");
      if (since.some((value) => !/^-?\d+:\d+$/.test(value)))
        return failure(400, "INVALID_REQUEST");
      if (streams.size >= 8) return failure(503, "BUSY");
      const cursor = Object.fromEntries(since.map((value) => value.split(":")));
      const onAbort = () => closeStream(id);
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          streams.set(id, controller);
          const ready = { ok: true, resumed: since.length > 0, cursor };
          if (!validators.validateStreamReady(ready))
            throw new Error("Invalid synthetic ready");
          controller.enqueue(
            encoder.encode(`event: ready\ndata: ${JSON.stringify(ready)}\n\n`),
          );
          request.signal.addEventListener("abort", onAbort, { once: true });
          events.emit({ type: "stream-open", id, path });
        },
        cancel() {
          request.signal.removeEventListener("abort", onAbort);
          if (streams.delete(id))
            events.emit({ type: "stream-close", id, path });
        },
      });
      return new Response(body, {
        headers: {
          ...headers,
          "content-type": "text/event-stream",
          "x-accel-buffering": "no",
        },
      });
    }
    if (path === "/send") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return failure(400, "INVALID_REQUEST");
      }
      if (!validators.validateSendRequest(body))
        return failure(400, "INVALID_REQUEST");
      const candidates = data.rooms.filter(
        (room) => room.id === body.room || room.title === body.room,
      );
      if (candidates.length > 1)
        return failure(409, "AMBIGUOUS_CHAT", candidates);
      const room = candidates[0];
      if (!room) return failure(404, "CHAT_NOT_FOUND");
      // Deliberately no automatic stream echo: queue acceptance is not a read-back receipt.
      const dryRun = body.dryRun ?? false;
      // Only the first room holds a desktop draft, so both paths are always
      // reachable: that room asks before a send erases it, every other room
      // sends at once.
      const draft = room.id === FIRST_ROOM_ID;
      return checked(
        {
          ok: true,
          submitted: !dryRun,
          dryRun,
          room: room.title,
          roomId: room.id,
          length: [...body.text].length,
          ...(dryRun ? { wouldClearDraft: draft } : { clearedDraft: draft }),
        },
        validators.validateSendResult,
      );
    }
    if (
      path === "/notice" ||
      path === "/attachments" ||
      path === "/revisions" ||
      path === "/file"
    )
      return reads(path, url);
    if (path !== "/context" && path !== "/digest")
      return failure(404, "INVALID_REQUEST");
    const roomId = url.searchParams.get("roomId");
    if (!roomId) return failure(400, "INVALID_REQUEST");
    const room = data.rooms.find((item) => item.id === roomId);
    if (!room) return failure(404, "CHAT_NOT_FOUND");
    if (!room.readable) return failure(503, "KEY_UNAVAILABLE");
    const limit = Number(
      url.searchParams.get("limit") ?? (path === "/context" ? 40 : 400),
    );
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
      return failure(400, "INVALID_REQUEST");
    const showCovered = url.searchParams.get("showCovered");
    if (
      showCovered !== null &&
      showCovered !== "true" &&
      showCovered !== "false"
    )
      return failure(400, "INVALID_REQUEST");
    const window = context(room, limit, showCovered === "true");
    if (path === "/context") return checked(window, validators.validateContext);
    const span = url.searchParams.get("span") ?? "30m";
    const highlights = Number(url.searchParams.get("highlights") ?? 3);
    const spanMatch = /^(\d+)(m|h|d)$/.exec(span);
    if (
      !spanMatch ||
      Number(spanMatch[1]) < 1 ||
      !Number.isInteger(highlights) ||
      highlights < 1 ||
      highlights > 20
    )
      return failure(400, "INVALID_REQUEST");
    const unit =
      spanMatch[2] === "m"
        ? 60_000
        : spanMatch[2] === "h"
          ? 3_600_000
          : 86_400_000;
    const duration = Number(spanMatch[1]) * unit;
    if (!Number.isSafeInteger(duration) || duration > 8_640_000_000_000_000)
      return failure(400, "INVALID_REQUEST");
    const buckets = new Map<number, Schema["Message"][]>();
    for (const message of window.messages) {
      if (!message.sentAt) continue;
      const key = Math.floor(Date.parse(message.sentAt) / duration) * duration;
      const bucket = buckets.get(key) ?? [];
      bucket.push(message);
      buckets.set(key, bucket);
    }
    const slices = [...buckets].map(([start, messages]) => {
      const speakers = new Map<string, number>();
      for (const message of messages)
        speakers.set(message.sender, (speakers.get(message.sender) ?? 0) + 1);
      return {
        from: new Date(start).toISOString(),
        to: new Date(start + duration).toISOString(),
        count: messages.length,
        speakers: [...speakers].map(([name, count]) => ({ name, count })),
        keywords: [{ word: "Synthetic", count: messages.length }],
        highlights: messages.slice(0, highlights),
      };
    });
    return checked(
      {
        ok: true,
        room,
        span,
        considered: window.messages.length,
        slices,
        note: "Synthetic extractive fixture; no model or summary.",
      },
      validators.validateDigest,
    );
  }

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: options.port ?? 0,
    idleTimeout: 0,
    async fetch(request) {
      const id = ++serial;
      const path = new URL(request.url).pathname;
      requests.push({ id, path, method: request.method });
      events.emit({ type: "request", id, path });
      const response = await route(request, id);
      events.emit({ type: "response", id, path, status: response.status });
      return response;
    },
  });

  return {
    data,
    events,
    requests,
    port: server.port,
    url: server.url.origin,
    get activeStreams() {
      return streams.size;
    },
    failNext(path: Route, fault: Fault) {
      faults.set(path, [...(faults.get(path) ?? []), fault]);
    },
    pauseNext(path: Route) {
      if (pauses.has(path)) throw new Error(`Already paused: ${path}`);
      const gate = deferred<void>();
      pauses.set(path, gate);
      activePauses.add(gate);
      return () => gate.resolve();
    },
    /** Command acknowledgement is subscribed before dispatch, never inferred from time. */
    async command(action: () => void) {
      const id = ++commandSerial;
      const ack = events.expect(
        (event) => event.type === "command" && event.id === id,
        `command ${id}`,
      );
      try {
        action();
      } finally {
        events.emit({ type: "command", id });
        await ack;
      }
    },
    emit(event: StreamEvent, payload: unknown, fragmentSizes: number[] = []) {
      if (!streamValidators[event](payload))
        throw new Error(`Invalid synthetic ${event}`);
      const bytes = encoder.encode(
        `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
      );
      this.writeBytes(bytes, fragmentSizes);
      if (event === "error") this.endStreams();
    },
    /** Raw bytes intentionally bypass validation for malformed/UTF-8 boundary scenarios. */
    writeBytes(bytes: Uint8Array, fragmentSizes: number[] = []) {
      if (fragmentSizes.some((size) => !Number.isInteger(size) || size < 1))
        throw new Error("Fragment sizes must be positive integers");
      let offset = 0;
      let index = 0;
      while (offset < bytes.length) {
        const size = fragmentSizes.length
          ? fragmentSizes[index++ % fragmentSizes.length]
          : bytes.length;
        const end = Math.min(offset + (size ?? bytes.length), bytes.length);
        for (const controller of streams.values())
          controller.enqueue(bytes.slice(offset, end));
        offset = end;
      }
    },
    endStreams() {
      for (const id of streams.keys()) closeStream(id);
    },
    async stop() {
      stopped = true;
      for (const gate of activePauses) gate.resolve();
      activePauses.clear();
      pauses.clear();
      this.endStreams();
      await server.stop(true);
    },
  };
}

export type FixtureBridge = ReturnType<typeof startBridge>;
