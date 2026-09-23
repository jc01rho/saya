import type { components } from "../../contract/decoded";
import type { Immutable } from "../../core/stores";
import { immutable, SliceStore } from "../../core/stores/slices";
import {
  type HttpFailure,
  type HttpOutcome,
  HttpProtocolError,
  type JsonRequest,
} from "../../transport/http";
import {
  DIGEST_DEFAULTS,
  type DigestInput,
  type DigestParams,
  type ParamProblem,
  validateDigestParams,
} from "./params";

type Digest = components["schemas"]["Digest"];

/** The slice of the transport the digest needs; HttpClient satisfies it and tests fake it. */
export interface DigestTransport {
  request(request: JsonRequest<"/digest">): Promise<HttpOutcome<Digest>>;
}

export type DigestFailure =
  /** Refused before sending: the bridge would have answered 400. Nothing left the client. */
  | { kind: "invalid"; problems: readonly ParamProblem[] }
  /** The bridge answered with an error envelope. Only its code is ever shown. */
  | { kind: "bridge"; outcome: HttpFailure }
  /** No answer reached us. */
  | { kind: "network" }
  /** An answer arrived that is not the contract's. */
  | { kind: "protocol" };

export type DigestSnapshot = {
  /** The parameters this room last accepted; the defaults until a request has been sent. */
  params: DigestParams;
  loading: boolean;
  /** The last answer for this room, kept while a fresh one is in flight. */
  digest: Digest | null;
  /** The last request's failure; cleared when the next request starts. */
  failure: DigestFailure | null;
};

/** Answers are small (about 4 KB for 400 messages) but memory is still bounded: this many rooms keep theirs. */
export const RETAINED_DIGESTS = 4;

const IDLE = immutable<DigestSnapshot>({
  params: DIGEST_DEFAULTS,
  loading: false,
  digest: null,
  failure: null,
});

type DigestSlices = { [key: `digest.${string}`]: DigestSnapshot };

class DigestStore extends SliceStore<DigestSlices> {
  constructor() {
    super(
      <K extends keyof DigestSlices>() => IDLE as Immutable<DigestSlices[K]>,
    );
  }
  publish(roomId: string, value: Immutable<DigestSnapshot>): void {
    this.set(`digest.${roomId}`, value);
  }
}

type RoomRequest = { generation: number; controller: AbortController | null };

/**
 * Per-room digests: the parameters a room asks with, what is in flight, and
 * the last answer. Parameters are validated before anything is sent; a
 * superseded, aborted or closed request never lands.
 */
export class DigestRequests {
  private readonly store = new DigestStore();
  private readonly requests = new Map<string, RoomRequest>();
  /** Rooms holding an answer, oldest first. */
  private readonly retained: string[] = [];

  constructor(private readonly http: DigestTransport) {}

  readonly subscribe = (roomId: string, listener: () => void): (() => void) =>
    this.store.subscribe(`digest.${roomId}`, listener);

  readonly getSnapshot = (roomId: string): Immutable<DigestSnapshot> =>
    this.store.getSnapshot(`digest.${roomId}`);

  /** Ask again with the parameters this room last accepted. A held answer stays visible meanwhile. */
  open(roomId: string): void {
    this.load(roomId, this.getSnapshot(roomId).params);
  }

  retry(roomId: string): void {
    this.open(roomId);
  }

  /**
   * Validate, then send. An out-of-range count or an unspellable span is
   * recorded as a refusal and nothing is requested, because the bridge would
   * answer 400. Returns whether a request left.
   */
  load(roomId: string, input: DigestInput): boolean {
    const checked = validateDigestParams(input);
    if (!checked.ok) {
      this.store.publish(roomId, {
        ...this.getSnapshot(roomId),
        loading: false,
        failure: { kind: "invalid", problems: checked.problems },
      });
      return false;
    }
    const { params } = checked;
    const request = this.requests.get(roomId) ?? this.track(roomId);
    request.controller?.abort();
    const controller = new AbortController();
    request.controller = controller;
    const generation = ++request.generation;
    // Superseded by a newer request for this room, or aborted: the answer is nobody's.
    const live = () =>
      request.generation === generation && !controller.signal.aborted;
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      params,
      loading: true,
      failure: null,
    });
    this.http
      .request({
        path: "/digest",
        signal: controller.signal,
        generationKey: `digest:${roomId}`,
        query: new URLSearchParams({
          roomId,
          span: params.span,
          limit: String(params.limit),
          highlights: String(params.highlights),
        }),
      })
      .then(
        (outcome) => {
          if (!live() || outcome.kind === "discarded") return;
          if (outcome.kind === "failure")
            this.settle(roomId, { kind: "bridge", outcome });
          else this.apply(roomId, outcome.data);
        },
        (error: unknown) => {
          if (!live()) return;
          this.settle(roomId, {
            kind: error instanceof HttpProtocolError ? "protocol" : "network",
          });
        },
      );
    return true;
  }

  /** Abort what is in flight. The parameters and the held answer stay. */
  close(roomId: string): void {
    const request = this.requests.get(roomId);
    if (request) {
      request.controller?.abort();
      request.controller = null;
    }
    this.store.publish(roomId, { ...this.getSnapshot(roomId), loading: false });
  }

  private track(roomId: string): RoomRequest {
    const request: RoomRequest = { generation: 0, controller: null };
    this.requests.set(roomId, request);
    return request;
  }

  private settle(roomId: string, failure: DigestFailure): void {
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      loading: false,
      failure,
    });
  }

  private apply(roomId: string, digest: Digest): void {
    // The routing key is the request's roomId; a digest of another room is a broken bridge, not data.
    if (
      digest.room.id !== roomId ||
      digest.slices.some((slice) =>
        slice.highlights.some((message) => message.roomId !== roomId),
      )
    ) {
      this.settle(roomId, { kind: "protocol" });
      return;
    }
    this.store.publish(roomId, {
      ...this.getSnapshot(roomId),
      loading: false,
      failure: null,
      digest,
    });
    this.retain(roomId);
  }

  private retain(roomId: string): void {
    const index = this.retained.indexOf(roomId);
    if (index !== -1) this.retained.splice(index, 1);
    this.retained.push(roomId);
    while (this.retained.length > RETAINED_DIGESTS) {
      const victim = this.retained.shift();
      if (victim !== undefined)
        this.store.publish(victim, {
          ...this.getSnapshot(victim),
          digest: null,
        });
    }
  }
}

const registry = new WeakMap<DigestTransport, DigestRequests>();

/** One request store per transport, created on first use so the session composition root never imports this chunk. */
export function digestRequestsFor(transport: DigestTransport): DigestRequests {
  let requests = registry.get(transport);
  if (!requests) {
    requests = new DigestRequests(transport);
    registry.set(transport, requests);
  }
  return requests;
}
