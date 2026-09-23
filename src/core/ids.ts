/** Wire IDs are opaque strings: normalization is for comparison only. */
export type RoomId = string;
export type MessageId = string;

/** Compare signed decimal strings without converting either ID to a number. */
export function compareDecimalIds(left: string, right: string): -1 | 0 | 1 {
  const a = left.replace(/^-?0*/, "") || "0";
  const b = right.replace(/^-?0*/, "") || "0";
  const negativeA = left.startsWith("-") && a !== "0";
  const negativeB = right.startsWith("-") && b !== "0";
  if (negativeA !== negativeB) return negativeA ? -1 : 1;
  if (a === b) return 0;
  const smaller = a.length === b.length ? a < b : a.length < b.length;
  return smaller !== negativeA ? -1 : 1;
}

export function roomHash(roomId: RoomId): string {
  return `#/rooms/${encodeURIComponent(roomId)}`;
}

export function contextUrl(roomId: RoomId, limit = 40): string {
  const query = new URLSearchParams({ roomId, limit: String(limit) });
  return `/api/context?${query}`;
}
