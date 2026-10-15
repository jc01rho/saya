import { describe, expect, test } from "bun:test";
import {
  CLOSED_KEY,
  CLOSED_LIMIT,
  isClosed,
  loadClosed,
  rememberClosed,
} from "../../src/features/yearago/store";
import { memoryStorage } from "../theme/fakes";

describe("remembering a closed 작년 오늘 card", () => {
  test("nothing remembered, no storage, or garbage means nothing is closed", () => {
    expect(loadClosed(null)).toEqual({});
    expect(loadClosed(memoryStorage())).toEqual({});
    expect(loadClosed(memoryStorage(true))).toEqual({});
    const storage = memoryStorage();
    storage.setItem(CLOSED_KEY, "{not json");
    expect(loadClosed(storage)).toEqual({});
    storage.setItem(CLOSED_KEY, JSON.stringify(["1", "2"]));
    expect(loadClosed(storage)).toEqual({});
    storage.setItem(
      CLOSED_KEY,
      JSON.stringify({
        "1": "2026-10-15",
        "2": 7,
        "3": "yesterday",
        "": "2026-10-15",
      }),
    );
    expect(loadClosed(storage)).toEqual({ "1": "2026-10-15" });
  });

  test("a close holds for that room on that day only, and survives a reload", () => {
    const storage = memoryStorage();
    const closed = rememberClosed(storage, {}, "1", "2026-10-15");
    expect(isClosed(closed, "1", "2026-10-15")).toBe(true);
    expect(isClosed(closed, "1", "2026-10-16")).toBe(false);
    expect(isClosed(closed, "2", "2026-10-15")).toBe(false);
    expect(isClosed(loadClosed(storage), "1", "2026-10-15")).toBe(true);
  });

  test("closing again on a later day replaces the earlier day", () => {
    const storage = memoryStorage();
    let closed = rememberClosed(storage, {}, "1", "2026-10-15");
    closed = rememberClosed(storage, closed, "1", "2026-10-16");
    expect(isClosed(closed, "1", "2026-10-15")).toBe(false);
    expect(isClosed(closed, "1", "2026-10-16")).toBe(true);
    expect(Object.keys(loadClosed(storage))).toEqual(["1"]);
  });

  test("past the limit the rooms closed longest ago are forgotten first", () => {
    const storage = memoryStorage();
    let closed = {};
    for (let index = 0; index < CLOSED_LIMIT + 2; index++)
      closed = rememberClosed(storage, closed, String(index), "2026-10-15");
    expect(Object.keys(closed)).toHaveLength(CLOSED_LIMIT);
    expect(isClosed(closed, "0", "2026-10-15")).toBe(false);
    expect(isClosed(closed, "1", "2026-10-15")).toBe(false);
    expect(isClosed(closed, "2", "2026-10-15")).toBe(true);
    expect(isClosed(closed, String(CLOSED_LIMIT + 1), "2026-10-15")).toBe(true);
    expect(loadClosed(storage)).toEqual(closed);
  });

  test("a storage that refuses the write still closes the card for this session", () => {
    const closed = rememberClosed(memoryStorage(true), {}, "1", "2026-10-15");
    expect(isClosed(closed, "1", "2026-10-15")).toBe(true);
    expect(
      isClosed(rememberClosed(null, {}, "1", "2026-10-15"), "1", "2026-10-15"),
    ).toBe(true);
  });
});
