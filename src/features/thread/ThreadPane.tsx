import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { components } from "../../contract/decoded";
import {
  type ContextFailure,
  type ContextWindows,
  describeWindow,
  WINDOW_CEILING,
} from "../../core/context";
import type { ClientStores } from "../../core/stores";
import { Cat, COPY, CoverageLine, cx, MessageBubble } from "../../ui";
import { connectionStateFor } from "../connection";
import { FileDownload, type FileTransport } from "../reads/FileDownload";
import { RevisionsDialog, type RevisionsTransport } from "../revisions";
import { useSlice } from "../rooms";
import { THREAD_COPY } from "./copy";
import {
  countNewer,
  findReplyTarget,
  isFarFromEnd,
  isJumpable,
  mayBeOlder,
  nextJumpStep,
} from "./jump";
import type { ReadingAnchor, ThreadScroll } from "./scroll";
import styles from "./ThreadPane.module.css";
import { VirtualThreadTurns } from "./virtual";

type Message = components["schemas"]["Message"];

export interface ThreadPaneProps {
  stores: ClientStores;
  windows: ContextWindows;
  /** The room the route names, as the wire string. */
  roomId: string;
  className?: string | undefined;
  /** The 0.15.0 per-message reads: 수정 기록 and 파일 받기. Absent, rows offer neither. */
  http?: (RevisionsTransport & FileTransport) | undefined;
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
/** The local calendar day of a timestamp, or null when the wire gave none. */
function dayOf(sentAt: string | null | undefined): string | null {
  if (!sentAt) return null;
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const DAY_FORMAT = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" });

const MessageRow = memo(function MessageRow({
  stores,
  roomId,
  id,
  prevId,
  now,
  gapBefore,
  http,
  onRevisions,
  onJump,
  highlighted,
}: {
  stores: ClientStores;
  roomId: string;
  id: string;
  /** The turn drawn above this one, which decides the day pill and the run. */
  prevId: string | null;
  now: Date;
  gapBefore: boolean;
  http: FileTransport | undefined;
  onRevisions: ((messageId: string) => void) | undefined;
  onJump: (replyId: string) => void;
  highlighted: boolean;
}) {
  const message = useSlice(stores, `message.${roomId}.${id}`);
  const jump = useCallback(() => onJump(id), [onJump, id]);
  const jumpable = isJumpable(message?.replyTo);
  // An id that is never a message key reads as absent, so the first turn has no previous.
  const prev = useSlice(stores, `message.${roomId}.${prevId ?? ""}`);
  const openRevisions = useCallback(() => onRevisions?.(id), [onRevisions, id]);
  const day = dayOf(message?.sentAt);
  // A day is announced only when the wire dated this turn and it differs from the last one.
  const newDay = day !== null && day !== dayOf(prev?.sentAt);
  const continued =
    !gapBefore &&
    !newDay &&
    message !== undefined &&
    prev !== undefined &&
    prev.fromMe === message.fromMe &&
    prev.sender === message.sender;
  return (
    <>
      {gapBefore ? (
        <p className={styles.note} data-ui="thread-gap">
          {THREAD_COPY.discontinuity}
        </p>
      ) : null}
      {newDay && message?.sentAt ? (
        <p className={styles.day} data-ui="thread-day">
          <span>
            <time dateTime={message.sentAt}>
              {DAY_FORMAT.format(new Date(message.sentAt))}
            </time>
          </span>
        </p>
      ) : null}
      {message ? (
        // The store's rows are deep-frozen; the bubble only reads them.
        <MessageBubble
          message={message as Message}
          now={now}
          continued={continued}
          onRevisions={onRevisions ? openRevisions : undefined}
          onQuote={jumpable ? jump : undefined}
          highlighted={highlighted}
          actions={
            // Message carries no file member; `/file` answers MESSAGE_NOT_FOUND for any other kind.
            http && message.kind === "file" ? (
              <FileDownload
                http={http}
                roomId={roomId}
                messageId={id}
                name={message.text || undefined}
              />
            ) : undefined
          }
        />
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
  http,
}: ThreadPaneProps) {
  const thread = useSlice(stores, `thread.${roomId}`);
  const window = useWindow(windows, roomId);
  const view = describeWindow(thread, window);
  const now = useToday();
  // Held with its room, so switching rooms never shows another room's history.
  const [revisions, setRevisions] = useState<{
    roomId: string;
    messageId: string;
  } | null>(null);
  const openRevisions = useCallback(
    (messageId: string) => setRevisions({ roomId, messageId }),
    [roomId],
  );
  const closeRevisions = useCallback(() => setRevisions(null), []);
  const revisionsOf = revisions?.roomId === roomId ? revisions.messageId : null;

  const wall = useRef<HTMLElement>(null);
  const scroll = useRef<ThreadScroll | null>(null);
  // Every piece of navigation state is held with its room, like revisions.
  const [jump, setJump] = useState<{ roomId: string; replyId: string } | null>(
    null,
  );
  const [highlight, setHighlight] = useState<{
    roomId: string;
    id: string;
    at: number;
  } | null>(null);
  const [origin, setOrigin] = useState<{
    roomId: string;
    anchor: ReadingAnchor;
  } | null>(null);
  const [toast, setToast] = useState<{ roomId: string; at: number } | null>(
    null,
  );
  const [away, setAway] = useState<{
    roomId: string;
    seen: string | null;
  } | null>(null);
  const searching = jump?.roomId === roomId ? jump.replyId : null;
  const highlighted = highlight?.roomId === roomId ? highlight.id : null;
  const back = origin?.roomId === roomId ? origin.anchor : null;
  const missing = toast?.roomId === roomId;
  const far = away?.roomId === roomId;
  const fresh = far ? countNewer(view.order, away.seen) : 0;

  const startJump = useCallback(
    (replyId: string) => {
      const anchor = scroll.current?.anchor;
      setOrigin(anchor ? { roomId, anchor: { ...anchor } } : null);
      setToast(null);
      setJump({ roomId, replyId });
    },
    [roomId],
  );
  const cancelJump = useCallback(() => setJump(null), []);

  // The search for a reply's original: look in the rows on screen, widen the
  // newest window while the original can still be older, and stop at the
  // ceiling. Each settled answer re-runs this once.
  useEffect(() => {
    if (searching === null) return;
    const thread = stores.getSnapshot(`thread.${roomId}`);
    const reply = thread.messages[searching];
    const source = reply?.replyTo;
    const rows = view.order.flatMap((id) => thread.messages[id] ?? []);
    const found = source ? findReplyTarget(source, searching, rows) : null;
    const step = nextJumpStep({
      found,
      edge: view.edge,
      loading: view.loading !== null,
      failed: view.failure !== null || !source,
      older: source ? mayBeOlder(source, rows) : false,
    });
    if (step.kind === "reveal") {
      const owner = scroll.current;
      owner?.reveal({ id: step.id, offset: owner.revealOffset() });
      setHighlight({ roomId, id: step.id, at: Date.now() });
      setJump(null);
    } else if (step.kind === "widen") windows.widen(roomId);
    else if (step.kind === "missing") {
      setOrigin(null);
      setToast({ roomId, at: Date.now() });
      setJump(null);
    }
  }, [
    searching,
    stores,
    roomId,
    windows,
    view.edge,
    view.loading,
    view.failure,
    view.order,
  ]);

  // The mark and the sentence are moments, not states: each clears itself.
  useEffect(() => {
    if (!highlight) return;
    const timer = setTimeout(() => setHighlight(null), 1500);
    return () => clearTimeout(timer);
  }, [highlight]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Whether the reader is a screen or more above the end, and which row was
  // newest when they left it: rows after that one are the new-message count.
  const order = useRef(view.order);
  order.current = view.order;
  const measure = useCallback(() => {
    const element = wall.current;
    if (!element) return;
    const isFar = isFarFromEnd(element);
    setAway((current) => {
      const here = current?.roomId === roomId;
      if (!isFar) return null;
      if (here) return current;
      return { roomId, seen: order.current.at(-1) ?? null };
    });
  }, [roomId]);
  useEffect(() => {
    const element = wall.current;
    if (!element) return;
    element.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => {
      element.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, [measure]);
  // A row arriving or a window widening changes the distance without a scroll.
  useLayoutEffect(() => {
    measure();
  });

  const toEnd = () => {
    setOrigin(null);
    scroll.current?.glideToEnd();
  };
  const goBack = () => {
    if (back) scroll.current?.reveal(back);
    setOrigin(null);
  };

  useEffect(() => {
    windows.open(roomId);
    return () => windows.close(roomId);
  }, [windows, roomId]);

  const widen = () => {
    if (view.edge === "widen") windows.widen(roomId);
  };
  const retry = () => windows.retry(roomId);
  const gaps = new Set(view.discontinuities);
  const previous = useMemo(() => {
    const map = new Map<string, string>();
    view.order.forEach((id, index) => {
      const before = view.order[index - 1];
      if (before !== undefined) map.set(id, before);
    });
    return map;
  }, [view.order]);

  return (
    <section
      ref={wall}
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
          scrollRef={scroll}
          renderRow={(id) => (
            <MessageRow
              key={id}
              stores={stores}
              roomId={roomId}
              id={id}
              prevId={previous.get(id) ?? null}
              now={now}
              gapBefore={gaps.has(id)}
              http={http}
              onRevisions={http ? openRevisions : undefined}
              onJump={startJump}
              highlighted={highlighted === id}
            />
          )}
        />
      ) : null}
      {http && revisionsOf !== null ? (
        <RevisionsDialog
          key={revisionsOf}
          http={http}
          roomId={roomId}
          messageId={revisionsOf}
          onClose={closeRevisions}
        />
      ) : null}
      {view.empty ? (
        <div className={styles.empty} data-ui="thread-empty">
          <Cat height={48} />
          <p>{THREAD_COPY.empty}</p>
        </div>
      ) : null}
      {view.order.length > 0 ? (
        <div className={styles.dock} data-ui="thread-dock">
          <div className={styles.stack}>
            {searching !== null ? (
              <p className={styles.pill} role="status" data-ui="jump-progress">
                <span>
                  {THREAD_COPY.jumpSearching(view.shown, WINDOW_CEILING)}
                </span>
                <button
                  type="button"
                  className={styles.pillAction}
                  data-ui="jump-cancel"
                  onClick={cancelJump}
                >
                  {THREAD_COPY.jumpCancel}
                </button>
              </p>
            ) : null}
            {missing ? (
              <p className={styles.pill} role="status" data-ui="jump-missing">
                {THREAD_COPY.jumpMissing}
              </p>
            ) : null}
            {back ? (
              <button
                type="button"
                className={styles.pill}
                data-ui="jump-back"
                onClick={goBack}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 14l-4-4 4-4M5 10h9a5 5 0 010 10h-2" />
                </svg>
                {THREAD_COPY.jumpBack}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.round}
              data-ui="to-end"
              data-visible={far}
              aria-label={
                fresh > 0 ? THREAD_COPY.toEndFresh(fresh) : THREAD_COPY.toEnd
              }
              tabIndex={far ? undefined : -1}
              aria-hidden={far ? undefined : true}
              onClick={toEnd}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
              {fresh > 0 ? (
                <span className={styles.badge} aria-hidden="true">
                  {fresh > 99 ? "99+" : fresh}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
