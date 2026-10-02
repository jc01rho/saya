import { useCallback, useEffect, useId, useRef } from "react";
import type { components } from "../../contract/decoded";
import type { HttpOutcome, JsonRequest } from "../../transport/http";
import { Cat } from "../../ui";
import { readFailureCopy, useRead } from "../reads";
import reads from "../reads/reads.module.css";
import styles from "./Revisions.module.css";

type Revisions = components["schemas"]["Revisions"];

export interface RevisionsTransport {
  request(request: JsonRequest<"/revisions">): Promise<HttpOutcome<Revisions>>;
}

export const REVISIONS_COPY = {
  title: "수정 기록",
  close: "닫기",
  loading: "수정 기록을 불러오는 중",
  first: "처음 보낸 글",
  revision: (n: number) => `${n}번째 수정`,
  current: "지금 보이는 글",
  emptyBody: "본문 없음",
  /** The client may keep no history; that is not proof the message was never edited. */
  empty: "이 기기에 이 메시지의 수정 기록이 남아 있지 않습니다",
  retry: "다시 시도",
} as const;

/**
 * Every version of an edited message, oldest first, in a sheet over the wall.
 * The last one is the text the wall already shows.
 */
export function RevisionsDialog({
  http,
  roomId,
  messageId,
  onClose,
}: {
  http: RevisionsTransport;
  roomId: string;
  messageId: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const run = useCallback(
    (signal: AbortSignal) =>
      http.request({
        path: "/revisions",
        signal,
        generationKey: `revisions:${roomId}`,
        query: new URLSearchParams({ roomId, messageId, open: "true" }),
      }),
    [http, roomId, messageId],
  );
  const [state, retry] = useRead(`${roomId}:${messageId}`, run);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  const answer =
    state.phase === "ready" &&
    state.data.room.id === roomId &&
    state.data.messageId === messageId
      ? state.data
      : null;
  const mismatched = state.phase === "ready" && !answer;
  const failure =
    state.phase === "failed"
      ? readFailureCopy(state.failure)
      : mismatched
        ? readFailureCopy({ kind: "protocol" })
        : null;
  const last = answer ? answer.revisions.length - 1 : -1;

  return (
    <dialog
      ref={dialog}
      className={reads.sheet}
      aria-labelledby={headingId}
      data-ui="revisions"
      onClose={onClose}
    >
      <header className={reads.head}>
        <h2 id={headingId} className={reads.title}>
          {REVISIONS_COPY.title}
        </h2>
        <button
          type="button"
          className={`${reads.action} ${reads.close}`}
          onClick={() => dialog.current?.close()}
        >
          {REVISIONS_COPY.close}
        </button>
      </header>
      <div
        className={reads.body}
        aria-busy={state.phase === "loading" || undefined}
      >
        {state.phase === "loading" ? (
          <p className={reads.status}>
            <span data-ui="theme-loader" aria-hidden="true" />
            {REVISIONS_COPY.loading}
          </p>
        ) : null}
        {failure ? (
          <div
            className={reads.notice}
            role="status"
            data-ui="revisions-failed"
          >
            <p>
              {failure.title}
              {failure.code ? (
                <>
                  {" "}
                  <code>{failure.code}</code>
                </>
              ) : null}
            </p>
            {failure.hint ? <p>{failure.hint}</p> : null}
            <button type="button" className={reads.action} onClick={retry}>
              {REVISIONS_COPY.retry}
            </button>
          </div>
        ) : null}
        {answer && answer.revisions.length === 0 ? (
          <div className={reads.empty} data-ui="revisions-empty">
            <Cat height={48} />
            <p>{REVISIONS_COPY.empty}</p>
          </div>
        ) : null}
        {answer && answer.revisions.length > 0 ? (
          <ol className={styles.list} data-ui="revisions-list">
            {answer.revisions.map((revision, index) => (
              <li
                key={revision.revision}
                className={styles.item}
                data-current={index === last || undefined}
              >
                <p className={styles.label}>
                  {revision.revision === 0
                    ? REVISIONS_COPY.first
                    : REVISIONS_COPY.revision(revision.revision)}
                  {index === last ? (
                    <span className={styles.current}>
                      {" · "}
                      {REVISIONS_COPY.current}
                    </span>
                  ) : null}
                </p>
                <p className={reads.text}>
                  {revision.text || REVISIONS_COPY.emptyBody}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </dialog>
  );
}
