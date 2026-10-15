import type { components } from "../../contract/decoded";

type Message = components["schemas"]["Message"];
type Coverage = components["schemas"]["Coverage"];

export type Period = "year" | "30d";
export const PERIODS: readonly Period[] = ["year", "30d"];
export const RECENT_DAYS = 30;

export const WORD_LIMIT = 8;
export const EMOJI_LIMIT = 6;
export const SENDER_LIMIT = 6;

export type Range = { from: Date; to: Date };

/** 올해 is from 1 January at local midnight; 최근 30일 is the last 30 calendar days, today included. */
export function periodRange(period: Period, now: Date): Range {
  const from =
    period === "year"
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - (RECENT_DAYS - 1),
        );
  return { from, to: now };
}

function sentAtOf(row: Message): number | null {
  if (!row.sentAt) return null;
  const at = Date.parse(row.sentAt);
  return Number.isNaN(at) ? null : at;
}

export function inRange(rows: readonly Message[], range: Range): Message[] {
  const from = range.from.getTime();
  const to = range.to.getTime();
  return rows.filter((row) => {
    const at = sentAtOf(row);
    return at !== null && at >= from && at <= to;
  });
}

const URL_LIKE = /https?:\/\/\S+|www\.\S+/gi;
const TOKEN = /[\p{L}\p{N}]+/gu;
const LAUGH = /^[ㅋ]+$/;
const GIGGLE = /^[ㅎ]+$/;
const CRY = /^[ㅠㅜ]+$/;
const DIGITS = /^\p{N}+$/u;

/**
 * Words as a messenger counts them: letters and digits between anything
 * else, lower-cased, two characters or more, with addresses and bare numbers
 * left out. Runs of ㅋ, ㅎ and ㅠ are one word each however long they are,
 * so ㅋㅋ and ㅋㅋㅋㅋ count together.
 */
export function tokenize(text: string): string[] {
  const words: string[] = [];
  for (const raw of text.replace(URL_LIKE, " ").matchAll(TOKEN)) {
    const token = raw[0].toLowerCase();
    if (LAUGH.test(token)) words.push("ㅋㅋ");
    else if (GIGGLE.test(token)) words.push("ㅎㅎ");
    else if (CRY.test(token)) words.push("ㅠㅠ");
    else if ([...token].length >= 2 && !DIGITS.test(token)) words.push(token);
  }
  return words;
}

export type Counted = { key: string; count: number };

function top(counts: Map<string, number>, limit: number): Counted[] {
  return [...counts]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, "ko"))
    .slice(0, limit);
}

export function topWords(
  rows: readonly Message[],
  limit = WORD_LIMIT,
): Counted[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.covered) continue;
    for (const word of tokenize(row.text))
      counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return top(counts, limit);
}

/** One pictograph with its variation selector, skin tone and ZWJ joins, as the keyboard sends it. */
const EMOJI =
  /\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*/gu;

export function emojiOf(text: string): string[] {
  return [...text.matchAll(EMOJI)].map((match) => match[0]);
}

export function topEmoji(
  rows: readonly Message[],
  limit = EMOJI_LIMIT,
): Counted[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.covered) continue;
    for (const emoji of emojiOf(row.text))
      counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  return top(counts, limit);
}

/** Rows per local weekday (0 = Sunday) and hour. */
export type Heatmap = readonly (readonly number[])[];

export function heatmapOf(rows: readonly Message[]): Heatmap {
  const cells = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const row of rows) {
    const at = sentAtOf(row);
    if (at === null) continue;
    const sent = new Date(at);
    const day = cells[sent.getDay()];
    const hour = sent.getHours();
    if (day) day[hour] = (day[hour] ?? 0) + 1;
  }
  return cells;
}

export type SenderCount = {
  senderId: string;
  /** The name that account carries now, as every row of it does. */
  sender: string;
  count: number;
  fromMe: boolean;
};

/** Everyone who spoke, most rows first; the id says who, the newest name says what to call them. */
export function bySender(rows: readonly Message[]): SenderCount[] {
  const counts = new Map<string, SenderCount>();
  for (const row of rows) {
    const kept = counts.get(row.senderId);
    if (kept) {
      kept.count += 1;
      kept.sender = row.sender;
    } else
      counts.set(row.senderId, {
        senderId: row.senderId,
        sender: row.sender,
        count: 1,
        fromMe: row.fromMe,
      });
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.sender.localeCompare(b.sender, "ko"),
  );
}

export type Recap = {
  period: Period;
  range: Range;
  /** Rows inside the period, oldest first. */
  count: number;
  first: Date | null;
  last: Date | null;
  /** The oldest row the window holds, whatever the period: where the record this card is drawn from begins. */
  windowFrom: Date | null;
  /** Rows the room holds beyond the window, by the bridge's own count. */
  beyondWindow: number;
  speakers: number;
  photos: number;
  words: Counted[];
  emoji: Counted[];
  senders: SenderCount[];
  heatmap: Heatmap;
  busiest: { day: number; hour: number; count: number } | null;
};

export function recapOf(
  rows: readonly Message[],
  coverage: Coverage | null,
  period: Period,
  now: Date,
): Recap {
  const range = periodRange(period, now);
  const inside = inRange(rows, range).sort(
    (a, b) => (sentAtOf(a) ?? 0) - (sentAtOf(b) ?? 0),
  );
  const dated = rows.map(sentAtOf).filter((at): at is number => at !== null);
  const heatmap = heatmapOf(inside);
  let busiest: Recap["busiest"] = null;
  heatmap.forEach((hours, day) => {
    hours.forEach((count, hour) => {
      if (count > 0 && (busiest === null || count > busiest.count))
        busiest = { day, hour, count };
    });
  });
  const firstAt = sentAtOf(inside[0] ?? ({} as Message));
  const lastAt = sentAtOf(inside.at(-1) ?? ({} as Message));
  const senders = bySender(inside);
  return {
    period,
    range,
    count: inside.length,
    first: firstAt === null ? null : new Date(firstAt),
    last: lastAt === null ? null : new Date(lastAt),
    windowFrom: dated.length > 0 ? new Date(Math.min(...dated)) : null,
    beyondWindow: Math.max(0, (coverage?.storedLocally ?? 0) - rows.length),
    speakers: senders.length,
    photos: inside.filter((row) => row.photo !== undefined).length,
    words: topWords(inside),
    emoji: topEmoji(inside),
    senders,
    heatmap,
    busiest,
  };
}
