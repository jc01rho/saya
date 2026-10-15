/**
 * Which rooms' cards were closed, and on which day. A close is remembered for
 * that room and that day only: the same room shows its card again on another
 * day that has a year-ago counterpart. It lives in this browser's localStorage,
 * keyed by the opaque room id; no core is told and nothing is marked read.
 */
export const CLOSED_KEY = "saya.yearago.closed";
/** Rooms remembered at most; beyond it the oldest entries go. */
export const CLOSED_LIMIT = 200;

export type Closed = Readonly<Record<string, string>>;

type Store = Pick<Storage, "getItem" | "setItem">;

function isDayKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Reads what was remembered; anything that is not room → day is dropped. */
export function loadClosed(storage: Store | null): Closed {
  if (!storage) return {};
  let raw: string | null;
  try {
    raw = storage.getItem(CLOSED_KEY);
  } catch {
    return {};
  }
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    return {};
  const closed: Record<string, string> = {};
  for (const [roomId, day] of Object.entries(parsed))
    if (roomId !== "" && isDayKey(day)) closed[roomId] = day;
  return closed;
}

export function isClosed(closed: Closed, roomId: string, day: string): boolean {
  return closed[roomId] === day;
}

/**
 * Remembers a close. Insertion order is age: a room closed again moves to the
 * end, and past the limit the oldest rooms are forgotten first. A storage that
 * refuses the write leaves the memory unchanged for this session only.
 */
export function rememberClosed(
  storage: Store | null,
  closed: Closed,
  roomId: string,
  day: string,
): Closed {
  const next: Record<string, string> = {};
  for (const [id, when] of Object.entries(closed))
    if (id !== roomId) next[id] = when;
  next[roomId] = day;
  const ids = Object.keys(next);
  for (const id of ids.slice(0, Math.max(0, ids.length - CLOSED_LIMIT)))
    delete next[id];
  try {
    storage?.setItem(CLOSED_KEY, JSON.stringify(next));
  } catch {
    // Quota or a disabled store: the card stays closed for this session.
  }
  return next;
}

export function browserStorage(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
