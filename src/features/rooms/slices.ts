import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { ClientStores, Immutable, StoreSlices } from "../../core/stores";
import { arrangeRoomIds, EMPTY_ORGANIZE, type Organize } from "./organize";

/** One store slice as React state. Unchanged slices return the identical reference, so nothing rerenders. */
export function useSlice<K extends keyof StoreSlices>(
  stores: ClientStores,
  key: K,
): Immutable<StoreSlices[K]> {
  const subscribe = useCallback(
    (listener: () => void) => stores.subscribe(key, listener),
    [stores, key],
  );
  const read = useCallback(() => stores.getSnapshot(key), [stores, key]);
  return useSyncExternalStore(subscribe, read, read);
}

export type RoomFilter = "all" | "unread" | "people" | "group";

type RoomOf = Immutable<StoreSlices[`room.${string}`]>;

/**
 * Each filter reads only members the contract carries. 안읽음 is the desktop's
 * count (G2); 사람 is `kind: "direct"`, because there is no contacts route;
 * 그룹 is the two group kinds the contract names, `group` and `open-group`. A kind
 * the contract does not name is listed under 전체 only, never guessed into one.
 */
function passes(snapshot: RoomOf, filter: RoomFilter, query: string): boolean {
  if (!snapshot) return false;
  const { room } = snapshot;
  if (filter === "unread" && room.unread <= 0) return false;
  if (filter === "people" && room.kind !== "direct") return false;
  if (filter === "group" && room.kind !== "group" && room.kind !== "open-group")
    return false;
  return query === "" || room.title.toLocaleLowerCase("ko-KR").includes(query);
}

function sameIds(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

/**
 * The catalog order narrowed by the filter and by the search words, which are
 * matched against the titles this client already holds and nothing else: the
 * contract has no search route. The derived snapshot keeps its identity while
 * the visible ids are unchanged, so preview and unread updates on rows never
 * rerender the list itself.
 */
function createVisibleRoomIds(
  stores: ClientStores,
  filter: RoomFilter,
  query: string,
  organize: Organize,
  folder: string | null,
  hidden: boolean,
) {
  let cached: readonly string[] | null = null;
  let dirty = true;
  const narrowed = filter !== "all" || query !== "";
  const compute = (): readonly string[] => {
    const order = stores.getSnapshot("rooms.order");
    const matched = narrowed
      ? order.filter((id) =>
          passes(stores.getSnapshot(`room.${id}`), filter, query),
        )
      : order;
    return arrangeRoomIds(matched, organize, { folder, hidden });
  };
  const getSnapshot = (): readonly string[] => {
    if (!dirty && cached) return cached;
    const next = compute();
    dirty = false;
    if (cached && sameIds(cached, next)) return cached;
    cached = next;
    return cached;
  };
  const subscribe = (listener: () => void) => {
    let roomUnsubscribes: (() => void)[] = [];
    const changed = () => {
      dirty = true;
      listener();
    };
    const watchRooms = () => {
      for (const unsubscribe of roomUnsubscribes) unsubscribe();
      roomUnsubscribes = !narrowed
        ? []
        : stores
            .getSnapshot("rooms.order")
            .map((id) => stores.subscribe(`room.${id}`, changed));
    };
    const unsubscribeOrder = stores.subscribe("rooms.order", () => {
      watchRooms();
      changed();
    });
    watchRooms();
    // Anything published between the first read and this subscription is recomputed on React's check.
    dirty = true;
    return () => {
      unsubscribeOrder();
      for (const unsubscribe of roomUnsubscribes) unsubscribe();
    };
  };
  return { subscribe, getSnapshot };
}

export function useVisibleRoomIds(
  stores: ClientStores,
  filter: RoomFilter,
  query = "",
  organize: Organize = EMPTY_ORGANIZE,
  folder: string | null = null,
  hidden = false,
): readonly string[] {
  const words = query.trim().toLocaleLowerCase("ko-KR");
  const source = useMemo(
    () => createVisibleRoomIds(stores, filter, words, organize, folder, hidden),
    [stores, filter, words, organize, folder, hidden],
  );
  return useSyncExternalStore(
    source.subscribe,
    source.getSnapshot,
    source.getSnapshot,
  );
}
