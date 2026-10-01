import { useEffect, useState } from "react";

/**
 * One adapter as a list tab: its id, the name it declares once asked, and the
 * sum of its rooms' unread counts once it has listed them (null until then).
 */
export type AdapterTab = { id: string; name: string; unread: number | null };

/**
 * The adapters the proxy fronts, for the rail and the list tabs. The adapter
 * transport (and the adapter contract's validators) load in their own chunk,
 * so a client with no adapters pays nothing at start-up. Adapters that list
 * rooms are watched through the shared live store, so the rail's counts and
 * an open list share one request and one stream per adapter.
 */
export function useAdapterTabs(): AdapterTab[] {
  const [tabs, setTabs] = useState<AdapterTab[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void (async () => {
      const [{ listAdapters, fetchCapabilities }, live] = await Promise.all([
        import("../transport/adapters"),
        import("../features/adapters/liveRooms"),
      ]);
      const index = await listAdapters(signal);
      if (index.kind !== "listed" || signal.aborted) return;
      setTabs(index.ids.map((id) => ({ id, name: id, unread: null })));
      const listing: string[] = [];
      for (const id of index.ids) {
        const outcome = await fetchCapabilities(id, signal);
        if (signal.aborted) return;
        if (outcome.kind !== "connected") continue;
        const { name } = outcome.capabilities.provider;
        setTabs((current) =>
          current.map((tab) => (tab.id === id ? { ...tab, name } : tab)),
        );
        if (outcome.capabilities.features["rooms.list"]) listing.push(id);
      }
      const sync = () => {
        const rooms = live.adapterRoomsSnapshot();
        setTabs((current) =>
          current.map((tab) => {
            const unread = listing.includes(tab.id)
              ? live.unreadTotal(rooms.get(tab.id))
              : null;
            return unread === tab.unread ? tab : { ...tab, unread };
          }),
        );
      };
      const unsubscribe = live.subscribeAdapterRooms(sync);
      const unwatch = live.watchAdapterRooms(listing);
      sync();
      signal.addEventListener(
        "abort",
        () => {
          unsubscribe();
          unwatch();
        },
        { once: true },
      );
    })().catch(() => {
      // An abort, or a chunk that did not load, leaves the adapter tabs out.
    });
    return () => controller.abort();
  }, []);
  return tabs;
}
