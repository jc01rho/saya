import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { components } from "../../contract/decoded";
import type { HttpOutcome, JsonRequest } from "../../transport/http";
import { Cat, cx, formatTime, isExpired } from "../../ui";
import { failureOf, type ReadFailure, readFailureCopy } from "../reads";
import { FileDownload, type FileTransport } from "../reads/FileDownload";
import reads from "../reads/reads.module.css";
import styles from "./Attachments.module.css";
import {
  type AttachmentKind,
  beforeIdOf,
  formatSize,
  KINDS,
  mergeOlder,
  PAGE_LIMIT,
} from "./pages";

type Attachment = components["schemas"]["Attachment"];
type Attachments = components["schemas"]["Attachments"];

export interface AttachmentsTransport extends FileTransport {
  request(
    request: JsonRequest<"/attachments">,
  ): Promise<HttpOutcome<Attachments>>;
}

export const ATTACHMENTS_COPY = {
  title: "모아보기",
  close: "닫기",
  kinds: "종류",
  kind: {
    all: "전체",
    photo: "사진",
    video: "동영상",
    file: "파일",
    link: "링크",
  },
  loading: "모아보는 중",
  more: "더 이전 메시지 살펴보기",
  moreLoading: "더 이전 메시지를 살펴보는 중",
  scope: (scanned: number, found: number) =>
    `최근 메시지 최대 ${scanned.toLocaleString("ko-KR")}개에서 ${found.toLocaleString("ko-KR")}개를 찾았습니다. 이 기기에 저장된 기록만 봅니다`,
  /** Only the range looked through is empty, never the room. */
  empty: "살펴본 범위에서 찾은 것이 없습니다",
  exhausted: "이 범위에서 더 이전 항목을 찾지 못해 여기서 멈춥니다",
  retry: "다시 시도",
  album: (count: number) => `${count}장`,
  open: (label: string, sender: string) =>
    `${sender}의 ${label} 새 창에서 열기`,
  expired: "만료됨",
  unnamed: "이름 없는 파일",
} as const;

type Pages = {
  items: Attachment[];
  pages: number;
  loading: "first" | "more" | null;
  failure: ReadFailure | null;
  /** An older page found nothing, so there is no id left to page back from. */
  exhausted: boolean;
};

const START: Pages = {
  items: [],
  pages: 0,
  loading: "first",
  failure: null,
  exhausted: false,
};

/**
 * Pages of `/attachments` for one room and kind. A new kind starts over and
 * aborts what was in flight; an answer for another room is a broken bridge.
 */
function useAttachmentPages(
  http: AttachmentsTransport,
  roomId: string,
  kind: AttachmentKind | null,
) {
  const [pages, setPages] = useState<Pages>(START);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(
    (beforeId: string | null) => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      setPages((held) =>
        beforeId === null ? START : { ...held, loading: "more", failure: null },
      );
      const query = new URLSearchParams({
        roomId,
        open: "true",
        limit: String(PAGE_LIMIT),
      });
      if (kind) query.set("kind", kind);
      if (beforeId) query.set("beforeId", beforeId);
      http
        .request({
          path: "/attachments",
          signal: current.signal,
          generationKey: `attachments:${roomId}`,
          query,
        })
        .then(
          (outcome) => {
            if (current.signal.aborted || outcome.kind === "discarded") return;
            if (outcome.kind === "failure") {
              setPages((held) => ({
                ...held,
                loading: null,
                failure: { kind: "bridge", outcome },
              }));
              return;
            }
            const answer = outcome.data;
            if (
              answer.room.id !== roomId ||
              (kind !== null &&
                answer.attachments.some((item) => item.kind !== kind))
            ) {
              setPages((held) => ({
                ...held,
                loading: null,
                failure: { kind: "protocol" },
              }));
              return;
            }
            setPages((held) => {
              const base = beforeId === null ? [] : held.items;
              const items = mergeOlder(base, answer.attachments);
              return {
                items,
                pages: (beforeId === null ? 0 : held.pages) + 1,
                loading: null,
                failure: null,
                exhausted: beforeId !== null && items.length === base.length,
              };
            });
          },
          (error: unknown) => {
            if (current.signal.aborted) return;
            setPages((held) => ({
              ...held,
              loading: null,
              failure: failureOf(error),
            }));
          },
        );
    },
    [http, roomId, kind],
  );

  useEffect(() => {
    load(null);
    return () => controller.current?.abort();
  }, [load]);

  const more = () => {
    const beforeId = beforeIdOf(pages.items);
    if (beforeId) load(beforeId);
  };
  const retry = () => (pages.pages === 0 ? load(null) : more());
  return { pages, more, retry };
}

function labelOf(kind: AttachmentKind): string {
  return ATTACHMENTS_COPY.kind[kind];
}

/** A picture or a video as a square frame (stylegallery: ram-grid + frame). */
function MediaTile({ item, now }: { item: Attachment; now: Date }) {
  const [failed, setFailed] = useState(false);
  const gone = failed || isExpired(item.url, now, item.expiresAt);
  const label = labelOf(item.kind);
  const inner = gone ? (
    <span className={styles.gone}>{ATTACHMENTS_COPY.expired}</span>
  ) : item.kind === "photo" ? (
    <img
      className={styles.media}
      src={item.url}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={styles.play} aria-hidden="true">
      ▶
    </span>
  );
  const badge =
    item.count !== undefined
      ? ATTACHMENTS_COPY.album(item.count)
      : item.kind === "video"
        ? formatSize(item.size)
        : null;
  return (
    <li className={styles.tile} data-ui="attachment" data-kind={item.kind}>
      {gone ? (
        <div className={styles.frame}>{inner}</div>
      ) : (
        <a
          className={styles.frame}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          aria-label={ATTACHMENTS_COPY.open(label, item.sender)}
        >
          {inner}
        </a>
      )}
      {badge ? (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </li>
  );
}

/** A file or a link as a text row: what it is, then who sent it and when (stylegallery: media-object). */
function Row({
  item,
  now,
  http,
  roomId,
}: {
  item: Attachment;
  now: Date;
  http: AttachmentsTransport;
  roomId: string;
}) {
  const time = formatTime(item.sentAt, now);
  const size = formatSize(item.size);
  return (
    <li className={styles.row} data-ui="attachment" data-kind={item.kind}>
      <span className={styles.kind}>{labelOf(item.kind)}</span>
      <div className={styles.what}>
        {item.kind === "link" ? (
          <a
            className={styles.link}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {item.url}
          </a>
        ) : (
          <span className={styles.name}>
            {item.name ?? ATTACHMENTS_COPY.unnamed}
          </span>
        )}
        <span className={reads.muted}>
          {item.sender} ·{" "}
          <time {...(time.dateTime ? { dateTime: time.dateTime } : {})}>
            {time.label}
          </time>
          {size ? ` · ${size}` : null}
        </span>
        {item.kind === "file" ? (
          <FileDownload
            http={http}
            roomId={roomId}
            messageId={item.messageId}
            name={item.name}
          />
        ) : null}
      </div>
    </li>
  );
}

export interface AttachmentsSheetProps {
  /** The id the header's toggle names in `aria-controls`. */
  id: string;
  http: AttachmentsTransport;
  roomId: string;
  onClose: () => void;
  className?: string | undefined;
}

/**
 * What a room's newest messages carried: photos, videos, files and links,
 * filtered by the bridge and paged back by message id. The scope line says
 * how far it looked, so an empty page is never read as an empty room.
 *
 * r4: a side panel beside the conversation rather than a modal over it, the
 * way the messenger arrangement shows a room's information. Below the
 * two-pane break the same panel covers the thread, and Escape closes it.
 */
export default function AttachmentsSheet({
  id,
  http,
  roomId,
  onClose,
  className,
}: AttachmentsSheetProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const [kind, setKind] = useState<AttachmentKind | null>(null);
  const [now] = useState(() => new Date());
  const { pages, more, retry } = useAttachmentPages(http, roomId, kind);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const media = pages.items.filter(
    (item) => item.kind === "photo" || item.kind === "video",
  );
  const rows = pages.items.filter(
    (item) => item.kind === "file" || item.kind === "link",
  );
  const failure = pages.failure ? readFailureCopy(pages.failure) : null;
  const settled = pages.pages > 0;

  return (
    <aside
      id={id}
      className={cx(styles.panel, className)}
      aria-labelledby={headingId}
      data-ui="attachments"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
    >
      <header className={styles.head}>
        <h2 id={headingId} ref={heading} className={styles.title} tabIndex={-1}>
          {ATTACHMENTS_COPY.title}
        </h2>
        <button
          type="button"
          className={styles.close}
          data-ui="attachments-close"
          onClick={onClose}
        >
          <span className="sr-only">{ATTACHMENTS_COPY.close}</span>
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M5 5l8 8M13 5l-8 8" />
          </svg>
        </button>
      </header>
      <div
        className={styles.body}
        data-ui="attachments-body"
        aria-busy={pages.loading !== null || undefined}
      >
        {/* Peer filters in one row that wraps (stylegallery: tab-strip); each re-asks the bridge. */}
        <fieldset className={styles.kinds}>
          <legend className="sr-only">{ATTACHMENTS_COPY.kinds}</legend>
          {KINDS.map((option) => (
            <button
              key={option ?? "all"}
              type="button"
              className={reads.action}
              data-ui="attachments-kind"
              data-kind={option ?? "all"}
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
            >
              {option ? labelOf(option) : ATTACHMENTS_COPY.kind.all}
            </button>
          ))}
        </fieldset>
        {pages.loading === "first" ? (
          <p className={reads.status} role="status">
            <span data-ui="theme-loader" aria-hidden="true" />
            {ATTACHMENTS_COPY.loading}
          </p>
        ) : null}
        {settled ? (
          <p className={reads.status} data-ui="attachments-scope">
            {ATTACHMENTS_COPY.scope(
              pages.pages * PAGE_LIMIT,
              pages.items.length,
            )}
          </p>
        ) : null}
        {failure ? (
          <div
            className={reads.notice}
            role="status"
            data-ui="attachments-failed"
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
              {ATTACHMENTS_COPY.retry}
            </button>
          </div>
        ) : null}
        {media.length > 0 ? (
          <ul className={styles.grid} data-ui="attachments-media">
            {media.map((item) => (
              <MediaTile
                key={`${item.messageId}:${item.url}`}
                item={item}
                now={now}
              />
            ))}
          </ul>
        ) : null}
        {rows.length > 0 ? (
          <ul className={styles.rows} data-ui="attachments-rows">
            {rows.map((item) => (
              <Row
                key={`${item.messageId}:${item.kind}:${item.url}`}
                item={item}
                now={now}
                http={http}
                roomId={roomId}
              />
            ))}
          </ul>
        ) : null}
        {settled && pages.items.length === 0 && !pages.loading ? (
          <div className={reads.empty} data-ui="attachments-empty">
            <Cat height={48} />
            <p>{ATTACHMENTS_COPY.empty}</p>
          </div>
        ) : null}
        {pages.exhausted ? (
          <p className={reads.status} data-ui="attachments-exhausted">
            {ATTACHMENTS_COPY.exhausted}
          </p>
        ) : settled && pages.items.length > 0 ? (
          <button
            type="button"
            className={`${reads.action} ${styles.more}`}
            data-ui="attachments-more"
            aria-disabled={pages.loading === "more" || undefined}
            onClick={pages.loading === "more" ? undefined : more}
          >
            {pages.loading === "more" ? (
              <>
                <span data-ui="theme-loader" aria-hidden="true" />
                {ATTACHMENTS_COPY.moreLoading}
              </>
            ) : (
              ATTACHMENTS_COPY.more
            )}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
