import type { components } from "../../../contract/piratetalk/decoded";
import { PirateTalkTransport } from "../../../transport/piratetalk";

type Schemas = components["schemas"];
export type HistoryPage = Schemas["HistoryResponse"];
export type SearchPage = Schemas["SearchResponse"];
export type AttachmentPage = Schemas["AttachmentsResponse"];
export type Message = Schemas["Message"];
export type Attachment = Schemas["Attachment"];
export type Coverage = Schemas["Coverage"];
export type ReadOperation =
  | { readonly kind: "history"; readonly request: Schemas["HistoryRequest"] }
  | { readonly kind: "search"; readonly request: Schemas["SearchRequest"] }
  | {
      readonly kind: "attachments";
      readonly request: Schemas["AttachmentsRequest"];
    };
export type ReadPage = HistoryPage | SearchPage | AttachmentPage;

export class HistorySearchError extends Error {
  constructor(
    readonly code: string,
    detail: string,
  ) {
    super(detail);
  }
}

export interface ReadClient {
  read(operation: ReadOperation, signal: AbortSignal): Promise<ReadPage>;
}

export class HistorySearchClient implements ReadClient {
  constructor(private readonly transport = new PirateTalkTransport()) {}
  async read(operation: ReadOperation, signal: AbortSignal): Promise<ReadPage> {
    const result = await (() => {
      switch (operation.kind) {
        case "history":
          return this.transport.history(operation.request, signal);
        case "search":
          return this.transport.search(operation.request, signal);
        case "attachments":
          return this.transport.attachments(operation.request, signal);
      }
    })();
    switch (result.kind) {
      case "success":
        return result.data;
      case "failure":
        throw new HistorySearchError(result.error.code, result.error.detail);
      case "cancelled":
        throw new DOMException("Read cancelled", "AbortError");
    }
  }
}

export type ReadState = {
  readonly operation: ReadOperation | null;
  readonly page: ReadPage | null;
  readonly loading: boolean;
  readonly error: string | null;
};

export class HistorySearchController {
  private state: ReadState = {
    operation: null,
    page: null,
    loading: false,
    error: null,
  };
  private revision = 0;
  private abort: AbortController | null = null;
  private listeners = new Set<() => void>();
  constructor(
    private readonly client: ReadClient = new HistorySearchClient(),
  ) {}
  getSnapshot = (): ReadState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(state: ReadState) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
  reset = () => {
    this.revision++;
    this.abort?.abort();
    this.publish({ operation: null, page: null, loading: false, error: null });
  };
  async load(operation: ReadOperation): Promise<void> {
    this.abort?.abort();
    const abort = new AbortController();
    this.abort = abort;
    const revision = ++this.revision;
    this.publish({ operation, page: null, loading: true, error: null });
    try {
      const page = await this.client.read(operation, abort.signal);
      if (revision !== this.revision || abort.signal.aborted) return;
      this.publish({ operation, page, loading: false, error: null });
    } catch (error) {
      if (revision !== this.revision || abort.signal.aborted) return;
      this.publish({
        operation,
        page: null,
        loading: false,
        error: error instanceof Error ? error.message : "Read unavailable",
      });
    }
  }
  async next(): Promise<void> {
    const { operation, page, loading } = this.state;
    if (loading || !operation || !page?.hasMore || !page.nextCursor) return;
    const cursor = page.nextCursor;
    switch (operation.kind) {
      case "history": {
        const {
          beforeId: _before,
          messageId: _anchor,
          ...request
        } = operation.request;
        return this.load({ kind: "history", request: { ...request, cursor } });
      }
      case "search":
        return this.load({
          kind: "search",
          request: { ...operation.request, cursor },
        });
      case "attachments":
        return this.load({
          kind: "attachments",
          request: { ...operation.request, cursor },
        });
    }
  }
}

export function recentFilter(
  messages: readonly Message[],
  query: string,
): readonly Message[] {
  const needle = query.trim().toLocaleLowerCase();
  return needle
    ? messages.filter((message) =>
        message.text.toLocaleLowerCase().includes(needle),
      )
    : messages;
}
