import { useEffect, useState } from "react";
import {
  type AdapterAttachment,
  type AdapterMessage,
  type AdapterReaction,
  mediaUrl,
} from "../../transport/adapters";
import { Avatar, cx, formatTime } from "../../ui";
import { formatSize } from "../attachments/pages";
import styles from "./Thread.module.css";

export const COPY = {
  media: "사진·파일 등",
  service: "알림",
  edited: "수정됨",
  unshown: "불러오지 못했습니다",
  kinds: {
    file: "파일",
    image: "사진",
    video: "동영상",
    audio: "오디오",
    voice: "음성 메시지",
    sticker: "스티커",
    animation: "움직이는 이미지",
  } as Record<string, string>,
  more: "메시지 동작",
  tools: "이 메시지에 할 수 있는 일",
  reply: "답장",
  edit: "수정",
  delete: "삭제",
  confirmDelete: (forEveryone: boolean) =>
    forEveryone ? "모두에게서 삭제할까요?" : "이 계정에서만 삭제할까요?",
  cancel: "취소",
  deleting: "삭제하는 중",
  react: (emoji: string) => `${emoji} 반응 남기기`,
  reactions: "반응",
  reaction: (emoji: string, count: number, mine: boolean) =>
    `${emoji} ${count.toLocaleString("ko-KR")}명${mine ? ", 내 반응 포함" : ""}`,
  quoteMissing: "불러온 범위 밖의 메시지에 대한 답장",
} as const;

/** A short, messenger-neutral set; a room that allows fewer refuses the rest. */
export const QUICK_REACTIONS = [
  "\u{1F44D}",
  "\u2764",
  "\u{1F525}",
  "\u{1F601}",
  "\u{1F622}",
  "\u{1F64F}",
] as const;

/** What this room lets the account do to a message, already narrowed by the room. */
export interface MessageAbilities {
  reply: boolean;
  edit: { maxAgeSeconds?: number } | undefined;
  delete: { forEveryone: boolean } | undefined;
  react: boolean;
}

export function canEdit(
  message: AdapterMessage,
  edit: MessageAbilities["edit"],
  now: number,
): boolean {
  if (!edit || !message.fromMe || message.kind !== "text" || !message.text)
    return false;
  if (edit.maxAgeSeconds === undefined) return true;
  return now - Date.parse(message.sentAt) < edit.maxAgeSeconds * 1000;
}

/**
 * The whole set of this account's reactions after a tap on `emoji`: off if it
 * was on, otherwise on, dropping the oldest when the messenger allows fewer.
 */
export function toggledReactions(
  current: AdapterReaction[] | undefined,
  emoji: string,
  maxPerMessage: number | undefined,
): string[] {
  const mine = (current ?? [])
    .filter((reaction) => reaction.mine)
    .map((reaction) => reaction.emoji);
  if (mine.includes(emoji)) return mine.filter((own) => own !== emoji);
  const next = [...mine, emoji];
  return maxPerMessage !== undefined && next.length > maxPerMessage
    ? next.slice(next.length - maxPerMessage)
    : next;
}

/** Types `/media` serves inline, so an `<img>` can draw them; anything else is a download. */
const DRAWABLE = /^image\/(?:jpeg|png|gif|webp|avif)$/;

export function attachmentLabel(kind: string): string {
  return COPY.kinds[kind] ?? COPY.kinds.file ?? "";
}

function Attachment({
  adapterId,
  attachment,
}: {
  adapterId: string;
  attachment: AdapterAttachment;
}) {
  const [broken, setBroken] = useState(false);
  const href = mediaUrl(adapterId, attachment.id);
  const label = attachmentLabel(attachment.kind);
  const drawable =
    (attachment.kind === "image" || attachment.kind === "sticker") &&
    DRAWABLE.test(attachment.mimeType ?? "");
  if (drawable && !broken)
    return (
      <a
        className={cx(
          styles.picture,
          attachment.kind === "sticker" && styles.sticker,
        )}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-ui="adapter-picture"
      >
        <img
          src={href}
          alt={attachment.name ?? label}
          width={attachment.width}
          height={attachment.height}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      </a>
    );
  const seconds = attachment.durationSeconds;
  const meta = [
    attachment.name ? label : null,
    seconds === undefined
      ? null
      : `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`,
    broken ? COPY.unshown : formatSize(attachment.size),
  ].filter(Boolean);
  return (
    <a
      className={styles.file}
      href={href}
      download={attachment.name ?? ""}
      data-ui="adapter-file"
    >
      <span className={styles.fileName}>{attachment.name ?? label}</span>
      <span className={styles.fileMeta}>{meta.join(" · ")}</span>
    </a>
  );
}

export function gist(message: AdapterMessage): string {
  if (message.text) return message.text;
  const first = message.attachments?.[0];
  return first ? attachmentLabel(first.kind) : COPY.media;
}

function Quote({ quoted }: { quoted: AdapterMessage | undefined }) {
  return (
    <blockquote className={styles.quote} data-ui="adapter-quote">
      {quoted ? (
        <>
          <span className={styles.quoteSender}>{quoted.sender}</span>
          <span className={styles.quoteText}>{gist(quoted)}</span>
        </>
      ) : (
        <span className={styles.quoteText}>{COPY.quoteMissing}</span>
      )}
    </blockquote>
  );
}

function Reactions({
  reactions,
  onToggle,
}: {
  reactions: AdapterReaction[];
  onToggle: ((emoji: string) => void) | undefined;
}) {
  return (
    <ul
      className={styles.reactions}
      aria-label={COPY.reactions}
      data-ui="adapter-reactions"
    >
      {reactions.map((reaction) => {
        const label = COPY.reaction(
          reaction.emoji,
          reaction.count,
          reaction.mine,
        );
        const body = (
          <>
            <span className={styles.emoji} aria-hidden="true">
              {reaction.emoji}
            </span>
            <span aria-hidden="true">
              {reaction.count.toLocaleString("ko-KR")}
            </span>
          </>
        );
        return (
          <li key={reaction.emoji}>
            {onToggle ? (
              <button
                type="button"
                className={cx(styles.chip, reaction.mine && styles.chipMine)}
                aria-pressed={reaction.mine}
                aria-label={label}
                onClick={() => onToggle(reaction.emoji)}
              >
                {body}
              </button>
            ) : (
              <span
                className={cx(styles.chip, reaction.mine && styles.chipMine)}
                role="img"
                aria-label={label}
              >
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type ToolAction =
  | { kind: "reply" }
  | { kind: "edit" }
  | { kind: "delete" }
  | { kind: "react"; emoji: string };

function Tools({
  message,
  abilities,
  editable,
  note,
  busy,
  onAction,
  onClose,
}: {
  message: AdapterMessage;
  abilities: MessageAbilities;
  editable: boolean;
  note: string | null;
  busy: boolean;
  onAction: (action: ToolAction) => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const mine = new Set(
    (message.reactions ?? [])
      .filter((reaction) => reaction.mine)
      .map((reaction) => reaction.emoji),
  );
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return (
    <fieldset
      className={styles.tools}
      aria-label={COPY.tools}
      data-ui="adapter-tools"
    >
      {confirming && abilities.delete ? (
        <>
          <span className={styles.toolsLine}>
            {COPY.confirmDelete(abilities.delete.forEveryone)}
          </span>
          <button
            type="button"
            className={cx(styles.tool, styles.toolDanger)}
            disabled={busy}
            onClick={() => onAction({ kind: "delete" })}
            data-ui="adapter-delete-confirm"
          >
            {busy ? COPY.deleting : COPY.delete}
          </button>
          <button
            type="button"
            className={styles.tool}
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            {COPY.cancel}
          </button>
        </>
      ) : (
        <>
          {abilities.react
            ? QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={cx(
                    styles.tool,
                    styles.toolEmoji,
                    mine.has(emoji) && styles.chipMine,
                  )}
                  aria-pressed={mine.has(emoji)}
                  aria-label={COPY.react(emoji)}
                  disabled={busy}
                  onClick={() => onAction({ kind: "react", emoji })}
                >
                  <span className={styles.emoji} aria-hidden="true">
                    {emoji}
                  </span>
                </button>
              ))
            : null}
          {abilities.reply ? (
            <button
              type="button"
              className={styles.tool}
              onClick={() => onAction({ kind: "reply" })}
              data-ui="adapter-reply"
            >
              {COPY.reply}
            </button>
          ) : null}
          {editable ? (
            <button
              type="button"
              className={styles.tool}
              onClick={() => onAction({ kind: "edit" })}
              data-ui="adapter-edit"
            >
              {COPY.edit}
            </button>
          ) : null}
          {abilities.delete && message.fromMe ? (
            <button
              type="button"
              className={styles.tool}
              onClick={() => setConfirming(true)}
              data-ui="adapter-delete"
            >
              {COPY.delete}
            </button>
          ) : null}
        </>
      )}
      {note ? (
        <p className={styles.toolsNote} role="status">
          {note}
        </p>
      ) : null}
    </fieldset>
  );
}

export function Turn({
  adapterId,
  files,
  avatars,
  message,
  previous,
  quoted,
  now,
  abilities,
  open,
  note,
  busy,
  onOpen,
  onAction,
}: {
  adapterId: string;
  /** Whether the adapter declares `attachments.read`, so `/media` answers. */
  files: boolean;
  /** Whether this room declares `avatars.read`; pictures also require `files`. */
  avatars: boolean;
  message: AdapterMessage;
  previous: AdapterMessage | undefined;
  /** The message this one replies to, when it is in the loaded window. */
  quoted: AdapterMessage | undefined;
  now: Date;
  abilities: MessageAbilities;
  open: boolean;
  note: string | null;
  busy: boolean;
  onOpen: (open: boolean) => void;
  onAction: (action: ToolAction) => void;
}) {
  if (message.kind === "service")
    return (
      <li className={styles.service} data-ui="adapter-service">
        {message.text || COPY.service}
      </li>
    );
  const continued =
    previous !== undefined &&
    previous.kind !== "service" &&
    previous.fromMe === message.fromMe &&
    (previous.senderId ?? previous.sender) ===
      (message.senderId ?? message.sender);
  const avatar =
    files && avatars && message.senderAvatar
      ? mediaUrl(adapterId, message.senderAvatar)
      : undefined;
  const time = formatTime(message.sentAt, now);
  const bare =
    files &&
    !message.text &&
    !message.replyTo &&
    message.attachments?.length === 1 &&
    message.attachments[0]?.kind === "sticker";
  const editable = canEdit(message, abilities.edit, now.getTime());
  const actionable =
    abilities.react ||
    abilities.reply ||
    editable ||
    (abilities.delete !== undefined && message.fromMe);
  return (
    <li
      className={cx(styles.turn, message.fromMe && styles.mine)}
      data-ui="adapter-turn"
      data-message-id={message.id}
    >
      {!message.fromMe && !continued ? (
        <span className={cx(styles.sender, avatar && styles.senderWithAvatar)}>
          {avatar ? (
            <Avatar name={message.sender} size={24} src={avatar} />
          ) : null}
          {message.sender}
        </span>
      ) : null}
      <div className={styles.line}>
        <div className={cx(styles.bubble, bare && styles.bare)}>
          {message.replyTo !== undefined ? <Quote quoted={quoted} /> : null}
          {files && message.attachments ? (
            message.attachments.map((attachment) => (
              <Attachment
                key={attachment.id}
                adapterId={adapterId}
                attachment={attachment}
              />
            ))
          ) : message.kind === "media" ? (
            <span className={styles.media}>{COPY.media}</span>
          ) : null}
          {message.text ? (
            <span className={styles.text}>{message.text}</span>
          ) : null}
        </div>
        <time className={styles.time} dateTime={message.sentAt}>
          {time.label}
          {message.editedAt ? ` · ${COPY.edited}` : null}
        </time>
        {actionable ? (
          <button
            type="button"
            className={styles.more}
            aria-label={COPY.more}
            aria-expanded={open}
            onClick={() => onOpen(!open)}
            data-ui="adapter-more"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="4.5" cy="10" r="1.6" />
              <circle cx="10" cy="10" r="1.6" />
              <circle cx="15.5" cy="10" r="1.6" />
            </svg>
          </button>
        ) : null}
      </div>
      {message.reactions?.length ? (
        <Reactions
          reactions={message.reactions}
          onToggle={
            abilities.react && !busy
              ? (emoji) => onAction({ kind: "react", emoji })
              : undefined
          }
        />
      ) : null}
      {open ? (
        <Tools
          message={message}
          abilities={abilities}
          editable={editable}
          note={note}
          busy={busy}
          onAction={onAction}
          onClose={() => onOpen(false)}
        />
      ) : note ? (
        <p className={styles.toolsNote} role="status">
          {note}
        </p>
      ) : null}
    </li>
  );
}
