/**
 * KakaoTalk's run rule: consecutive messages by one person within the same
 * local minute (HH:mm) are one run. The run's first bubble carries the
 * picture, the name and the tail; its last carries the time. A new minute,
 * another speaker, a day pill, a stated gap or a system row starts a new run.
 */
export interface RunMember {
  fromMe: boolean;
  senderId?: string | null | undefined;
  sender?: string | null | undefined;
  sentAt?: string | null | undefined;
  kind?: string | null | undefined;
}

/** The local calendar day of a timestamp, or null when the wire gave none. */
export function dayOf(sentAt: string | null | undefined): string | null {
  if (!sentAt) return null;
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** The day pill's words: 2026년 10월 7일 수요일. */
export const DAY_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "full",
});

/** Rows the desktop draws centred, not as anybody's bubble: they never join a run. */
const SYSTEM_KINDS = new Set(["feed"]);

/** The local calendar minute of a timestamp, or null when the wire gave none. */
export function minuteOf(sentAt: string | null | undefined): string | null {
  if (!sentAt) return null;
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
}

function speaker(member: RunMember): string | null {
  if (member.fromMe) return "\u0000me";
  return member.senderId || member.sender || null;
}

/** Whether `next` continues the run `prev` belongs to. Undated or unattributed rows never join. */
export function sameRun(
  prev: RunMember | undefined,
  next: RunMember | undefined,
): boolean {
  if (!prev || !next) return false;
  if (SYSTEM_KINDS.has(prev.kind ?? "") || SYSTEM_KINDS.has(next.kind ?? ""))
    return false;
  const who = speaker(next);
  const minute = minuteOf(next.sentAt);
  return (
    who !== null &&
    minute !== null &&
    prev.fromMe === next.fromMe &&
    speaker(prev) === who &&
    minuteOf(prev.sentAt) === minute
  );
}

export interface RunPosition {
  /** Draws the picture, the name and the tail. */
  first: boolean;
  /** Draws the time. */
  last: boolean;
}

/**
 * Where one row sits in its run. `breakBefore` / `breakAfter` are what the
 * wall draws between rows regardless of the messages: a day pill or a stated
 * gap. A day pill always coincides with a new minute, but a gap may not.
 */
export function runPosition(
  prev: RunMember | undefined,
  current: RunMember,
  next: RunMember | undefined,
  breaks: { before?: boolean; after?: boolean } = {},
): RunPosition {
  return {
    first: breaks.before === true || !sameRun(prev, current),
    last: breaks.after === true || !sameRun(current, next),
  };
}
