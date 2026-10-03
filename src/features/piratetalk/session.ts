import {
  type Discovery,
  PirateTalkTransport,
} from "../../transport/piratetalk";

/** One probe per core session. Only explicit reconnect starts another. */
export class PirateTalkSession {
  private state: Discovery = { kind: "checking" };
  private readonly listeners = new Set<() => void>();
  private request: AbortController | null = null;
  private started = false;

  constructor(readonly transport = new PirateTalkTransport()) {}

  getSnapshot = (): Discovery => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): void {
    if (this.started) return;
    this.started = true;
    this.probe();
  }

  reconnect = (): void => {
    this.started = true;
    this.request?.abort();
    this.probe();
  };

  private probe(): void {
    const request = new AbortController();
    this.request = request;
    this.publish({ kind: "checking" });
    void this.transport.discover(request.signal).then(
      (state) => {
        if (this.request === request && !request.signal.aborted)
          this.publish(state);
      },
      () => {
        if (this.request === request && !request.signal.aborted)
          this.publish({ kind: "unreachable" });
      },
    );
  }

  private publish(state: Discovery): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}
