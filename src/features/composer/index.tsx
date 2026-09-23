import {
  type FormEvent,
  type KeyboardEvent,
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { components } from "../../contract/decoded";
import { type HttpClient, HttpProtocolError } from "../../transport/http";
import styles from "./Composer.module.css";
import { ComposerState, type ConsentFingerprint, ImeEnterGuard } from "./state";

type SendResult = components["schemas"]["SendResult"];
type Confirmation = Readonly<{
  fingerprint: ConsentFingerprint;
  room: string;
  wouldClearDraft: boolean;
}>;
type Status =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "previewing" }>
  | Readonly<{ kind: "posting" }>
  | Readonly<{ kind: "error"; message: string }>
  | Readonly<{ kind: "submitted" }>;

const OPEN_ROOM = true;
const COPY = {
  input: "메시지 작성",
  placeholder: "메시지 입력",
  send: "보내기",
  empty: "빈 메시지는 보낼 수 없습니다.",
  previewing: "전송 내용을 확인하고 있습니다.",
  confirming: "전송 전 확인",
  resolvedRoom: "보낼 대화",
  conservative:
    "미리보기 결과는 초안을 잠그지 않습니다. 보내기 전에 내용을 다시 확인하세요.",
  clearWarning: "보내면 데스크톱 앱에 쓰고 있던 초안이 지워질 수 있습니다.",
  cancel: "취소",
  confirm: "확인 후 보내기",
  posting: "전송을 요청하고 있습니다.",
  submitted: "입력됨 · 전달 미확인",
  network: "브리지에 연결할 수 없습니다. 전송 여부를 확인하세요.",
  protocol: "브리지 응답을 해석할 수 없습니다. 전송 여부를 확인하세요.",
  refused: (code: string) => `브리지가 전송을 거절했습니다: ${code}`,
} as const;

function requestFingerprint(
  roomId: string,
  state: ComposerState,
): ConsentFingerprint {
  const draft = state.getDraft(roomId);
  return {
    roomId,
    text: draft.text,
    openRoom: OPEN_ROOM,
    draftRevision: draft.revision,
  };
}

function sendBody(fingerprint: ConsentFingerprint, dryRun: boolean) {
  return {
    room: fingerprint.roomId,
    text: fingerprint.text,
    dryRun,
    openRoom: fingerprint.openRoom,
  };
}

/**
 * A tab-local textarea with a dry-run confirmation. It owns neither pending
 * delivery state nor stream state, so incoming updates cannot clear or remount
 * its draft, composition, or selection.
 */
export const Composer = memo(function Composer({
  http,
  roomId,
}: {
  http: HttpClient;
  roomId: string;
}) {
  const state = useRef(new ComposerState()).current;
  const ime = useRef(new ImeEnterGuard()).current;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeRoomId = useRef(roomId);
  const previewAbort = useRef<AbortController | null>(null);
  const postAbort = useRef<AbortController | null>(null);
  const [_revision, setRevision] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const draft = state.getDraft(roomId);
  const visibleConfirmation =
    confirmation?.fingerprint.roomId === roomId ? confirmation : null;

  activeRoomId.current = roomId;
  const previousRoomId = useRef(roomId);

  useEffect(() => {
    if (previousRoomId.current === roomId) return;
    // A consent belongs to the active composition, never a room left behind.
    previousRoomId.current = roomId;
    state.revokeConsent();
    setConfirmation(null);
    setStatus({ kind: "idle" });
  }, [roomId, state]);

  useEffect(
    () => () => {
      previewAbort.current?.abort();
      postAbort.current?.abort();
    },
    [],
  );

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || document.activeElement !== input) return;
    input.setSelectionRange(draft.selectionStart, draft.selectionEnd);
  }, [draft.selectionEnd, draft.selectionStart]);

  const changed = (
    text: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    state.setText(roomId, text);
    state.setSelection(roomId, selectionStart, selectionEnd);
    setConfirmation(null);
    setStatus({ kind: "idle" });
    setRevision((value) => value + 1);
  };

  const preview = async () => {
    const fingerprint = requestFingerprint(roomId, state);
    if (fingerprint.text === "") {
      setStatus({ kind: "error", message: COPY.empty });
      return;
    }
    previewAbort.current?.abort();
    const controller = new AbortController();
    previewAbort.current = controller;
    setConfirmation(null);
    setStatus({ kind: "previewing" });
    try {
      const outcome = await http.request({
        path: "/send",
        signal: controller.signal,
        generationKey: `composer-preview:${roomId}`,
        body: sendBody(fingerprint, true),
      });
      if (activeRoomId.current !== roomId || outcome.kind === "discarded")
        return;
      if (outcome.kind === "failure") {
        setStatus({ kind: "error", message: COPY.refused(outcome.error.code) });
        return;
      }
      const result: SendResult = outcome.data;
      if (!result.dryRun || result.roomId !== roomId) {
        state.revokeConsent();
        setStatus({ kind: "error", message: COPY.protocol });
        return;
      }
      if (!state.grantConsent(fingerprint)) return;
      setConfirmation({
        fingerprint,
        room: result.room,
        wouldClearDraft: result.wouldClearDraft === true,
      });
      setStatus({ kind: "idle" });
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus({
        kind: "error",
        message:
          error instanceof HttpProtocolError ? COPY.protocol : COPY.network,
      });
    }
  };

  const confirm = async () => {
    if (
      !visibleConfirmation ||
      !state.hasConsent(visibleConfirmation.fingerprint)
    ) {
      setConfirmation(null);
      setStatus({ kind: "idle" });
      return;
    }
    const { fingerprint } = visibleConfirmation;
    const controller = new AbortController();
    postAbort.current = controller;
    setStatus({ kind: "posting" });
    try {
      const outcome = await http.request({
        path: "/send",
        signal: controller.signal,
        generationKey: `composer-post:${roomId}`,
        body: sendBody(fingerprint, false),
      });
      const draftStillMatches = state.hasConsent(fingerprint);
      state.revokeConsent();
      setConfirmation(null);
      if (activeRoomId.current !== roomId || outcome.kind === "discarded")
        return;
      if (outcome.kind === "failure") {
        setStatus({ kind: "error", message: COPY.refused(outcome.error.code) });
        return;
      }
      if (!outcome.data.submitted || outcome.data.dryRun) {
        setStatus({ kind: "error", message: COPY.protocol });
        return;
      }
      if (draftStillMatches) state.clear(roomId);
      setRevision((value) => value + 1);
      setStatus({ kind: "submitted" });
    } catch (error) {
      state.revokeConsent();
      setConfirmation(null);
      if (controller.signal.aborted) return;
      setStatus({
        kind: "error",
        message:
          error instanceof HttpProtocolError ? COPY.protocol : COPY.network,
      });
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "previewing" || status.kind === "posting") return;
    if (visibleConfirmation) void confirm();
    else void preview();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const decision = ime.decide(event.nativeEvent);
    if (decision === "ignore") {
      event.preventDefault();
      return;
    }
    if (decision === "send") {
      event.preventDefault();
      if (status.kind === "idle" || status.kind === "error") void preview();
    }
  };

  return (
    <form className={styles.composer} data-ui="composer" onSubmit={submit}>
      {visibleConfirmation ? (
        <section
          className={styles.confirmation}
          data-ui="composer-confirmation"
          aria-live="polite"
          aria-label={COPY.confirming}
        >
          <p className={styles.confirming}>{COPY.confirming}</p>
          <p>
            <span className={styles.label}>{COPY.resolvedRoom}</span>{" "}
            {visibleConfirmation.room}
          </p>
          <p className={styles.warning}>{COPY.conservative}</p>
          {visibleConfirmation.wouldClearDraft ? (
            <p className={styles.warning} data-ui="composer-clear-warning">
              {COPY.clearWarning}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.quiet}
              onClick={() => {
                state.revokeConsent();
                setConfirmation(null);
                setStatus({ kind: "idle" });
                inputRef.current?.focus();
              }}
            >
              {COPY.cancel}
            </button>
            <button
              type="button"
              className={styles.confirm}
              data-ui="composer-confirm"
              disabled={status.kind === "posting"}
              onClick={() => void confirm()}
            >
              {COPY.confirm}
            </button>
          </div>
        </section>
      ) : null}
      {status.kind === "previewing" || status.kind === "posting" ? (
        <p className={styles.status} role="status" data-ui="composer-status">
          {status.kind === "previewing" ? COPY.previewing : COPY.posting}
        </p>
      ) : null}
      {status.kind === "error" ? (
        <p className={styles.status} role="alert" data-ui="composer-error">
          {status.message}
        </p>
      ) : null}
      {status.kind === "submitted" ? (
        <p className={styles.status} role="status" data-ui="composer-submitted">
          {COPY.submitted}
        </p>
      ) : null}
      <div className={styles.entry}>
        <textarea
          ref={inputRef}
          className={styles.input}
          data-ui="composer-input"
          aria-label={COPY.input}
          placeholder={COPY.placeholder}
          value={draft.text}
          rows={1}
          onChange={(event) =>
            changed(
              event.currentTarget.value,
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
          onSelect={(event) =>
            state.setSelection(
              roomId,
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          }
          onCompositionStart={() => ime.start()}
          onCompositionEnd={() => ime.end()}
          onKeyDown={onKeyDown}
        />
        <button
          className={styles.door}
          data-ui="composer-send"
          type="submit"
          disabled={status.kind === "previewing" || status.kind === "posting"}
        >
          <span className="sr-only">{COPY.send}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11.5 20.5 4l-7.5 17.5-2.2-7.3z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </form>
  );
});
