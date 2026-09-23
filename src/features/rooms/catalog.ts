import { useCallback, useEffect, useRef, useState } from "react";
import type { BoundedCache } from "../../core/cache";
import { type HttpClient, HttpProtocolError } from "../../transport/http";
import { type ConnectionState, connectionStateFor } from "../connection";

export type CatalogPhase =
  | { kind: "loading" }
  | { kind: "ready" }
  /** The bridge answered with an error envelope; the connection feature names the screen. */
  | { kind: "failed"; state: ConnectionState }
  /** No usable answer at all: the proxy is unreachable or the envelope was not the contract's. */
  | { kind: "unreachable"; reason: "network" | "protocol" }
  /** The catalog exceeds the client's 8 MiB policy and was refused rather than truncated. */
  | { kind: "over-capacity" };

/**
 * Loads GET /rooms into the bounded cache: once on mount, again on reload.
 * This is the only request the list ever causes; previews come from bodies
 * observed elsewhere, never from a per-room fetch (G1).
 */
export function useCatalog(
  http: HttpClient,
  cache: BoundedCache,
): { phase: CatalogPhase; reload: () => void } {
  const [phase, setPhase] = useState<CatalogPhase>({ kind: "loading" });
  const current = useRef<AbortController | null>(null);

  // Each start abandons the request before it; the transport's generation fence
  // also discards any earlier /rooms response that is still in flight.
  const start = useCallback(() => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setPhase({ kind: "loading" });
    http.request({ path: "/rooms", signal: controller.signal }).then(
      (outcome) => {
        if (outcome.kind === "discarded") return;
        if (outcome.kind === "failure") {
          setPhase({ kind: "failed", state: connectionStateFor(outcome) });
          return;
        }
        setPhase(
          cache.setCatalog(outcome.data.rooms)
            ? { kind: "ready" }
            : { kind: "over-capacity" },
        );
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setPhase({
          kind: "unreachable",
          reason: error instanceof HttpProtocolError ? "protocol" : "network",
        });
      },
    );
  }, [http, cache]);

  useEffect(() => {
    start();
    return () => current.current?.abort();
  }, [start]);

  return { phase, reload: start };
}
