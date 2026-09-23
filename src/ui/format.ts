import { COPY } from "./copy";

export interface FormattedTime {
  /** What the row shows; 시간 미상 when the wire gives null or garbage (G9). */
  label: string;
  /** The ISO instant for a <time> element, or null when there is none. */
  dateTime: string | null;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Absolute local time, deliberately not relative: relative words need a ticking
 * clock and rerenders. Same day shows the clock; older shows the date.
 */
export function formatTime(
  iso: string | null | undefined,
  now: Date,
): FormattedTime {
  if (!iso) return { label: COPY.unknownTime, dateTime: null };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return { label: COPY.unknownTime, dateTime: null };
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay)
    return {
      label: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
      dateTime: iso,
    };
  const sameYear = date.getFullYear() === now.getFullYear();
  // A row is a title beside its time, and the time takes what it needs first.
  // Spelled out, an older year took a third of a 262px list and left the title
  // six characters; the numeric form is what the rest of the year gives back.
  const label = sameYear
    ? `${date.getMonth() + 1}월 ${date.getDate()}일`
    : `${pad(date.getFullYear() % 100)}.${pad(date.getMonth() + 1)}.${pad(
        date.getDate(),
      )}`;
  return { label, dateTime: iso };
}

/** Exact 1..99, then 99+; zero draws nothing. */
export function badgeLabel(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.floor(count));
}
