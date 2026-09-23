import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { sseEventSchemas, sseValidators } from "../../src/contract/sse";
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
      new URL("../../openapi.json", import.meta.url),
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
