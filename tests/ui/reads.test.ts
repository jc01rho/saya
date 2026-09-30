import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import {
  beforeIdOf,
  formatSize,
  mergeOlder,
} from "../../src/features/attachments/pages";
import {
  isUnsupported,
  READ_COPY,
  type ReadFailure,
  readFailureCopy,
} from "../../src/features/reads";

type Attachment = components["schemas"]["Attachment"];

const bridge = (status: number, code: string): ReadFailure => ({
  kind: "bridge",
  outcome: { kind: "failure", status, error: { code, message: "x" } },
});

describe("refused reads", () => {
  test("the 0.15.0 codes get their own words", () => {
    expect(readFailureCopy(bridge(404, "MESSAGE_NOT_FOUND"))).toEqual({
      title: READ_COPY.messageNotFound,
      code: "MESSAGE_NOT_FOUND",
      hint: null,
    });
    expect(readFailureCopy(bridge(410, "FILE_EXPIRED")).title).toBe(
      READ_COPY.fileExpired,
    );
  });

  test("a 404 about no room or message is a core without the route", () => {
    expect(isUnsupported(bridge(404, "INVALID_REQUEST"))).toBe(true);
    expect(readFailureCopy(bridge(404, "INVALID_REQUEST")).hint).toBe(
      READ_COPY.olderCore,
    );
    expect(isUnsupported(bridge(404, "CHAT_NOT_FOUND"))).toBe(false);
    expect(isUnsupported(bridge(404, "MESSAGE_NOT_FOUND"))).toBe(false);
    expect(isUnsupported(bridge(503, "BUSY"))).toBe(false);
    expect(isUnsupported({ kind: "network" })).toBe(false);
  });

  test("an invented code takes the default branch with its code shown", () => {
    expect(readFailureCopy(bridge(500, "FUTURE_CORE_ERROR"))).toEqual({
      title: READ_COPY.failed,
      code: "FUTURE_CORE_ERROR",
      hint: null,
    });
  });
});

const item = (messageId: string, url: string): Attachment => ({
  messageId,
  kind: "photo",
  senderId: "38000000000000001",
  sender: "가상참여자-1",
  sentAt: null,
  url,
});

describe("attachment pages", () => {
  test("an older page goes in front, and the shared boundary item is kept once", () => {
    const held = [
      item("28000000000000205", "https://example.invalid/b"),
      item("28000000000000209", "https://example.invalid/c"),
    ];
    const older = [
      item("28000000000000101", "https://example.invalid/a"),
      item("28000000000000205", "https://example.invalid/b"),
    ];
    expect(mergeOlder(held, older).map((entry) => entry.url)).toEqual([
      "https://example.invalid/a",
      "https://example.invalid/b",
      "https://example.invalid/c",
    ]);
  });

  test("the next page starts at the oldest id held, and nothing held means no page", () => {
    expect(
      beforeIdOf([
        item("28000000000000205", "https://example.invalid/b"),
        item("28000000000000209", "https://example.invalid/c"),
      ]),
    ).toBe("28000000000000205");
    expect(beforeIdOf([])).toBeNull();
  });

  test("sizes read as a person reads them", () => {
    expect(formatSize(undefined)).toBeNull();
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(1536)).toBe("1.5 KB");
    expect(formatSize(25 * 1024 * 1024)).toBe("25 MB");
  });
});
