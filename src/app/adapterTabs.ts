import { useEffect, useState } from "react";

/** One adapter as a list tab: its id, and the name it declares once asked. */
export type AdapterTab = { id: string; name: string };

/**
 * The adapters the proxy fronts, for the rail and the list tabs. The adapter
 * transport (and the adapter contract's validators) load in their own chunk,
 * so a client with no adapters pays nothing at start-up.
 */
export function useAdapterTabs(): AdapterTab[] {
  const [tabs, setTabs] = useState<AdapterTab[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void (async () => {
      const { listAdapters, fetchCapabilities } = await import(
        "../transport/adapters"
      );
      const index = await listAdapters(signal);
      if (index.kind !== "listed" || signal.aborted) return;
      setTabs(index.ids.map((id) => ({ id, name: id })));
      for (const id of index.ids) {
        const outcome = await fetchCapabilities(id, signal);
        if (signal.aborted) return;
        if (outcome.kind !== "connected") continue;
        const { name } = outcome.capabilities.provider;
        setTabs((current) =>
          current.map((tab) => (tab.id === id ? { id, name } : tab)),
        );
      }
    })().catch(() => {
      // An abort, or a chunk that did not load, leaves the adapter tabs out.
    });
    return () => controller.abort();
  }, []);
  return tabs;
}
