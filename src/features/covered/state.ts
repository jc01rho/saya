export const COVERED_SETTING_KEY = "saya.show-covered";
type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): PreferenceStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Only the preference is persisted. Message text stays in the session's memory. */
export class CoveredMessagesState {
  private enabled: boolean;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: PreferenceStorage | null = browserStorage(),
  ) {
    this.enabled = this.read();
  }

  readonly getSnapshot = (): boolean => this.enabled;
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** A storage event in another tab replaces this tab's preference too. */
  readonly sync = (): void => this.publish(this.read());

  setEnabled(enabled: boolean): void {
    try {
      this.storage?.setItem(COVERED_SETTING_KEY, enabled ? "on" : "off");
    } catch {}
    this.publish(enabled);
  }

  private read(): boolean {
    try {
      return this.storage?.getItem(COVERED_SETTING_KEY) === "on";
    } catch {
      return false;
    }
  }

  private publish(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    for (const listener of this.listeners) listener();
  }
}
