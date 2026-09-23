import { useMemo, useSyncExternalStore } from "react";

/**
 * Hash routes. Room ids are opaque wire strings: they are percent-encoded into
 * the hash and decoded back, never parsed, compared numerically or shortened.
 */
export type Route = { kind: "rooms" } | { kind: "room"; roomId: string };

export const ROOMS_HASH = "#/rooms";

export function roomHash(roomId: string): string {
  return `#/room/${encodeURIComponent(roomId)}`;
}

const INDEX: Route = { kind: "rooms" };
// `#/room/<id>` is the route this app writes; `#/rooms/<id>` is what
// core/ids.ts#roomHash spells, accepted so neither helper yields a dead link.
const ROOM = /^\/rooms?\/([^/]+)$/;

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/\?.*$/, "");
  const match = ROOM.exec(path);
  if (!match?.[1]) return INDEX;
  try {
    const roomId = decodeURIComponent(match[1]);
    return roomId ? { kind: "room", roomId } : INDEX;
  } catch {
    // A malformed escape is not a room; the index is the honest fallback.
    return INDEX;
  }
}

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function readHash() {
  return window.location.hash;
}

/** The current route; the snapshot is the hash string so an unchanged hash never rerenders. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribeHash, readHash, readHash);
  return useMemo(() => parseHash(hash), [hash]);
}
