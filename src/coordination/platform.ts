import {
  type SseOutcome,
  type StreamRequest,
  streamEvents,
} from "../transport/sse";
import { IndexedMetadata, type MetadataStore } from "./metadata";
export interface ClockPort {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}
export interface ChannelPort {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage(message: unknown): void;
  close(): void;
}
export interface ChannelFactory {
  open(name: string): ChannelPort;
}
export interface LockPort {
  request<T>(
    name: string,
    options: {
      mode?: "exclusive";
      ifAvailable?: boolean;
      signal?: AbortSignal;
    },
    callback: (lock: { name: string } | null) => T | Promise<T>,
  ): Promise<T>;
}
export type StreamOpener = (request: StreamRequest) => Promise<SseOutcome>;
export interface Platform {
  locks: LockPort;
  channels: ChannelFactory;
  metadata: () => Promise<MetadataStore>;
  clock: ClockPort;
  openStream: StreamOpener;
  randomId(): string;
  visible(): boolean;
  listen(listener: () => void): () => void;
}
/** Failure means explicit manual refresh, never an uncoordinated stream. */
export function browserPlatform(): Platform | undefined {
  if (
    !globalThis.navigator?.locks ||
    !globalThis.BroadcastChannel ||
    !globalThis.indexedDB
  )
    return;
  let frozen = false;
  return {
    locks: navigator.locks,
    channels: {
      open(name) {
        const channel = new BroadcastChannel(name);
        const port: ChannelPort = {
          onmessage: null,
          postMessage: (message) => channel.postMessage(message),
          close: () => channel.close(),
        };
        channel.onmessage = (event) => port.onmessage?.({ data: event.data });
        return port;
      },
    },
    metadata: () => IndexedMetadata.open(indexedDB),
    clock: {
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (handle) =>
        clearTimeout(handle as ReturnType<typeof setTimeout>),
    },
    openStream: streamEvents,
    randomId: () => crypto.randomUUID(),
    visible: () => !frozen && document.visibilityState === "visible",
    listen(listener) {
      const freeze = () => {
        frozen = true;
        listener();
      };
      const resume = () => {
        frozen = false;
        listener();
      };
      document.addEventListener("freeze", freeze);
      document.addEventListener("visibilitychange", listener);
      document.addEventListener("resume", resume);
      window.addEventListener("focus", listener);
      return () => {
        document.removeEventListener("freeze", freeze);
        document.removeEventListener("visibilitychange", listener);
        document.removeEventListener("resume", resume);
        window.removeEventListener("focus", listener);
      };
    },
  };
}
