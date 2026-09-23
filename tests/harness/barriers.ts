/** Register an exact signal before the action. Timers are deadlines, never delays. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

export async function bounded<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 10_000,
): Promise<T> {
  const deadline = deferred<never>();
  const timer = setTimeout(
    () => deadline.reject(new Error(`Timeout: ${label}`)),
    timeoutMs,
  );
  try {
    return await Promise.race([promise, deadline.promise]);
  } finally {
    clearTimeout(timer);
  }
}

export class Barriers<T> {
  private listeners = new Set<(event: T) => void>();

  expect(predicate: (event: T) => boolean, label: string, timeoutMs = 10_000) {
    const result = deferred<T>();
    const listener = (event: T) => {
      if (predicate(event)) result.resolve(event);
    };
    this.listeners.add(listener);
    return bounded(result.promise, label, timeoutMs).finally(() => {
      this.listeners.delete(listener);
    });
  }

  emit(event: T) {
    for (const listener of this.listeners) listener(event);
  }

  get pending() {
    return this.listeners.size;
  }
}
