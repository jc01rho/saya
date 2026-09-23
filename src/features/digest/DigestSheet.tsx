import {
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { components } from "../../contract/decoded";
import type { ClientStores, Immutable } from "../../core/stores";
import { Cat, COPY, cx, MessageBubble } from "../../ui";
import { connectionStateFor } from "../connection";
import { useSlice } from "../rooms";
import { THREAD_COPY } from "../thread";
import { DIGEST_COPY, problemCopy } from "./copy";
import styles from "./Digest.module.css";
import { formatRange } from "./format";
import {
  type DigestField,
  HIGHLIGHT_BOUNDS,
  LIMIT_BOUNDS,
  type ParamProblem,
  SPAN_PRESETS,
} from "./params";
import {
  type DigestFailure,
  type DigestRequests,
  type DigestTransport,
  digestRequestsFor,
} from "./requests";

type Message = components["schemas"]["Message"];
type Slice = components["schemas"]["DigestSlice"];

const NO_PROBLEMS: readonly ParamProblem[] = Object.freeze([]);

function useDigest(requests: DigestRequests, roomId: string) {
  const subscribe = useCallback(
    (listener: () => void) => requests.subscribe(roomId, listener),
    [requests, roomId],
  );
  const read = useCallback(
    () => requests.getSnapshot(roomId),
    [requests, roomId],
  );
  return useSyncExternalStore(subscribe, read, read);
}

/** Words for a refused digest. Codes are branched on with a default; messages are never UI input. */
function failureCopy(failure: Exclude<DigestFailure, { kind: "invalid" }>): {
  title: string;
  code: string | null;
  hint: string | null;
} {
  if (failure.kind === "network")
    return { title: THREAD_COPY.network, code: null, hint: null };
  if (failure.kind === "protocol")
    return { title: THREAD_COPY.protocol, code: null, hint: null };
  const code = failure.outcome.error.code;
  if (failure.outcome.status === 400)
    return { title: DIGEST_COPY.refused, code, hint: null };
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
      return { title: DIGEST_COPY.failed, code, hint: null };
  }
}

function DigestNotice({
  failure,
  onRetry,
}: {
  failure: Exclude<DigestFailure, { kind: "invalid" }>;
  onRetry: () => void;
}) {
  const { title, code, hint } = failureCopy(failure);
  return (
    <div
      className={styles.notice}
      role="status"
      data-ui="digest-notice"
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

/** A named list of counted things: who spoke, which words recurred. Empty is said, not hidden. */
function Facet({
  label,
  items,
  ui,
}: {
  label: string;
  items: readonly { key: string; text: string; count: number }[];
  ui: string;
}) {
  return (
    <div className={styles.facet} data-ui={ui}>
      <span className={styles.facetLabel}>{label}</span>
      {items.length > 0 ? (
        <ul className={styles.chips}>
          {items.map((item) => (
            <li key={item.key} className={styles.chip}>
              <span>{item.text}</span>
              <span className={styles.num}>
                {item.count.toLocaleString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <span className={styles.none}>{DIGEST_COPY.none}</span>
      )}
    </div>
  );
}

/**
 * One highlight: a real message, rendered with the same bubble as the wall.
 * The jump exists only while the wall holds the row; otherwise the absence is
 * stated, because the contract has no page that could fetch it (G3).
 */
function Highlight({
  message,
  inWindow,
  shown,
  now,
  onJump,
}: {
  message: Immutable<Message>;
  inWindow: boolean;
  shown: number;
  now: Date;
  onJump: (messageId: string) => void;
}) {
  return (
    <li
      className={styles.highlight}
      data-ui="digest-highlight"
      data-highlight-id={message.id}
      data-loaded={inWindow}
      data-side={message.fromMe ? "self" : "other"}
    >
      {/* The store's rows are deep-frozen; the bubble only reads them. */}
      <MessageBubble message={message as Message} now={now} />
      {inWindow ? (
        <button
          type="button"
          className={styles.jump}
          data-ui="digest-jump"
          onClick={() => onJump(message.id)}
        >
          {DIGEST_COPY.jump}
        </button>
      ) : (
        <p className={styles.unloaded} data-ui="digest-unloaded">
          {DIGEST_COPY.unloaded(shown)}
        </p>
      )}
    </li>
  );
}

function SliceSection({
  slice,
  loaded,
  shown,
  now,
  onJump,
}: {
  slice: Immutable<Slice>;
  loaded: ReadonlySet<string>;
  shown: number;
  now: Date;
  onJump: (messageId: string) => void;
}) {
  return (
    <li className={styles.slice} data-ui="digest-slice">
      <div className={styles.sliceHead}>
        <h3 className={styles.range}>
          {formatRange(slice.from, slice.to, now)}
        </h3>
        <span className={styles.count} data-ui="digest-count">
          {DIGEST_COPY.count(slice.count)}
        </span>
      </div>
      <Facet
        label={DIGEST_COPY.speakers}
        ui="digest-speakers"
        items={slice.speakers.map((speaker) => ({
          key: speaker.name,
          text: speaker.name,
          count: speaker.count,
        }))}
      />
      <Facet
        label={DIGEST_COPY.keywords}
        ui="digest-keywords"
        items={slice.keywords.map((keyword) => ({
          key: keyword.word,
          text: keyword.word,
          count: keyword.count,
        }))}
      />
      {slice.highlights.length > 0 ? (
        <ol className={styles.highlights} data-ui="digest-highlights">
          {slice.highlights.map((message) => (
            <Highlight
              key={message.id}
              message={message}
              inWindow={loaded.has(message.id)}
              shown={shown}
              now={now}
              onJump={onJump}
            />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

export interface DigestViewProps {
  stores: ClientStores;
  requests: DigestRequests;
  /** The room the route names, as the wire string. */
  roomId: string;
  now: Date;
  headingId: string;
  headingRef?: RefObject<HTMLHeadingElement | null> | undefined;
  onClose: () => void;
  /** A highlight the wall currently holds was chosen; the caller scrolls to it. */
  onJump: (messageId: string) => void;
}

/**
 * The digest of one room: the bridge's note and scope, then per slice the
 * speakers, the recurring words and the highlighted messages. Parameters are
 * checked before any request leaves; the refused fields are named in place.
 */
export function DigestView({
  stores,
  requests,
  roomId,
  now,
  headingId,
  headingRef,
  onClose,
  onJump,
}: DigestViewProps) {
  const snapshot = useDigest(requests, roomId);
  const roomSlice = useSlice(stores, `room.${roomId}`);
  const order = useSlice(stores, `order.${roomId}`);
  const loaded = useMemo(() => new Set(order), [order]);
  const spanRef = useRef<HTMLInputElement>(null);
  const limitRef = useRef<HTMLInputElement>(null);
  const highlightsRef = useRef<HTMLInputElement>(null);
  const ids = useId();
  const digest = snapshot.digest;
  const title =
    roomSlice?.room.title ?? digest?.room.title ?? DIGEST_COPY.untitled;
  const problems =
    snapshot.failure?.kind === "invalid"
      ? snapshot.failure.problems
      : NO_PROBLEMS;
  const invalid = (field: DigestField) =>
    problems.some((problem) => problem.field === field) || undefined;
  const bridgeFailure =
    snapshot.failure && snapshot.failure.kind !== "invalid"
      ? snapshot.failure
      : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const span = spanRef.current;
    const limit = limitRef.current;
    const highlights = highlightsRef.current;
    if (!span || !limit || !highlights) return;
    // Counts typed by the user, read as the number inputs report them; never a wire id.
    requests.load(roomId, {
      span: span.value,
      limit: limit.valueAsNumber,
      highlights: highlights.valueAsNumber,
    });
  };

  return (
    <>
      <header className={styles.head}>
        <div className={styles.heading}>
          <h2
            id={headingId}
            ref={headingRef}
            className={styles.title}
            tabIndex={-1}
          >
            {DIGEST_COPY.title}
          </h2>
          <p className={styles.room}>{title}</p>
        </div>
        <button
          type="button"
          className={cx(styles.action, styles.close)}
          data-ui="digest-close"
          onClick={onClose}
        >
          {DIGEST_COPY.close}
        </button>
      </header>
      <div
        className={styles.body}
        data-ui="digest-body"
        aria-busy={snapshot.loading || undefined}
      >
        <p className={styles.lead}>{DIGEST_COPY.lead}</p>
        <form
          className={styles.form}
          noValidate
          onSubmit={submit}
          aria-describedby={problems.length > 0 ? `${ids}-problems` : undefined}
        >
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              {DIGEST_COPY.span}{" "}
              <span className={styles.hint}>{DIGEST_COPY.spanHint}</span>
            </span>
            <input
              ref={spanRef}
              className={styles.input}
              name="span"
              type="text"
              list={`${ids}-spans`}
              autoComplete="off"
              spellCheck={false}
              defaultValue={snapshot.params.span}
              aria-invalid={invalid("span")}
            />
          </label>
          <datalist id={`${ids}-spans`}>
            {SPAN_PRESETS.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              {DIGEST_COPY.limit}{" "}
              <span className={styles.hint}>{DIGEST_COPY.limitHint}</span>
            </span>
            <input
              ref={limitRef}
              className={styles.input}
              name="limit"
              type="number"
              inputMode="numeric"
              min={LIMIT_BOUNDS.min}
              max={LIMIT_BOUNDS.max}
              step={1}
              defaultValue={snapshot.params.limit}
              aria-invalid={invalid("limit")}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              {DIGEST_COPY.highlights}{" "}
              <span className={styles.hint}>{DIGEST_COPY.highlightsHint}</span>
            </span>
            <input
              ref={highlightsRef}
              className={styles.input}
              name="highlights"
              type="number"
              inputMode="numeric"
              min={HIGHLIGHT_BOUNDS.min}
              max={HIGHLIGHT_BOUNDS.max}
              step={1}
              defaultValue={snapshot.params.highlights}
              aria-invalid={invalid("highlights")}
            />
          </label>
          <button
            type="submit"
            className={styles.action}
            data-ui="digest-submit"
          >
            {DIGEST_COPY.submit}
          </button>
        </form>
        {problems.length > 0 ? (
          <ul
            id={`${ids}-problems`}
            className={styles.problems}
            data-ui="digest-problems"
          >
            {problems.map((problem) => (
              <li key={problem.field} data-field={problem.field}>
                {problemCopy(problem)}
              </li>
            ))}
          </ul>
        ) : null}
        {snapshot.loading ? (
          <p className={styles.status} data-ui="digest-status">
            {digest ? DIGEST_COPY.refreshing : DIGEST_COPY.loading}
          </p>
        ) : null}
        {bridgeFailure ? (
          <DigestNotice
            failure={bridgeFailure}
            onRetry={() => requests.retry(roomId)}
          />
        ) : null}
        {digest ? (
          <>
            <p className={styles.note} data-ui="digest-note">
              {digest.note}
            </p>
            <p className={styles.scope} data-ui="digest-scope">
              {DIGEST_COPY.scope(
                digest.considered,
                digest.span,
                digest.slices.length,
              )}
            </p>
            {digest.slices.length > 0 ? (
              <ol className={styles.slices} data-ui="digest-slices">
                {digest.slices.map((slice) => (
                  <SliceSection
                    key={slice.from}
                    slice={slice}
                    loaded={loaded}
                    shown={order.length}
                    now={now}
                    onJump={onJump}
                  />
                ))}
              </ol>
            ) : (
              <div className={styles.empty} data-ui="digest-empty">
                <Cat height={48} />
                <p>{DIGEST_COPY.empty}</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}

export interface DigestSheetProps {
  stores: ClientStores;
  http: DigestTransport;
  roomId: string;
  /** The sheet has closed, by its own control, Escape, or a jump into the wall. */
  onClose: () => void;
}

const rowSelector = (id: string) =>
  `[data-ui="thread-wall"] [data-message-id="${CSS.escape(id)}"]`;

/**
 * The modal sheet the digest lives in. The conversation wall stays mounted
 * beneath it, so a highlight the wall holds can be scrolled to; the sheet
 * closes as it does so. Escape and 닫기 close it; nothing else moves.
 */
export default function DigestSheet({
  stores,
  http,
  roomId,
  onClose,
}: DigestSheetProps) {
  const requests = useMemo(() => digestRequestsFor(http), [http]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  // Time labels depend on the day only; the sheet is transient, so one reading is enough.
  const [now] = useState(() => new Date());

  useEffect(() => {
    requests.open(roomId);
    return () => requests.close(roomId);
  }, [requests, roomId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    headingRef.current?.focus();
  }, []);

  const close = () => dialogRef.current?.close();
  const jump = (messageId: string) => {
    document
      .querySelector<HTMLElement>(rowSelector(messageId))
      ?.scrollIntoView({ block: "center" });
    close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={headingId}
      data-ui="digest"
      onClose={onClose}
    >
      <DigestView
        stores={stores}
        requests={requests}
        roomId={roomId}
        now={now}
        headingId={headingId}
        headingRef={headingRef}
        onClose={close}
        onJump={jump}
      />
    </dialog>
  );
}
