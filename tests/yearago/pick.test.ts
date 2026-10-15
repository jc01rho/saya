import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import {
  dayKey,
  LINE_LIMIT,
  PICTURE_LIMIT,
  pickYearAgo,
  yearAgo,
} from "../../src/features/yearago/pick";

type Message = components["schemas"]["Message"];

const ROOM = "18491246151592761";
let serial = 0;

/** An invented row sent at a local wall-clock moment, so the test holds in any zone. */
function row(sentAt: Date | null, extra: Partial<Message> = {}): Message {
  serial += 1;
  return {
    id: String(28000000000000000n + BigInt(serial)),
    roomId: ROOM,
    senderId: "38000000000000001",
    sender: "가상참여자-1",
    text: `가상 줄 ${serial}`,
    kind: "text",
    sentAt: sentAt ? sentAt.toISOString() : null,
    fromMe: false,
    ...extra,
  };
}

const local = (y: number, m: number, d: number, h = 12, min = 0, s = 0) =>
  new Date(y, m - 1, d, h, min, s);

describe("the day a year ago", () => {
  test("is the same month and day of the previous year", () => {
    expect(dayKey(yearAgo(local(2026, 10, 15)))).toBe("2025-10-15");
    expect(dayKey(yearAgo(local(2026, 1, 1)))).toBe("2025-01-01");
  });

  test("a leap day with no counterpart becomes the last day of February", () => {
    expect(dayKey(yearAgo(local(2028, 2, 29)))).toBe("2027-02-28");
  });
});

describe("picking the year-ago day from a window", () => {
  const today = local(2026, 10, 15, 9);

  test("nothing from that day means no card", () => {
    expect(pickYearAgo([], today)).toBeNull();
    expect(
      pickYearAgo(
        [row(local(2025, 10, 14)), row(local(2025, 10, 16)), row(null)],
        today,
      ),
    ).toBeNull();
  });

  test("the local calendar day is inclusive at both ends and nothing else", () => {
    const inside = [
      row(local(2025, 10, 15, 0, 0, 0)),
      row(local(2025, 10, 15, 23, 59, 59)),
    ];
    const outside = [
      row(local(2025, 10, 14, 23, 59, 59)),
      row(local(2025, 10, 16, 0, 0, 0)),
      row(local(2026, 10, 15, 9)),
      row(local(2024, 10, 15, 9)),
    ];
    const found = pickYearAgo([...outside, ...inside], today);
    expect(found?.count).toBe(2);
    expect(found?.lines.map((line) => line.id)).toEqual(
      inside.map((line) => line.id),
    );
    expect(dayKey(found?.day ?? today)).toBe("2025-10-15");
  });

  test("lines are the first few rows with words, oldest first, however the window was ordered", () => {
    const later = row(local(2025, 10, 15, 15));
    const earlier = row(local(2025, 10, 15, 8));
    const blank = row(local(2025, 10, 15, 9), { text: "   ", kind: "photo" });
    const covered = row(local(2025, 10, 15, 10), { covered: "safebot" });
    const more = Array.from({ length: LINE_LIMIT + 2 }, (_, index) =>
      row(local(2025, 10, 15, 16, index)),
    );
    const found = pickYearAgo([later, covered, blank, earlier, ...more], today);
    expect(found?.count).toBe(LINE_LIMIT + 6);
    expect(found?.lines).toHaveLength(LINE_LIMIT);
    expect(found?.lines[0]?.id).toBe(earlier.id);
    expect(found?.lines[1]?.id).toBe(later.id);
    expect(found?.lines.some((line) => line.id === blank.id)).toBe(false);
    expect(found?.lines.some((line) => line.id === covered.id)).toBe(false);
  });

  test("pictures are the first image of each photo row, a few at most", () => {
    const album = row(local(2025, 10, 15, 8), {
      kind: "photo",
      text: "",
      photo: {
        url: "https://cdn.example/first.jpg",
        width: 10,
        height: 20,
        count: 2,
        images: [
          { url: "https://cdn.example/a.jpg", width: 30, height: 40 },
          { url: "https://cdn.example/b.jpg", width: 50, height: 60 },
        ],
      },
    });
    const single = row(local(2025, 10, 15, 9), {
      kind: "photo",
      text: "",
      photo: {
        url: "https://cdn.example/c.jpg",
        width: 70,
        height: 80,
        count: 1,
        images: [],
      },
    });
    const extra = Array.from({ length: PICTURE_LIMIT }, (_, index) =>
      row(local(2025, 10, 15, 10, index), {
        kind: "photo",
        text: "",
        photo: {
          url: `https://cdn.example/x${index}.jpg`,
          width: 1,
          height: 1,
          count: 1,
          images: [],
        },
      }),
    );
    const found = pickYearAgo([single, album, ...extra], today);
    expect(found?.pictures).toHaveLength(PICTURE_LIMIT);
    expect(found?.pictures[0]).toEqual({
      messageId: album.id,
      url: "https://cdn.example/a.jpg",
      width: 30,
      height: 40,
    });
    expect(found?.pictures[1]).toEqual({
      messageId: single.id,
      url: "https://cdn.example/c.jpg",
      width: 70,
      height: 80,
    });
  });
});
