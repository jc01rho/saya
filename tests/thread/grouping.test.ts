import { describe, expect, test } from "bun:test";
import {
  minuteOf,
  type RunMember,
  runPosition,
  sameRun,
} from "../../src/features/thread/grouping";

/** Local wall-clock times, so the minute boundary is the reader's, not UTC's. */
const at = (day: number, hour: number, minute: number, second = 0) =>
  new Date(2037, 3, day, hour, minute, second).toISOString();

const other = (sentAt: string, senderId = "u1", kind = "text"): RunMember => ({
  fromMe: false,
  senderId,
  sender: `가상참여자-${senderId}`,
  sentAt,
  kind,
});
const mine = (sentAt: string): RunMember => ({
  fromMe: true,
  senderId: "me",
  sentAt,
  kind: "text",
});

/** Positions of a whole wall, as [first, last] pairs. */
function positions(rows: RunMember[], gaps: number[] = []) {
  return rows.map((row, i) => {
    const p = runPosition(rows[i - 1], row, rows[i + 1], {
      before: gaps.includes(i),
      after: gaps.includes(i + 1),
    });
    return [p.first, p.last];
  });
}

describe("one run per speaker per minute", () => {
  test("three messages in one minute: the first leads, the last is timed", () => {
    expect(
      positions([
        other(at(7, 15, 4, 1)),
        other(at(7, 15, 4, 20)),
        other(at(7, 15, 4, 59)),
      ]),
    ).toEqual([
      [true, false],
      [false, false],
      [false, true],
    ]);
  });

  test("the minute boundary splits a run even one second apart", () => {
    expect(
      positions([other(at(7, 15, 4, 59)), other(at(7, 15, 5, 0))]),
    ).toEqual([
      [true, true],
      [true, true],
    ]);
  });

  test("another speaker in between starts new runs; my own side follows the same rule", () => {
    expect(
      positions([
        other(at(7, 9, 0)),
        other(at(7, 9, 0), "u2"),
        mine(at(7, 9, 0)),
        mine(at(7, 9, 0, 30)),
        other(at(7, 9, 0)),
      ]),
    ).toEqual([
      [true, true],
      [true, true],
      [true, false],
      [false, true],
      [true, true],
    ]);
  });

  test("the same clock minute on another day is another run", () => {
    expect(sameRun(other(at(7, 23, 59)), other(at(8, 23, 59)))).toBe(false);
    expect(minuteOf(at(7, 23, 59))).not.toBe(minuteOf(at(8, 23, 59)));
  });

  test("a system row breaks the run and never joins one", () => {
    expect(
      positions([
        other(at(7, 9, 0)),
        other(at(7, 9, 0), "u1", "feed"),
        other(at(7, 9, 0)),
      ]),
    ).toEqual([
      [true, true],
      [true, true],
      [true, true],
    ]);
  });

  test("a stated gap between rows breaks the run", () => {
    expect(positions([other(at(7, 9, 0)), other(at(7, 9, 0))], [1])).toEqual([
      [true, true],
      [true, true],
    ]);
  });

  test("undated or unattributed rows stand alone", () => {
    const undated = { ...other(at(7, 9, 0)), sentAt: null };
    expect(sameRun(undated, undated)).toBe(false);
    const nobody = { fromMe: false, sentAt: at(7, 9, 0), kind: "text" };
    expect(sameRun(nobody, nobody)).toBe(false);
    expect(minuteOf("not a date")).toBeNull();
  });

  test("without a senderId the name decides", () => {
    const a = { fromMe: false, sender: "가상참여자-1", sentAt: at(7, 9, 0) };
    expect(sameRun(a, { ...a })).toBe(true);
    expect(sameRun(a, { ...a, sender: "가상참여자-2" })).toBe(false);
  });
});
