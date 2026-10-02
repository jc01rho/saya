export type AgentCall = {
  id: number;
  name: string;
  at: number;
  ok: boolean | null;
};
export type AgentSnapshot = {
  supported: boolean;
  enabled: boolean;
  /** The tool a call is inside right now, for the mark on the screen. */
  running: string | null;
  /** The last ten calls, newest first. Nothing of what they read is kept. */
  calls: readonly AgentCall[];
};

export const CALL_LOG = 10;
export const SETTING_KEY = "saya.agent-tools";

/** Storage can be refused outright (a blocked third-party context); that is not a failure to report. */
export function readSetting(storage: Storage | null): boolean {
  try {
    return storage?.getItem(SETTING_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeSetting(storage: Storage | null, enabled: boolean): void {
  try {
    storage?.setItem(SETTING_KEY, enabled ? "on" : "off");
  } catch {}
}

export function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The whole state of the experiment: off unless this tab was told otherwise. */
export class AgentToolsState {
  private snapshot: AgentSnapshot;
  private serial = 0;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: Storage | null = browserStorage(),
    supported = false,
  ) {
    this.snapshot = {
      supported,
      enabled: supported && readSetting(storage),
      running: null,
      calls: [],
    };
  }

  readonly getSnapshot = (): AgentSnapshot => this.snapshot;
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(next: Partial<AgentSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...next };
    for (const listener of this.listeners) listener();
  }

  setSupported(supported: boolean): void {
    this.publish({
      supported,
      enabled: supported && readSetting(this.storage),
    });
  }

  /** Consent is the caller's to take; this only records it. */
  setEnabled(enabled: boolean): void {
    writeSetting(this.storage, enabled);
    this.publish({
      enabled: enabled && this.snapshot.supported,
      running: null,
    });
  }

  readonly begin = (name: string): ((ok: boolean) => void) => {
    const call: AgentCall = {
      id: ++this.serial,
      name,
      at: Date.now(),
      ok: null,
    };
    this.publish({
      running: name,
      calls: [call, ...this.snapshot.calls].slice(0, CALL_LOG),
    });
    return (ok: boolean) => {
      this.publish({
        running: null,
        calls: this.snapshot.calls.map((entry) =>
          entry === call ? { ...entry, ok } : entry,
        ),
      });
    };
  };
}
