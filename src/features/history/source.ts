import type { components } from "../../contract/decoded";
import type { HttpOutcome, JsonRequest } from "../../transport/http";

type Context = components["schemas"]["Context"];

export interface HistoryTransport {
  request(request: JsonRequest<"/context">): Promise<HttpOutcome<Context>>;
}

/** The widest window the contract offers (G3): the newest 1000, no older page. */
export const HISTORY_LIMIT = 1000;
/** A room's window is asked once and shared for this long; the past does not move. */
export const HISTORY_TTL_MS = 5 * 60_000;
/** Rooms whose answer is kept, oldest first. One answer is a few hundred KB at most. */
export const RETAINED_HISTORIES = 4;

type Entry = { at: number; outcome: Promise<HttpOutcome<Context>> };

/**
 * One room's newest-1000 window, for features that look further back than
 * the wall shows (작년 오늘, 결산). It is the same `/context` the wall reads,
 * under its own generation key so neither request discards the other's
 * answer, and it never lands in the wall's store: the wall keeps its own
 * window and its own limit. Callers share one request per room, and a caller
 * that goes away does not cancel what another may still be waiting for; a
 * refused or failed answer is not kept, so the next read asks again.
 */
export class HistorySource {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly http: HistoryTransport,
    private readonly now: () => number = Date.now,
  ) {}

  read(roomId: string): Promise<HttpOutcome<Context>> {
    const kept = this.entries.get(roomId);
    if (kept && this.now() - kept.at < HISTORY_TTL_MS) return kept.outcome;
    const outcome = this.http
      .request({
        path: "/context",
        // Shared across callers, so nobody's departure aborts it.
        signal: new AbortController().signal,
        generationKey: `history:${roomId}`,
        // `open=true` as the wall sends it (DESIGN.md G2): this read follows
        // the wall's own open of the same room, so nothing new is opened here.
        query: new URLSearchParams({
          roomId,
          limit: String(HISTORY_LIMIT),
          open: "true",
        }),
      })
      .then(
        (answer) => {
          if (answer.kind !== "success") this.forget(roomId, outcome);
          return answer;
        },
        (error: unknown) => {
          this.forget(roomId, outcome);
          throw error;
        },
      );
    this.entries.delete(roomId);
    this.entries.set(roomId, { at: this.now(), outcome });
    while (this.entries.size > RETAINED_HISTORIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    return outcome;
  }

  /** Drops the kept answer only if it is still the one that failed. */
  private forget(roomId: string, outcome: Promise<HttpOutcome<Context>>) {
    if (this.entries.get(roomId)?.outcome === outcome)
      this.entries.delete(roomId);
  }
}
