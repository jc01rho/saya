import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import {
  bySender,
  EMOJI_LIMIT,
  emojiOf,
  heatmapOf,
  inRange,
  periodRange,
  RECENT_DAYS,
  recapOf,
  tokenize,
  topEmoji,
  topWords,
  WORD_LIMIT,
} from "../../src/features/recap/stats";

type Message = components["schemas"]["Message"];
type Coverage = components["schemas"]["Coverage"];

const ROOM = "18491246151592761";
let serial = 0;

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

const local = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min);

const coverageOf = (storedLocally: number): Coverage => ({
  localOnly: true,
  reachesLatestKnown: true,
  catalogLatestMessageId: null,
  newestReadMessageId: null,
  hasEarlier: true,
  storedLocally,
});

describe("periods", () => {
  const now = local(2026, 10, 15, 9, 30);

  test("올해 starts at local midnight on 1 January and ends now", () => {
    const { from, to } = periodRange("year", now);
    expect(from.getTime()).toBe(local(2026, 1, 1, 0, 0).getTime());
    expect(to).toBe(now);
  });

  test("최근 30일 is thirty calendar days with today as the last", () => {
    const { from } = periodRange("30d", now);
    expect(from.getTime()).toBe(local(2026, 9, 16, 0, 0).getTime());
    const days = (now.getTime() - from.getTime()) / 86_400_000;
    expect(Math.ceil(days)).toBe(RECENT_DAYS);
  });

  test("a row is inside when it is between the edges inclusive, and undated rows never are", () => {
    const range = periodRange("30d", now);
    const edge = row(range.from);
    const inside = row(local(2026, 10, 1));
    const late = row(new Date(now.getTime() + 1));
    const early = row(new Date(range.from.getTime() - 1));
    const picked = inRange([late, early, inside, row(null), edge], range);
    expect(picked.map((item) => item.id)).toEqual([inside.id, edge.id]);
  });
});

describe("words", () => {
  test("letters and digits between anything else, two or more, without addresses or bare numbers", () => {
    expect(
      tokenize(
        "오늘 점심 뭐 먹지? https://example.invalid/메뉴 12시에 봐요 12 ok!",
      ),
    ).toEqual(["오늘", "점심", "먹지", "12시에", "봐요", "ok"]);
  });

  test("case folds, and laughter of any length counts as one word", () => {
    expect(tokenize("Hello HELLO ㅋㅋㅋㅋ ㅋㅋ ㅎㅎㅎ ㅠㅠㅠ ㅜㅜ")).toEqual([
      "hello",
      "hello",
      "ㅋㅋ",
      "ㅋㅋ",
      "ㅎㅎ",
      "ㅠㅠ",
      "ㅠㅠ",
    ]);
  });

  test("the most used words come first, ties alphabetically, covered rows left out", () => {
    const rows = [
      row(local(2026, 1, 1), { text: "등불 등불 별빛" }),
      row(local(2026, 1, 2), { text: "별빛 모형 등불" }),
      row(local(2026, 1, 3), {
        text: "비밀 비밀 비밀 비밀",
        covered: "safebot",
      }),
      ...Array.from({ length: WORD_LIMIT + 3 }, (_, index) =>
        row(local(2026, 1, 4), { text: `단어${index}` }),
      ),
    ];
    const words = topWords(rows);
    expect(words).toHaveLength(WORD_LIMIT);
    expect(words.slice(0, 2)).toEqual([
      { key: "등불", count: 3 },
      { key: "별빛", count: 2 },
    ]);
    // Ties in Korean order: 단어0 … 단어5 before 모형, each once.
    expect(words[2]).toEqual({ key: "단어0", count: 1 });
    expect(words.every((word, index) => index < 2 || word.count === 1)).toBe(
      true,
    );
    expect(words.some((word) => word.key === "비밀")).toBe(false);
  });
});

describe("emoji", () => {
  test("a joined sequence, a skin tone and a text-style variant are each one emoji", () => {
    expect(emojiOf("👨‍👩‍👧 좋아요 👍🏽 ❤️ 1234 #")).toEqual([
      "👨‍👩‍👧",
      "👍🏽",
      "❤️",
    ]);
  });

  test("the most used emoji come first and the list is bounded", () => {
    const rows = [
      row(local(2026, 1, 1), { text: "😂😂😂 🙏" }),
      row(local(2026, 1, 2), { text: "🙏 😂" }),
      ...Array.from({ length: EMOJI_LIMIT + 2 }, (_, index) =>
        row(local(2026, 1, 3), { text: String.fromCodePoint(0x1f950 + index) }),
      ),
    ];
    const emoji = topEmoji(rows);
    expect(emoji).toHaveLength(EMOJI_LIMIT);
    expect(emoji[0]).toEqual({ key: "😂", count: 4 });
    expect(emoji[1]).toEqual({ key: "🙏", count: 2 });
  });
});

describe("who and when", () => {
  test("the heatmap bins rows by local weekday and hour", () => {
    const sunday = local(2026, 10, 11, 23, 59);
    const monday = local(2026, 10, 12, 0, 0);
    const map = heatmapOf([row(sunday), row(sunday), row(monday), row(null)]);
    expect(map).toHaveLength(7);
    expect(map.every((day) => day.length === 24)).toBe(true);
    expect(map[0]?.[23]).toBe(2);
    expect(map[1]?.[0]).toBe(1);
    expect(map.flat().reduce((sum, cell) => sum + cell, 0)).toBe(3);
  });

  test("senders are counted by id, called by their newest name, busiest first", () => {
    const rows = [
      row(local(2026, 1, 1), { senderId: "1", sender: "옛 이름" }),
      row(local(2026, 1, 2), { senderId: "2", sender: "나", fromMe: true }),
      row(local(2026, 1, 3), { senderId: "1", sender: "새 이름" }),
      row(local(2026, 1, 4), { senderId: "3", sender: "가" }),
      row(local(2026, 1, 5), { senderId: "2", sender: "나", fromMe: true }),
    ];
    expect(bySender(rows)).toEqual([
      { senderId: "2", sender: "나", count: 2, fromMe: true },
      { senderId: "1", sender: "새 이름", count: 2, fromMe: false },
      { senderId: "3", sender: "가", count: 1, fromMe: false },
    ]);
  });
});

describe("the recap of a window", () => {
  const now = local(2026, 10, 15, 9);

  test("counts only the period, dates its first and last row, and says what lies beyond the window", () => {
    const old = row(local(2025, 12, 31, 23, 59), { text: "작년" });
    const january = row(local(2026, 1, 5), {
      text: "올해 첫 줄",
      photo: {
        url: "https://cdn.example/a.jpg",
        width: 1,
        height: 1,
        count: 1,
        images: [{ url: "https://cdn.example/a.jpg", width: 1, height: 1 }],
      },
    });
    const recent = row(local(2026, 10, 1, 20), {
      text: "최근 줄 😂",
      senderId: "2",
      sender: "나",
      fromMe: true,
    });
    const again = row(local(2026, 10, 1, 20, 30), {
      text: "같은 저녁",
      senderId: "2",
      sender: "나",
      fromMe: true,
    });
    const rows = [recent, old, again, january];
    const year = recapOf(rows, coverageOf(50), "year", now);
    expect(year.count).toBe(3);
    expect(year.first?.getTime()).toBe(local(2026, 1, 5).getTime());
    expect(year.last?.getTime()).toBe(local(2026, 10, 1, 20, 30).getTime());
    expect(year.windowFrom?.getTime()).toBe(
      local(2025, 12, 31, 23, 59).getTime(),
    );
    expect(year.beyondWindow).toBe(46);
    expect(year.speakers).toBe(2);
    expect(year.photos).toBe(1);
    expect(year.emoji).toEqual([{ key: "😂", count: 1 }]);
    expect(year.busiest).toEqual({ day: 4, hour: 20, count: 2 });

    const month = recapOf(rows, null, "30d", now);
    expect(month.count).toBe(2);
    expect(month.first?.getTime()).toBe(local(2026, 10, 1, 20).getTime());
    expect(month.beyondWindow).toBe(0);
    expect(month.senders).toEqual([
      { senderId: "2", sender: "나", count: 2, fromMe: true },
    ]);
  });

  test("an empty period has no dates and no busiest hour", () => {
    const recap = recapOf([row(local(2020, 1, 1))], null, "30d", now);
    expect(recap.count).toBe(0);
    expect(recap.first).toBeNull();
    expect(recap.last).toBeNull();
    expect(recap.busiest).toBeNull();
    expect(recap.windowFrom?.getTime()).toBe(local(2020, 1, 1).getTime());
  });
});
