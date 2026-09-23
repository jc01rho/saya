export type Immutable<T> = T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T;

/** Plain decoded data only. Own every changed node; share every equal node. */
export function immutable<T>(value: T, previous?: Immutable<T>): Immutable<T> {
  if (Object.is(value, previous)) return previous as Immutable<T>;
  if (value === null || typeof value !== "object") return value as Immutable<T>;
  const old =
    previous !== null && typeof previous === "object" ? previous : undefined;
  const entries = Object.entries(value);
  const oldRecord = old as Record<string, unknown> | undefined;
  const result: Record<string, unknown> = Object.create(null);
  let equal =
    old !== undefined &&
    Array.isArray(value) === Array.isArray(old) &&
    Object.keys(old).length === entries.length;
  for (const [key, child] of entries) {
    result[key] = immutable(child, oldRecord?.[key]);
    if (
      !oldRecord ||
      !Object.hasOwn(oldRecord, key) ||
      result[key] !== oldRecord[key]
    )
      equal = false;
  }
  if (equal) return previous as Immutable<T>;
  return Object.freeze(
    Array.isArray(value) ? Object.values(result) : result,
  ) as Immutable<T>;
}

/** Key-scoped subscriptions, with all slices committed before any notification. */
export class SliceStore<S extends object> {
  private readonly values = new Map<keyof S, unknown>();
  private readonly listeners = new Map<keyof S, Set<() => void>>();
  private readonly changed = new Set<keyof S>();
  private depth = 0;

  constructor(
    private readonly initial: <K extends keyof S>(key: K) => Immutable<S[K]>,
  ) {}

  readonly getSnapshot = <K extends keyof S>(key: K): Immutable<S[K]> => {
    return this.values.has(key)
      ? (this.values.get(key) as Immutable<S[K]>)
      : this.initial(key);
  };

  readonly subscribe = <K extends keyof S>(
    key: K,
    listener: () => void,
  ): (() => void) => {
    let group = this.listeners.get(key);
    if (!group) {
      group = new Set();
      this.listeners.set(key, group);
    }
    group.add(listener);
    return () => {
      group.delete(listener);
      if (group.size === 0) this.listeners.delete(key);
    };
  };

  protected set<K extends keyof S>(
    key: K,
    value: S[K] | Immutable<S[K]>,
  ): void {
    const previous = this.getSnapshot(key);
    const next = immutable(value, previous);
    if (Object.is(next, previous)) return;
    this.values.set(key, next);
    this.changed.add(key);
    this.flush();
  }

  batch(action: () => void): void {
    this.depth++;
    try {
      action();
    } finally {
      this.depth--;
      this.flush();
    }
  }

  private flush(): void {
    if (this.depth !== 0) return;
    const keys = [...this.changed];
    this.changed.clear();
    const notify = new Set<() => void>();
    for (const key of keys) {
      for (const listener of this.listeners.get(key) ?? [])
        notify.add(listener);
    }
    for (const listener of notify) listener();
  }
}
