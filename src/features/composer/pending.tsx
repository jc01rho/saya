import { useSyncExternalStore } from "react";
import type { Attempt } from "../../coordination/metadata";
import type { SendAttempt, SendDraft, SendLedger } from "../../core/send";
import { COPY } from "../../ui";
import styles from "./pending.module.css";

// The state words have one owner: the approved copy in the UI layer.
function label(attempt: SendAttempt): string {
  if (attempt.state === "submitted") return COPY.pending;
  if (attempt.state === "unknown") return COPY.unknown;
  if (attempt.state === "posting") return "전송 요청 중 · 결과 미확인";
  if (attempt.reason === "RATE_LIMITED") return COPY.rejected;
  if (attempt.reason === "AMBIGUOUS_CHAT")
    return "대화 창을 구분할 수 없습니다. 데스크톱에서 대화 이름을 다르게 바꾼 뒤 다시 확인하세요.";
  if (attempt.reason === "send-unavailable" || attempt.reason === "not-ready")
    return "지금은 전송할 수 없습니다. 연결 상태를 확인하세요.";
  return "전송 요청이 거절되었습니다";
}

/** Nothing here inserts a history row or upgrades a request to delivered. */
export function PendingList({
  ledger,
  roomId,
  onNewAttempt,
  onLinked,
}: {
  ledger: SendLedger;
  roomId: string;
  /** Must restore a draft and run a NEW preview/consent, never directly POST. */
  onNewAttempt?: (draft: SendDraft) => void;
  onLinked?: (attempt: SendAttempt, messageId: string) => void;
}) {
  const attempts = useSyncExternalStore(ledger.subscribe, ledger.getSnapshot);
  const pending = attempts.filter(
    (attempt) =>
      attempt.draft.roomId === roomId &&
      attempt.linkedMessageId === null &&
      ["posting", "submitted", "unknown", "rejected"].includes(attempt.state),
  );
  if (!pending.length) return null;
  return (
    <section
      className={styles.pending}
      data-ui="pending-list"
      aria-label="전송 요청과 확인이 필요한 기록"
    >
      {pending.map((attempt) => (
        <article
          key={attempt.uuid}
          className={styles.attempt}
          data-ui="pending-attempt"
          data-attempt-id={attempt.uuid}
          data-send-state={attempt.state}
        >
          <p className={styles.body}>{attempt.draft.text}</p>
          <p className={styles.status} role="status">
            {label(attempt)}
          </p>
          {attempt.candidates.length > 0 ? (
            <div className={styles.candidates}>
              <p>
                같은 본문의 내 기록이 관찰되었습니다. 이 요청의 결과인지는 알 수
                없습니다.
              </p>
              {attempt.candidates.map((id, index) => (
                <button
                  type="button"
                  key={id}
                  data-ui="pending-link"
                  data-candidate-id={id}
                  disabled={
                    attempt.state === "posting" ||
                    attempts.some(
                      (item) =>
                        item.draft.roomId === roomId &&
                        item.linkedMessageId === id,
                    )
                  }
                  onClick={() => {
                    if (ledger.confirmLink(attempt.uuid, id))
                      onLinked?.(attempt, id);
                  }}
                >
                  이 기록으로 확인 · 후보 {index + 1}
                </button>
              ))}
            </div>
          ) : null}
          {attempt.state === "unknown" || attempt.state === "rejected" ? (
            <div className={styles.actions}>
              {onNewAttempt ? (
                <>
                  <p>
                    새로 보내면 같은 메시지가 중복될 수 있습니다. 미리보기와
                    확인을 다시 거칩니다.
                  </p>
                  <button
                    type="button"
                    data-ui="pending-new-attempt"
                    onClick={() => onNewAttempt(attempt.draft)}
                  >
                    새 시도 준비
                  </button>
                </>
              ) : null}
              <button
                type="button"
                data-ui="pending-dismiss"
                onClick={() => ledger.dismiss(attempt.uuid)}
              >
                목록에서만 정리
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

/** Reload does not restore bodies, infer results, or offer a replay action. */
export function PendingRecovery({
  attempts,
}: {
  attempts: readonly Attempt[];
}) {
  const unknown = attempts.filter(
    (attempt) =>
      attempt.status === "unknown" || attempt.status === "attempting",
  ).length;
  return unknown ? (
    <p role="status" data-ui="pending-recovery">
      {COPY.unknown} · 이전 요청 {unknown}개가 남아 있습니다. 본문은 저장하지
      않았습니다. 데스크톱 기록을 확인하세요.
    </p>
  ) : null;
}
