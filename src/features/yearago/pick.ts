import type { components } from "../../contract/decoded";

type Message = components["schemas"]["Message"];

/** Lines the card quotes, and pictures it shows, at most. */
export const LINE_LIMIT = 3;
export const PICTURE_LIMIT = 4;

/** A local calendar day as `yyyy-mm-dd`, the key the card remembers a close by. */
export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The same month and day one year earlier, on the local calendar. A 29
 * February with no counterpart falls back to 28 February rather than rolling
 * over into March as `Date` would on its own.
 */
export function yearAgo(today: Date): Date {
  const target = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate(),
  );
  if (target.getMonth() !== today.getMonth()) target.setDate(0);
  return target;
}

export type YearAgoPicture = {
  messageId: string;
  url: string;
  width: number;
  height: number;
};

export type YearAgo = {
  /** The day the rows were sent, at local midnight. */
  day: Date;
  /** Every row of that day, oldest first. */
  count: number;
  /** Rows with words, the first few of the day. */
  lines: readonly Message[];
  /** The first picture of each photo row, the first few of the day. */
  pictures: readonly YearAgoPicture[];
};

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * What this room held on the same day one year before `today`, or null when
 * the rows carry nothing from that day. Rows are the room's newest window
 * (`HistorySource`), so an active room whose window stops short of a year
 * simply has no card: the contract offers no older page to ask for.
 */
export function pickYearAgo(
  rows: readonly Message[],
  today: Date,
): YearAgo | null {
  const day = yearAgo(today);
  const that: Message[] = [];
  for (const row of rows) {
    if (!row.sentAt) continue;
    const sent = new Date(row.sentAt);
    if (Number.isNaN(sent.getTime())) continue;
    if (sameDay(sent, day)) that.push(row);
  }
  if (that.length === 0) return null;
  that.sort((a, b) => Date.parse(a.sentAt ?? "") - Date.parse(b.sentAt ?? ""));
  const lines = that
    .filter((row) => row.text.trim() !== "" && !row.covered)
    .slice(0, LINE_LIMIT);
  const pictures: YearAgoPicture[] = [];
  for (const row of that) {
    if (pictures.length >= PICTURE_LIMIT) break;
    const photo = row.photo;
    if (!photo) continue;
    const first = photo.images[0] ?? {
      url: photo.url,
      width: photo.width,
      height: photo.height,
    };
    if (!first.url) continue;
    pictures.push({
      messageId: row.id,
      url: first.url,
      width: first.width,
      height: first.height,
    });
  }
  return { day, count: that.length, lines, pictures };
}
