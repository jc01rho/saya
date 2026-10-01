import { useEffect, useState } from "react";

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

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
 * an open list share one request and one stream per adapter. An adapter
 * that is down when the client starts is asked again, backing off, until it
 * answers; one outside this client's contract range is not asked again.
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
      const listing = new Set<string>();
      const unwatch: (() => void)[] = [];
      const sync = () => {
        const rooms = live.adapterRoomsSnapshot();
        setTabs((current) =>
          current.map((tab) => {
            const unread = listing.has(tab.id)
              ? live.unreadTotal(rooms.get(tab.id))
              : null;
            return unread === tab.unread ? tab : { ...tab, unread };
          }),
        );
      };
      const unsubscribe = live.subscribeAdapterRooms(sync);
      signal.addEventListener(
        "abort",
        () => {
          unsubscribe();
          for (const stop of unwatch) stop();
        },
        { once: true },
      );
      const resolve = async (id: string) => {
        for (let failures = 0; ; failures += 1) {
          const outcome = await fetchCapabilities(id, signal);
          if (signal.aborted || outcome.kind === "incompatible") return;
          if (outcome.kind === "connected") {
            const { name } = outcome.capabilities.provider;
            setTabs((current) =>
              current.map((tab) => (tab.id === id ? { ...tab, name } : tab)),
            );
            if (!outcome.capabilities.features["rooms.list"]) return;
            listing.add(id);
            unwatch.push(live.watchAdapterRooms([id]));
            sync();
            return;
          }
          await pause(
            Math.min(30_000, 1000 * 2 ** Math.min(failures + 1, 5)),
            signal,
          );
        }
      };
      await Promise.all(index.ids.map(resolve));
    })().catch(() => {
      // An abort, or a chunk that did not load, leaves the adapter tabs out.
    });
    return () => controller.abort();
  }, []);
  return tabs;
}
