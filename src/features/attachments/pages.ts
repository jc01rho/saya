import type { components } from "../../contract/decoded";

type Attachment = components["schemas"]["Attachment"];

export type AttachmentKind = Attachment["kind"];

/** `null` asks for every kind; the bridge filters, the client never guesses. */
export const KINDS: readonly (AttachmentKind | null)[] = [
  null,
  "photo",
  "video",
  "file",
  "link",
];

/** How many of the newest messages one page looks through (contract: 1..1000, default 50). */
export const PAGE_LIMIT = 200;

const identity = (item: Attachment) =>
  `${item.messageId}\u0000${item.kind}\u0000${item.url}`;

/**
 * The next page is older than everything held: it pages back from the oldest
 * message that carried something. Messages between that one and the true
 * edge of the last scan carried nothing, so looking through them again finds
 * nothing twice. With nothing held there is no id to page from.
 */
export function beforeIdOf(items: readonly Attachment[]): string | null {
  return items[0]?.messageId ?? null;
}

/**
 * Older page in front, oldest first like every list on the wire. An item the
 * two pages share — the page boundary message — is kept once.
 */
export function mergeOlder(
  held: readonly Attachment[],
  older: readonly Attachment[],
): Attachment[] {
  const seen = new Set(held.map(identity));
  return [...older.filter((item) => !seen.has(identity(item))), ...held];
}

export function formatSize(bytes: number | undefined): string | null {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
