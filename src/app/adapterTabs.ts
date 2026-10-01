import { useCallback, useEffect, useState } from "react";
import type { AdapterOutcome } from "../transport/adapters";

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

export type AdapterConnection = { kind: "checking" } | AdapterOutcome;
export type AdapterTab = {
  id: string;
  name: string;
  unread: number | null;
  connection: AdapterConnection;
};
export type AdapterIndexState =
  | "checking"
  | "listed"
  | "unconfigured"
  | "unreachable";
export type AdapterTabsState = {
  tabs: AdapterTab[];
  index: AdapterIndexState;
};

/** Shared list tabs and their first capability checks; failed adapters keep retrying. */
export function useAdapterTabs() {
  const [state, setState] = useState<AdapterTabsState>({
    tabs: [],
    index: "checking",
  });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState((current) => ({
      index: "checking",
      tabs:
        attempt === 0
          ? []
          : current.tabs.map((tab) => ({
              ...tab,
              connection: { kind: "checking" },
            })),
    }));
    void (async () => {
      // Keep transport and validators in the adapter chunk.
      const [{ listAdapters, fetchCapabilities }, live] = await Promise.all([
        import("../transport/adapters"),
        import("../features/adapters/liveRooms"),
      ]);
      const index = await listAdapters(signal);
      if (signal.aborted) return;
      if (index.kind !== "listed") {
        setState({ tabs: [], index: index.kind });
        return;
      }
      setState({
        index: index.ids.length ? "listed" : "unconfigured",
        tabs: index.ids.map((id) => ({
          id,
          name: id,
          unread: null,
          connection: { kind: "checking" },
        })),
      });
      const listing = new Set<string>();
      const unwatch: (() => void)[] = [];
      const sync = () => {
        const rooms = live.adapterRoomsSnapshot();
        setState((current) => ({
          ...current,
          tabs: current.tabs.map((tab) => {
            const unread = listing.has(tab.id)
              ? live.unreadTotal(rooms.get(tab.id))
              : null;
            return unread === tab.unread ? tab : { ...tab, unread };
          }),
        }));
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
        for (let failures = 0; !signal.aborted; failures += 1) {
          const outcome = await fetchCapabilities(id, signal);
          if (signal.aborted) return;
          setState((current) => ({
            ...current,
            tabs: current.tabs.map((tab) =>
              tab.id === id
                ? {
                    ...tab,
                    connection: outcome,
                    name:
                      outcome.kind === "connected"
                        ? outcome.capabilities.provider.name
                        : tab.name,
                  }
                : tab,
            ),
          }));
          if (outcome.kind === "incompatible") return;
          if (outcome.kind === "connected") {
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
      if (!signal.aborted) setState({ tabs: [], index: "unreachable" });
    });
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry };
}
