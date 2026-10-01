import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { sseEventSchemas, sseValidators } from "../../src/contract/sse";
import { sseValidators as adapterSse } from "../../src/contract/tsuba/sse";
import {
  validateErrorEnvelope as validateAdapterError,
  validateCapabilities,
  validateMessagesAnswer,
  validateRoomsAnswer,
} from "../../src/contract/tsuba/validators.js";
import { CONTRACT_VERSION as ADAPTER_CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import {
  validateCursor,
  validateErrorEnvelope,
  validateMessage,
  validateRoomsResponse,
  validateSendRequest,
  validateStreamMessage,
} from "../../src/contract/validators.js";

const message = {
  id: "9007199254740993",
  roomId: "18491246151592761",
  senderId: "42",
  sender: "Synthetic peer",
  text: "Synthetic message",
  kind: "text",
  sentAt: "2026-09-18T00:21:30Z",
  fromMe: false,
};

function errorBranch(error: components["schemas"]["ErrorEnvelope"]): string {
  switch (error.error.code) {
    case "BUSY":
      return "busy";
    default:
      return "default";
  }
}

describe("generated wire boundary", () => {
  test("rejects missing required fields at the envelope and nested levels", () => {
    const { senderId: _senderId, ...missingSender } = message;
    expect(validateMessage(message)).toBe(true);
    expect(validateMessage(missingSender)).toBe(false);
    expect(validateStreamMessage({ ok: true })).toBe(false);
    expect(validateStreamMessage({ ok: true, message: missingSender })).toBe(
      false,
    );
    expect(validateRoomsResponse({ ok: true })).toBe(false);
  });

  test("accepts additive keys without discarding or mutating them", () => {
    const payload = {
      ok: true,
      futureEnvelopeKey: 12,
      message: { ...message, futureMessageKey: { enabled: true } },
    };
    const before = structuredClone(payload);
    expect(validateStreamMessage(payload)).toBe(true);
    expect(payload).toEqual(before);
  });

  test("accepts unknown error codes and reaches a default branch", () => {
    const code: components["schemas"]["ErrorCode"] = "FUTURE_CORE_ERROR";
    const envelope: unknown = {
      ok: false,
      error: { code, message: "Synthetic failure" },
    };
    expect(validateErrorEnvelope(envelope)).toBe(true);
    if (!validateErrorEnvelope(envelope))
      throw new Error("Invalid synthetic error");
    expect(errorBranch(envelope)).toBe("default");
    expect(sseValidators.error(envelope)).toBe(true);
    expect(
      validateErrorEnvelope({ ok: false, error: { code: 42, message: "bad" } }),
    ).toBe(false);
  });

  test("retains constraints on known fields and dictionary entries", () => {
    expect(validateMessage({ ...message, id: 9007199254740992 })).toBe(false);
    expect(
      validateMessage({ ...message, sentAt: "2026-02-30T00:00:00Z" }),
    ).toBe(false);
    expect(
      validateMessage({ ...message, sentAt: null, kind: "future-kind" }),
    ).toBe(true);
    expect(validateCursor({ "1001": "5301" })).toBe(true);
    expect(validateCursor({ "1001": 5301 })).toBe(false);
    expect(validateSendRequest({ room: "1001", text: "" })).toBe(false);
    expect(
      validateSendRequest({ room: "1001", text: "Synthetic", dryRun: true }),
    ).toBe(true);
  });

  test("derives every SSE event mapping from the document", async () => {
    const document = await Bun.file(
      new URL("../../contracts/kakao.openapi.json", import.meta.url),
    ).json();
    const events = document.paths["/stream"].get["x-sse-events"];
    const expected = Object.fromEntries(
      Object.entries(events).map(([name, event]) => [
        name,
        (event as { schema: { $ref: string } }).schema.$ref.split("/").at(-1),
      ]),
    );
    expect(expected).toEqual(sseEventSchemas);
    expect(Object.keys(sseValidators)).toEqual(Object.keys(events));
    expect(sseValidators.ping({ ok: true })).toBe(true);
    expect(sseValidators.ping({ ok: false })).toBe(false);
  });
});

describe("generated adapter (tsuba) boundary", () => {
  const declaration = {
    ok: true,
    contract: { version: "0.1.0" },
    adapter: { name: "synthetic-adapter", version: "0.0.0" },
    provider: { id: "example", name: "Example" },
    account: { kind: "user" },
    revision: "0123456789abcdef",
    features: {
      "messages.read": { paging: "before-id", maxLimit: 100 },
      "x-example.pins": {},
    },
  };

  test("accepts a declaration, additive keys and enum values it does not know", () => {
    expect(validateCapabilities(declaration)).toBe(true);
    expect(
      validateCapabilities({
        ...declaration,
        futureKey: 1,
        account: { kind: "future-kind" },
        features: {
          "future.feature": {},
          "messages.send": { maxLength: 1, receipt: "future" },
        },
      }),
    ).toBe(true);
  });

  test("keeps the constraints that make a declaration mean something", () => {
    const { revision: _revision, ...unrevised } = declaration;
    expect(validateCapabilities(unrevised)).toBe(false);
    expect(
      validateCapabilities({
        ...declaration,
        features: { "messages.send": { maxLength: 0, receipt: "stored" } },
      }),
    ).toBe(false);
    expect(
      validateCapabilities({
        ...declaration,
        provider: { id: "Not An Id", name: "Example" },
      }),
    ).toBe(false);
    expect(
      validateCapabilities({
        ...declaration,
        features: { "x-example.pins": "yes" },
      }),
    ).toBe(false);
  });

  test("rooms and messages keep required keys and string ids, and accept additive ones", () => {
    const room = {
      id: "-100123",
      title: "Synthetic",
      kind: "future-kind",
      unread: 0,
      futureKey: 1,
    };
    expect(
      validateRoomsAnswer({ ok: true, complete: true, rooms: [room] }),
    ).toBe(true);
    expect(validateRoomsAnswer({ ok: true, rooms: [room] })).toBe(false);
    expect(
      validateRoomsAnswer({
        ok: true,
        complete: true,
        rooms: [{ ...room, id: -100123 }],
      }),
    ).toBe(false);
    const turn = {
      id: "1",
      roomId: "-100123",
      sender: "Synthetic",
      text: "",
      kind: "media",
      sentAt: "2026-09-18T00:21:30Z",
      fromMe: false,
    };
    expect(
      validateMessagesAnswer({ ok: true, hasEarlier: false, messages: [turn] }),
    ).toBe(true);
    const { sentAt: _sentAt, ...undated } = turn;
    expect(
      validateMessagesAnswer({
        ok: true,
        hasEarlier: false,
        messages: [undated],
      }),
    ).toBe(false);
    expect(Object.keys(adapterSse)).toEqual([
      "ready",
      "message",
      "cursor",
      "message.edited",
      "message.deleted",
      "reactions.updated",
      "ping",
      "error",
    ]);
  });

  test("an error code it does not know is still an error envelope", () => {
    expect(
      validateAdapterError({
        ok: false,
        error: { code: "FUTURE_ADAPTER_ERROR", message: "Synthetic" },
      }),
    ).toBe(true);
  });

  test("a room's own features narrow with false or a value in the feature's shape", () => {
    const room = { id: "r", title: "Synthetic", kind: "channel", unread: 0 };
    const rooms = (features: unknown) =>
      validateRoomsAnswer({
        ok: true,
        complete: true,
        rooms: [{ ...room, features }],
      });
    expect(rooms({ "messages.send": false })).toBe(true);
    expect(rooms({ "messages.read": { paging: "none", maxLimit: 10 } })).toBe(
      true,
    );
    expect(rooms({ "x-example.pins": false })).toBe(true);
    expect(rooms({ "messages.send": "no" })).toBe(false);
    expect(rooms({ "messages.send": true })).toBe(false);
    expect(
      rooms({ "messages.send": { maxLength: 0, receipt: "stored" } }),
    ).toBe(false);
  });

  test("attachments keep an id and a kind, and accept kinds this client does not know", () => {
    const turn = {
      id: "1",
      roomId: "r",
      sender: "Synthetic",
      text: "",
      kind: "media",
      sentAt: "2026-09-18T00:21:30Z",
      fromMe: false,
    };
    const messages = (attachments: unknown) =>
      validateMessagesAnswer({
        ok: true,
        hasEarlier: false,
        messages: [{ ...turn, attachments }],
      });
    const picture = {
      id: "r:1:f",
      kind: "image",
      mimeType: "image/jpeg",
      size: 1024,
      width: 640,
      height: 480,
    };
    expect(messages([picture])).toBe(true);
    expect(messages([{ ...picture, kind: "future-kind", futureKey: 1 }])).toBe(
      true,
    );
    expect(messages([])).toBe(false);
    const { id: _id, ...anonymous } = picture;
    expect(messages([anonymous])).toBe(false);
    expect(messages([{ ...picture, size: -1 }])).toBe(false);
    expect(messages([{ ...picture, width: 0 }])).toBe(false);
  });

  test("the generated version is the copied contract's", async () => {
    const copied = await Bun.file(
      new URL("../../contracts/tsuba.openapi.json", import.meta.url),
    ).json();
    expect(ADAPTER_CONTRACT_VERSION).toBe(copied.info.version);
  });
});
