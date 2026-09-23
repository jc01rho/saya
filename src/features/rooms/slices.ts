import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { ClientStores, Immutable, StoreSlices } from "../../core/stores";

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

export type RoomFilter = "all" | "people";

function sameIds(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

/**
 * The catalog order narrowed by the filter. "people" is the rooms whose kind is
 * "direct": the contract has no contacts route, so this is the only honest list.
 * The derived snapshot keeps its identity while the visible ids are unchanged,
 * so preview and unread updates on rows never rerender the list itself.
 */
function createVisibleRoomIds(stores: ClientStores, filter: RoomFilter) {
  let cached: readonly string[] | null = null;
  let dirty = true;
  const compute = (): readonly string[] => {
    const order = stores.getSnapshot("rooms.order");
    if (filter === "all") return order;
    return order.filter(
      (id) => stores.getSnapshot(`room.${id}`)?.room.kind === "direct",
    );
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
      roomUnsubscribes =
        filter === "all"
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
): readonly string[] {
  const source = useMemo(
    () => createVisibleRoomIds(stores, filter),
    [stores, filter],
  );
  return useSyncExternalStore(
    source.subscribe,
    source.getSnapshot,
    source.getSnapshot,
  );
}
