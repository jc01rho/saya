export type Subscriber = {
  nonce: string;
  credit: 0 | 1;
  lastRequestSeq: number;
};
export type Attempt = {
  uuid: string;
  status: "attempting" | "submitted" | "unknown" | "rejected";
};
export type Metadata = {
  epoch: number;
  generation: number;
  head: number;
  subscribers: Subscriber[];
  attempts: Attempt[];
};
export interface MetadataStore {
  read(): Promise<Metadata>;
  update<T>(change: (state: Metadata) => T): Promise<T>;
  close(): void;
}
const initial = (): Metadata => ({
  epoch: 0,
  generation: 0,
  head: 0,
  subscribers: [],
  attempts: [],
});
function keys(value: object, allowed: string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new Error("Non-coordination metadata rejected");
}
function validate(state: Metadata) {
  keys(state, ["epoch", "generation", "head", "subscribers", "attempts"]);
  for (const item of state.subscribers)
    keys(item, ["nonce", "credit", "lastRequestSeq"]);
  for (const item of state.attempts) keys(item, ["uuid", "status"]);
  if (
    state.subscribers.length > 32 ||
    state.attempts.length > 32 ||
    new TextEncoder().encode(JSON.stringify(state)).byteLength > 512 * 1024
  )
    throw new Error("Coordination metadata capacity exceeded");
}
/** Test implementation with the same atomic copy/commit semantics as IndexedDB. */
export class MemoryMetadata implements MetadataStore {
  private state = initial();
  async read() {
    return structuredClone(this.state);
  }
  async update<T>(change: (state: Metadata) => T): Promise<T> {
    const next = structuredClone(this.state);
    const result = change(next);
    validate(next);
    this.state = next;
    return result;
  }
  close() {}
}
export class IndexedMetadata implements MetadataStore {
  private constructor(private readonly db: IDBDatabase) {}
  static open(factory: IDBFactory): Promise<IndexedMetadata> {
    return new Promise((resolve, reject) => {
      const request = factory.open("saya:coordination:v1", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("metadata");
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Coordination metadata blocked"));
      request.onsuccess = () => resolve(new IndexedMetadata(request.result));
    });
  }
  read() {
    return this.transaction("readonly", (state) => state);
  }
  update<T>(change: (state: Metadata) => T) {
    return this.transaction("readwrite", change);
  }
  private transaction<T>(
    mode: IDBTransactionMode,
    change: (state: Metadata) => T,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("metadata", mode);
      const store = tx.objectStore("metadata");
      const request = store.get("coordination");
      let result: T;
      let failure: unknown;
      request.onsuccess = () => {
        try {
          const state: Metadata = request.result ?? initial();
          result = change(state);
          validate(state);
          if (mode === "readwrite") store.put(state, "coordination");
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () =>
        reject(
          failure ?? tx.error ?? new Error("Metadata transaction aborted"),
        );
      tx.onerror = () => reject(tx.error);
    });
  }
  close() {
    this.db.close();
  }
}
