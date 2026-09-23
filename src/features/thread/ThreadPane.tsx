import {
  memo,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import type { components } from "../../contract/decoded";
import {
  type ContextFailure,
  type ContextWindows,
  describeWindow,
} from "../../core/context";
import type { ClientStores } from "../../core/stores";
import { Cat, COPY, CoverageLine, cx, MessageBubble } from "../../ui";
import { connectionStateFor } from "../connection";
import { useSlice } from "../rooms";
import { THREAD_COPY } from "./copy";
import styles from "./ThreadPane.module.css";
import { VirtualThreadTurns } from "./virtual";

type Message = components["schemas"]["Message"];

export interface ThreadPaneProps {
  stores: ClientStores;
  windows: ContextWindows;
  /** The room the route names, as the wire string. */
  roomId: string;
  className?: string | undefined;
}

function useWindow(windows: ContextWindows, roomId: string) {
  const subscribe = useCallback(
    (listener: () => void) => windows.subscribe(roomId, listener),
    [windows, roomId],
  );
  const read = useCallback(
    () => windows.getSnapshot(roomId),
    [windows, roomId],
  );
  return useSyncExternalStore(subscribe, read, read);
}

/** Time labels depend on the day only, so the wall ticks once, at local midnight. */
function useToday(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(
      () => setNow(new Date()),
      midnight.getTime() - now.getTime(),
    );
    return () => clearTimeout(timer);
  }, [now]);
  return now;
}

/**
 * One row subscribes to its own entity, so a change to another message never
 * reaches it; memo keeps a window update from rerendering unchanged rows.
 */
const MessageRow = memo(function MessageRow({
  stores,
  roomId,
  id,
  now,
  gapBefore,
}: {
  stores: ClientStores;
  roomId: string;
  id: string;
  now: Date;
  gapBefore: boolean;
}) {
  const message = useSlice(stores, `message.${roomId}.${id}`);
  return (
    <>
      {gapBefore ? (
        <p className={styles.note} data-ui="thread-gap">
          {THREAD_COPY.discontinuity}
        </p>
      ) : null}
      {message ? (
        // The store's rows are deep-frozen; the bubble only reads them.
        <MessageBubble message={message as Message} now={now} />
      ) : (
        <p className={styles.note} data-ui="thread-missing">
          {THREAD_COPY.missingRow}
        </p>
      )}
    </>
  );
});

/** Words for a refused window. Codes are branched on with a default; messages are never UI input. */
function failureCopy(failure: ContextFailure): {
  title: string;
  code: string | null;
  hint: string | null;
} {
  if (failure.kind === "network")
    return { title: THREAD_COPY.network, code: null, hint: null };
  if (failure.kind === "protocol")
    return { title: THREAD_COPY.protocol, code: null, hint: null };
  const code = failure.outcome.error.code;
  const state = connectionStateFor(failure.outcome);
  switch (state.kind) {
    case "unauthorized":
      return { title: THREAD_COPY.unauthorized, code, hint: null };
    case "host-not-ready":
      return state.code === "KEY_UNAVAILABLE"
        ? { title: COPY.unreadable, code, hint: THREAD_COPY.unreadableHint }
        : { title: THREAD_COPY.hostNotReady, code, hint: null };
    case "permission-required":
      return { title: THREAD_COPY.permission, code, hint: null };
    default:
      return { title: THREAD_COPY.failed, code, hint: null };
  }
}

function ThreadNotice({
  failure,
  onRetry,
}: {
  failure: ContextFailure;
  onRetry: () => void;
}) {
  const { title, code, hint } = failureCopy(failure);
  return (
    <div
      className={styles.notice}
      role="status"
      data-ui="thread-notice"
      data-code={code ?? undefined}
    >
      <p>
        {title}
        {code ? (
          <>
            {" "}
            <code>{code}</code>
          </>
        ) : null}
      </p>
      {hint ? <p>{hint}</p> : null}
      <button type="button" className={styles.action} onClick={onRetry}>
        {THREAD_COPY.retry}
      </button>
    </div>
  );
}

/**
 * The conversation wall: the newest window of one room, oldest first, in a
 * single left-aligned column of flat bubbles. The coverage line is the first
 * row; older history is only ever widened 40 → 200 → 1000 and then the ceiling
 * is stated, because the contract offers no older page. The wall is the one
 * scroll owner on this side of the shell.
 */
export function ThreadPane({
  stores,
  windows,
  roomId,
  className,
}: ThreadPaneProps) {
  const thread = useSlice(stores, `thread.${roomId}`);
  const window = useWindow(windows, roomId);
  const view = describeWindow(thread, window);
  const now = useToday();

  useEffect(() => {
    windows.open(roomId);
    return () => windows.close(roomId);
  }, [windows, roomId]);

  const widen = () => {
    if (view.edge === "widen") windows.widen(roomId);
  };
  const retry = () => windows.retry(roomId);
  const gaps = new Set(view.discontinuities);

  return (
    <section
      className={cx(styles.wall, className)}
      role="log"
      aria-live="polite"
      aria-label={THREAD_COPY.log}
      aria-busy={view.loading !== null || undefined}
      data-ui="thread-wall"
      data-limit={view.limit}
      data-stale={view.stale || undefined}
    >
      {view.coverage ? (
        <CoverageLine
          kind="coverage"
          coverage={view.coverage}
          shown={view.shown}
        />
      ) : view.loading !== null ? (
        <p className={styles.status} data-ui="thread-status">
          {THREAD_COPY.loading}
        </p>
      ) : null}
      {view.stale ? (
        <p className={styles.status} data-ui="thread-status">
          {THREAD_COPY.refreshing}
        </p>
      ) : null}
      {view.failure ? (
        <ThreadNotice failure={view.failure} onRetry={retry} />
      ) : null}
      {view.edge === "widen" || view.edge === "widening" ? (
        <button
          type="button"
          className={styles.action}
          data-ui="widen"
          aria-disabled={view.edge === "widening" || undefined}
          onClick={widen}
        >
          {view.edge === "widening" ? THREAD_COPY.widening : THREAD_COPY.widen}
        </button>
      ) : null}
      {view.edge === "ceiling" ? <CoverageLine kind="ceiling" /> : null}
      {view.order.length > 0 ? (
        <VirtualThreadTurns
          key={roomId}
          order={view.order}
          renderRow={(id) => (
            <MessageRow
              key={id}
              stores={stores}
              roomId={roomId}
              id={id}
              now={now}
              gapBefore={gaps.has(id)}
            />
          )}
        />
      ) : null}
      {view.empty ? (
        <div className={styles.empty} data-ui="thread-empty">
          <Cat height={48} />
          <p>{THREAD_COPY.empty}</p>
        </div>
      ) : null}
    </section>
  );
}
