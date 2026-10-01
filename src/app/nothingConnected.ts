import type { AdapterTabsState } from "./adapterTabs";

/** Loading is not evidence of disconnection, even when another source is down. */
export function nothingConnected(
  core: "loading" | "ready" | "failed" | "unreachable" | "over-capacity",
  adapters: AdapterTabsState,
): boolean {
  return (
    core !== "loading" &&
    core !== "ready" &&
    adapters.index !== "checking" &&
    adapters.tabs.every(
      ({ connection }) =>
        connection.kind !== "checking" && connection.kind !== "connected",
    )
  );
}
