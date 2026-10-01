import { useSyncExternalStore } from "react";

/**
 * How the user arranged their own list: pinned rooms, hidden rooms and named
 * folders. It lives in this browser's localStorage only, keyed by the opaque
 * room id; no core is told, nothing is marked read, and a room the catalog no
 * longer carries is simply never matched.
 */
export interface RoomFolder {
  id: string;
  name: string;
  rooms: readonly string[];
}

export interface Organize {
  pinned: readonly string[];
  hidden: readonly string[];
  folders: readonly RoomFolder[];
}

export const EMPTY_ORGANIZE: Organize = Object.freeze({
  pinned: [],
  hidden: [],
  folders: [],
});

export const ORGANIZE_KEY = "saya.rooms.organize";
const MAX_IDS = 10_000;
export const MAX_FOLDERS = 50;
export const FOLDER_NAME_MAX = 40;

export function cleanFolderName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, FOLDER_NAME_MAX);
}

function idList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter(
    (id): id is string => typeof id === "string" && id !== "",
  );
  return [...new Set(ids)].slice(0, MAX_IDS);
}

/**
 * Reads a stored value back. Anything that is not the shape this file writes
 * (hand-edited, truncated, or from another version) is dropped member by
 * member, so one bad folder never costs the pins.
 */
export function parseOrganize(raw: string | null): Organize {
  if (!raw) return EMPTY_ORGANIZE;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    // A corrupt value is the user's own arrangement lost, not an app failure: start empty.
    return EMPTY_ORGANIZE;
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return EMPTY_ORGANIZE;
  const { pinned, hidden, folders } = data as Record<string, unknown>;
  const seen = new Set<string>();
  const kept: RoomFolder[] = [];
  for (const folder of Array.isArray(folders) ? folders : []) {
    if (!folder || typeof folder !== "object") continue;
    const { id, name, rooms } = folder as Record<string, unknown>;
    if (typeof id !== "string" || id === "" || seen.has(id)) continue;
    const clean = typeof name === "string" ? cleanFolderName(name) : "";
    if (!clean) continue;
    seen.add(id);
    kept.push({ id, name: clean, rooms: idList(rooms) });
    if (kept.length === MAX_FOLDERS) break;
  }
  return { pinned: idList(pinned), hidden: idList(hidden), folders: kept };
}

export function serializeOrganize(state: Organize): string {
  return JSON.stringify({ v: 1, ...state });
}

export interface RoomView {
  /** A folder id, or null for every room. A folder that no longer exists means every room. */
  folder: string | null;
  /** True shows only the hidden rooms, so they can be brought back. */
  hidden: boolean;
}

/**
 * Orders the catalog ids for display. Hidden rooms leave the list, a folder
 * keeps only its rooms, and pinned rooms move to the top. Both groups keep the
 * catalog's own order, which is most recent first, so pins sort by recency
 * among themselves. An unarranged list returns the input unchanged.
 */
export function arrangeRoomIds(
  ids: readonly string[],
  state: Organize,
  view: RoomView,
): readonly string[] {
  const hidden = new Set(state.hidden);
  if (view.hidden) return ids.filter((id) => hidden.has(id));
  const folder =
    view.folder === null
      ? undefined
      : state.folders.find((candidate) => candidate.id === view.folder);
  const inFolder = folder ? new Set(folder.rooms) : null;
  const pinned = new Set(state.pinned);
  if (hidden.size === 0 && pinned.size === 0 && !inFolder) return ids;
  const top: string[] = [];
  const rest: string[] = [];
  for (const id of ids) {
    if (hidden.has(id) || (inFolder && !inFolder.has(id))) continue;
    (pinned.has(id) ? top : rest).push(id);
  }
  return top.length ? [...top, ...rest] : rest;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export interface OrganizeStore {
  get: () => Organize;
  update: (change: (state: Organize) => Organize) => void;
  subscribe: (listener: () => void) => () => void;
  /** Takes a value another tab wrote. */
  receive: (raw: string | null) => void;
}

export function createOrganizeStore(
  storage: StorageLike | null,
): OrganizeStore {
  let current: Organize | null = null;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const get = () => {
    if (current === null) {
      let raw: string | null = null;
      try {
        raw = storage?.getItem(ORGANIZE_KEY) ?? null;
      } catch (error) {
        console.warn("Room arrangement could not be read", error);
      }
      current = parseOrganize(raw);
    }
    return current;
  };
  return {
    get,
    update(change) {
      const next = change(get());
      if (next === current) return;
      current = next;
      try {
        storage?.setItem(ORGANIZE_KEY, serializeOrganize(next));
      } catch (error) {
        // Quota or a locked-down profile: the arrangement still holds for this tab.
        console.warn("Room arrangement could not be saved", error);
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    receive(raw) {
      current = parseOrganize(raw);
      notify();
    },
  };
}

let shared: OrganizeStore | null = null;

/** The one store this page uses, following other tabs through the storage event. */
export function organizeStore(): OrganizeStore {
  if (shared) return shared;
  let storage: Storage | null = null;
  try {
    storage = globalThis.localStorage ?? null;
  } catch (error) {
    console.warn("Room arrangement storage is unavailable", error);
  }
  const store = createOrganizeStore(storage);
  globalThis.addEventListener?.("storage", (event: StorageEvent) => {
    if (event.key === ORGANIZE_KEY) store.receive(event.newValue);
  });
  shared = store;
  return store;
}

export function useOrganize(): Organize {
  const store = organizeStore();
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
