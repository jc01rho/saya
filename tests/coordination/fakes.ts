import type { Coordinator } from "../../src/coordination/coordinator";
import { MemoryMetadata } from "../../src/coordination/metadata";
import type {
  ChannelPort,
  ClockPort,
  LockPort,
  Platform,
} from "../../src/coordination/platform";
import type { SseOutcome, StreamRequest } from "../../src/transport/sse";
import { Barriers, bounded, deferred } from "../harness/barriers";

export class ManualClock implements ClockPort {
  private serial = 0;
  readonly timers = new Map<number, { fn: () => void; ms: number }>();
  setTimeout(fn: () => void, ms: number) {
    const id = ++this.serial;
    this.timers.set(id, { fn, ms });
    return id;
  }
  clearTimeout(id: unknown) {
    this.timers.delete(id as number);
  }
  fire(ms: number) {
    const found = [...this.timers].find(([, timer]) => timer.ms === ms);
    if (!found) throw new Error(`No timer with delay ${ms}`);
    this.timers.delete(found[0]);
    found[1].fn();
  }
}
class Locks implements LockPort {
  private readonly held = new Set<string>();
  private readonly waits = new Map<string, Set<() => void>>();
  async request<T>(
    name: string,
    options: Parameters<LockPort["request"]>[1],
    callback: (lock: { name: string } | null) => T | Promise<T>,
  ): Promise<T> {
    if (options.ifAvailable && this.held.has(name)) return callback(null);
    while (this.held.has(name)) {
      if (options.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
      const change = deferred<void>();
      const waiters = this.waits.get(name) ?? new Set();
      this.waits.set(name, waiters);
      waiters.add(change.resolve);
      const abort = () =>
        change.reject(new DOMException("Aborted", "AbortError"));
      options.signal?.addEventListener("abort", abort, { once: true });
      try {
        await change.promise;
      } finally {
        waiters.delete(change.resolve);
        options.signal?.removeEventListener("abort", abort);
      }
    }
    if (options.signal?.aborted)
      throw new DOMException("Aborted", "AbortError");
    this.held.add(name);
    try {
      return await callback({ name });
    } finally {
      this.held.delete(name);
      for (const wake of this.waits.get(name) ?? []) wake();
    }
  }
}
export class World {
  readonly metadata = new MemoryMetadata();
  readonly locks = new Locks();
  readonly traffic = new Barriers<{ channel: string; data: unknown }>();
  readonly log: { channel: string; data: unknown }[] = [];
  readonly ports = new Map<string, Set<ChannelPort>>();
  readonly streams: StreamRequest[] = [];
  readonly opened = new Barriers<StreamRequest>();
  drop: ((channel: string, data: unknown) => boolean) | undefined;
  active = 0;
  maximum = 0;
  private serial = 0;
  channel(name: string): ChannelPort {
    const peers = this.ports.get(name) ?? new Set();
    this.ports.set(name, peers);
    const port: ChannelPort = {
      onmessage: null,
      close: () => {
        peers.delete(port);
      },
      postMessage: (data) => {
        this.log.push({ channel: name, data });
        this.traffic.emit({ channel: name, data });
        if (this.drop?.(name, data)) return;
        for (const peer of peers)
          if (peer !== port)
            queueMicrotask(() => {
              if (peers.has(peer))
                peer.onmessage?.({ data: structuredClone(data) });
            });
      },
    };
    peers.add(port);
    return port;
  }
  platform(clock = new ManualClock()): Platform {
    return {
      locks: this.locks,
      channels: { open: (name) => this.channel(name) },
      metadata: async () => this.metadata,
      clock,
      randomId: () => `tab-${++this.serial}`,
      visible: () => true,
      listen: () => () => {},
      openStream: (request) => {
        this.streams.push(request);
        this.active++;
        this.maximum = Math.max(this.maximum, this.active);
        const done = deferred<SseOutcome>();
        request.signal.addEventListener(
          "abort",
          () => {
            this.active--;
            done.resolve({ kind: "aborted" });
          },
          { once: true },
        );
        this.opened.emit(request);
        return done.promise;
      },
    };
  }
}
export function status(coordinator: Coordinator, mode: string) {
  const ready = deferred<void>();
  const unsubscribe = coordinator.status.subscribe(() => {
    if (coordinator.status.getSnapshot().mode === mode) ready.resolve();
  });
  return bounded(ready.promise, `status ${mode}`).finally(unsubscribe);
}
