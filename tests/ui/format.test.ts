import { describe, expect, test } from "bun:test";
import { formatTime } from "../../src/ui/format";

/**
 * A row's time is read in the reader's own zone, so these instants are built
 * locally: a fixed offset would make the same assertion pass in Seoul and fail
 * wherever CI happens to run.
 */
const local = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
) => new Date(year, month - 1, day, hour, minute).toISOString();

const NOW = new Date(local(2026, 9, 23, 17, 0));
const at = (iso: string) => formatTime(iso, NOW).label;

describe("a row's time is absolute, and as short as the row can afford", () => {
  test("the same day shows the clock", () => {
    expect(at(local(2026, 9, 23, 9, 5))).toBe("09:05");
    expect(at(local(2026, 9, 23, 0, 0))).toBe("00:00");
  });

  test("this year shows the date in words", () => {
    expect(at(local(2026, 4, 7, 9, 5))).toBe("4월 7일");
  });

  test("an older year is numeric, so the title keeps the row", () => {
    expect(at(local(2023, 12, 28, 9, 5))).toBe("23.12.28");
    expect(at(local(2018, 1, 15, 9, 5))).toBe("18.01.15");
    expect(at(local(1970, 1, 1, 9, 5))).toBe("70.01.01");
  });

  test("a missing or unreadable instant is said, never guessed", () => {
    expect(formatTime(null, NOW)).toEqual({
      label: "시간 미상",
      dateTime: null,
    });
    expect(formatTime("not a time", NOW)).toEqual({
      label: "시간 미상",
      dateTime: null,
    });
  });

  test("a drawn time carries the instant it was drawn from", () => {
    const iso = local(2023, 12, 28, 9, 5);
    expect(formatTime(iso, NOW).dateTime).toBe(iso);
  });
});
