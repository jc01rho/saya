import type { components } from "../../contract/decoded";
import type { WindowEdge } from "../../core/context";
import { compareDecimalIds } from "../../core/ids";
import type { Immutable } from "../../core/stores";

type Message = components["schemas"]["Message"];
type ReplySource = components["schemas"]["ReplySource"];

/** How much of the quoted text has to agree; the reply's copy may be clipped or since edited. */
const PREFIX = 24;

function normalize(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/** Whether the quote can name anything at all: an all-null copy points nowhere. */
export function isJumpable(source: ReplySource | null | undefined): boolean {
  if (!source) return false;
  return Boolean(
    source.messageId ||
      source.senderId ||
      source.sender ||
      normalize(source.text),
  );
}

/**
 * The message a reply answered, among the rows on screen.
 *
 * The reply's own `messageId` decides when it is there, and while it can still
 * be older than the window nothing else is matched. Otherwise a row is a
 * candidate only when it is older than the reply, from the same person
 * (`senderId`, else the name), and its text agrees with the quote's opening —
 * or, for a quote with no text, its kind agrees. Of the candidates the
 * nearest one before the reply wins. Nothing is guessed from less than that.
 */
export function findReplyTarget(
  source: ReplySource | null | undefined,
  replyId: string,
  rows: readonly Immutable<Message>[],
): string | null {
  if (!source || !isJumpable(source)) return null;
  if (source.messageId) {
    const exact = rows.find((row) => row.id === source.messageId);
    if (exact) return exact.id;
    // Older than every row on screen: widen toward it rather than settle for
    // a row that merely says the same words.
    if (mayBeOlder(source, rows)) return null;
  }
  const quoted = normalize(source.text).slice(0, PREFIX);
  if (!quoted && !source.kind) return null;
  if (!source.senderId && !source.sender) return null;
  let best: string | null = null;
  for (const row of rows) {
    if (compareDecimalIds(row.id, replyId) >= 0) continue;
    if (
      source.senderId
        ? row.senderId !== source.senderId
        : row.sender !== source.sender
    ) {
      continue;
    }
    if (quoted) {
      const own = normalize(row.text);
      if (!own.startsWith(quoted) && !quoted.startsWith(own.slice(0, PREFIX))) {
        continue;
      }
      if (!own) continue;
    } else if (row.kind !== source.kind) continue;
    if (best === null || compareDecimalIds(row.id, best) > 0) best = row.id;
  }
  return best;
}

/**
 * Whether a reply's original can still turn up by widening the window. With a
 * `messageId` older than every row on screen it can; one newer than the oldest
 * row that is not on screen never will.
 */
export function mayBeOlder(
  source: ReplySource,
  rows: readonly Immutable<Message>[],
): boolean {
  const oldest = rows[0];
  if (!source.messageId || !oldest) return true;
  return compareDecimalIds(source.messageId, oldest.id) < 0;
}

export type JumpStep =
  | { kind: "reveal"; id: string }
  /** Ask the window for more and look again when it settles. */
  | { kind: "widen" }
  /** A request is in flight; nothing to do until it lands. */
  | { kind: "wait" }
  | { kind: "missing" };

/**
 * One step of the search for a reply's original. The window only ever widens
 * 40 → 200 → 1000, so the search ends at the ceiling or wherever the bridge
 * says nothing older is stored.
 */
export function nextJumpStep(input: {
  found: string | null;
  edge: WindowEdge;
  loading: boolean;
  failed: boolean;
  /** False once the reply's own id proves the original is not older than the window. */
  older: boolean;
}): JumpStep {
  if (input.found !== null) return { kind: "reveal", id: input.found };
  if (input.failed) return { kind: "missing" };
  if (input.loading || input.edge === "widening") return { kind: "wait" };
  if (input.edge === "widen" && input.older) return { kind: "widen" };
  return { kind: "missing" };
}

/** Rows that arrived after `seen`, the newest row when the reader left the bottom. */
export function countNewer(
  order: readonly string[],
  seen: string | null,
): number {
  if (seen === null) return 0;
  let count = 0;
  for (let index = order.length - 1; index >= 0; index--) {
    const id = order[index];
    if (id === undefined || compareDecimalIds(id, seen) <= 0) break;
    count++;
  }
  return count;
}

/** The way down is offered once the reader is at least one screen above the end. */
export function isFarFromEnd(geometry: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): boolean {
  const distance =
    geometry.scrollHeight - geometry.clientHeight - geometry.scrollTop;
  return geometry.clientHeight > 0 && distance >= geometry.clientHeight;
}
