import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { components } from "../../contract/decoded";
import type { HttpOutcome, JsonRequest } from "../../transport/http";
import { formatTime } from "../../ui";
import { isUnsupported, readFailureCopy, useRead } from "../reads";
import reads from "../reads/reads.module.css";
import styles from "./Notice.module.css";

type NoticeAnswer = components["schemas"]["NoticeAnswer"];
type Notice = components["schemas"]["Notice"];

export interface NoticeTransport {
  request(request: JsonRequest<"/notice">): Promise<HttpOutcome<NoticeAnswer>>;
}

export const NOTICE_COPY = {
  label: "공지",
  open: "공지 전체 보기",
  close: "닫기",
  unknownAuthor: "작성자 미상",
  failed: "공지를 확인하지 못했습니다",
  retry: "다시 시도",
  kinds: { image: "사진 공지", schedule: "일정 공지" } as Record<
    string,
    string
  >,
} as const;

function byline(notice: Notice, now: Date): string {
  const author = notice.author ?? NOTICE_COPY.unknownAuthor;
  return `${author} · ${formatTime(notice.postedAt, now).label}`;
}

/** A notice with no words still has a kind; it is named, never left blank. */
function bodyOf(notice: Notice): string {
  return notice.text.trim()
    ? notice.text
    : (NOTICE_COPY.kinds[notice.kind] ?? NOTICE_COPY.label);
}

function NoticeDialog({
  notice,
  now,
  onClose,
}: {
  notice: Notice;
  now: Date;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={reads.sheet}
      aria-labelledby={headingId}
      data-ui="notice-dialog"
      onClose={onClose}
    >
      <header className={reads.head}>
        <div className={reads.heading}>
          <h2 id={headingId} className={reads.title}>
            {NOTICE_COPY.label}
          </h2>
          <p className={reads.muted}>{byline(notice, now)}</p>
        </div>
        <button
          type="button"
          className={`${reads.action} ${reads.close}`}
          onClick={() => dialog.current?.close()}
        >
          {NOTICE_COPY.close}
        </button>
      </header>
      <div className={reads.body}>
        <p className={reads.text}>{bodyOf(notice)}</p>
      </div>
    </dialog>
  );
}

/**
 * The notice pinned in a room: one line under the header, above the wall that
 * scrolls (stylegallery: sticky-header inside scroll-body-shell), opening to
 * the whole text. `null` is "this room has none" and draws nothing. A core
 * that does not offer the route — one older than 0.22.0 — also draws nothing;
 * any other refusal is said, with a retry.
 */
export function NoticeBar({
  http,
  roomId,
}: {
  http: NoticeTransport;
  roomId: string;
}) {
  const [open, setOpen] = useState(false);
  const [now] = useState(() => new Date());
  const run = useCallback(
    (signal: AbortSignal) =>
      http.request({
        path: "/notice",
        signal,
        generationKey: `notice:${roomId}`,
        query: new URLSearchParams({ roomId }),
      }),
    [http, roomId],
  );
  const [state, retry] = useRead(roomId, run);
  const close = useCallback(() => setOpen(false), []);

  if (state.phase === "loading") return null;
  if (state.phase === "failed") {
    if (isUnsupported(state.failure) || state.failure.kind === "protocol")
      return null;
    const { code } = readFailureCopy(state.failure);
    return (
      <div className={styles.bar} role="status" data-ui="notice-failed">
        <span className={styles.label}>{NOTICE_COPY.label}</span>
        <span className={styles.line}>
          {NOTICE_COPY.failed}
          {code ? <code className={styles.code}> {code}</code> : null}
        </span>
        <button type="button" className={reads.action} onClick={retry}>
          {NOTICE_COPY.retry}
        </button>
      </div>
    );
  }
  const notice = state.data.room.id === roomId ? state.data.notice : null;
  if (!notice) return null;
  return (
    <>
      <button
        type="button"
        className={styles.bar}
        data-ui="notice"
        data-source={notice.source}
        aria-haspopup="dialog"
        aria-label={`${NOTICE_COPY.open}: ${bodyOf(notice)}`}
        onClick={() => setOpen(true)}
      >
        <span className={styles.label} aria-hidden="true">
          {NOTICE_COPY.label}
        </span>
        <span className={styles.line} aria-hidden="true">
          {bodyOf(notice)}
        </span>
        <span className={styles.byline} aria-hidden="true">
          {byline(notice, now)}
        </span>
      </button>
      {open ? <NoticeDialog notice={notice} now={now} onClose={close} /> : null}
    </>
  );
}
