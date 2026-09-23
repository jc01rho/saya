import type { ReactNode } from "react";
import type { components } from "../contract/decoded";
import { COPY, kindLabel } from "./copy";
import { cx } from "./cx";
import { formatTime } from "./format";
import { Mention } from "./Mention";
import styles from "./MessageBubble.module.css";
import { QuoteBlock } from "./QuoteBlock";

type Message = components["schemas"]["Message"];

/** Below-ledge request states. An observed row never carries one. */
export type SendState = "pending" | "unknown" | "rejected";

const STATE_WORDS: Record<SendState, string> = {
  pending: COPY.pending,
  unknown: COPY.unknown,
  rejected: COPY.rejected,
};

const AVATAR_COLORS = [
  "#5865F2", // Discord Blurple
  "#57F287", // Green
  "#FEE75C", // Yellow
  "#EB459E", // Fuchsia
  "#ED4245", // Red
  "#00A8FC", // Cyan
  "#F47B67", // Coral
  "#1ABC9C", // Teal
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? "#5865F2";
}

export interface MessageBubbleProps {
  message: Message;
  now: Date;
  /**
   * Present only for a pending item on the ground. 보냈습니다 is never a
   * request status: it belongs to a fromMe row that was actually read back.
   */
  state?: SendState;
  /** Controls the composer feature supplies, e.g. 이 기록으로 확인 or 다시 보내기. */
  actions?: ReactNode;
}

/**
 * Messenger message turn:
 * - Other person's messages on the LEFT with avatar and speaker name.
 * - My messages (fromMe) aligned to the RIGHT.
 * Preserves children[0] = meta, children[1] = bubble, children[2] = footer.
 */
export function MessageBubble({
  message,
  now,
  state,
  actions,
}: MessageBubbleProps) {
  const time = formatTime(message.sentAt, now);
  const kind = kindLabel(message.kind);
  const quoted = message.kind === "reply" || message.replyTo !== undefined;
  const stateWord = state
    ? STATE_WORDS[state]
    : message.fromMe
      ? COPY.sent
      : null;
  const speakerName = (message.fromMe ? COPY.me : message.sender) || "?";
  const avatarLetter = speakerName.trim().slice(0, 1).toUpperCase();
  const avatarBg = getAvatarColor(speakerName);

  return (
    <article
      className={cx(styles.turn, message.fromMe ? styles.self : styles.other)}
      data-ui="message"
      data-side={message.fromMe ? "self" : "other"}
      data-state={state ?? (message.fromMe ? "read" : undefined)}
    >
      <div className={styles.meta}>
        {!message.fromMe ? (
          <div
            className={styles.avatar}
            style={{ backgroundColor: avatarBg }}
            aria-hidden="true"
          >
            {avatarLetter}
          </div>
        ) : null}
        <span className={styles.speaker}>{speakerName}</span>
        {time.dateTime ? (
          <time className={styles.time} dateTime={time.dateTime}>
            {time.label}
          </time>
        ) : (
          <span className={styles.time}>{time.label}</span>
        )}
        {message.mentionsAll ? <Mention name={null} all /> : null}
        {message.mentions?.map((mention) => (
          <Mention
            key={`${mention.userId}:${mention.at.join(",")}:${mention.length}`}
            name={mention.name}
          />
        ))}
      </div>
      <div className={styles.bubble}>
        {quoted ? <QuoteBlock source={message.replyTo ?? null} /> : null}
        {kind ? (
          <span className={styles.kind} data-ui="kind-label">
            {kind}
          </span>
        ) : null}
        {message.text ? (
          <p className={styles.text}>{message.text}</p>
        ) : kind ? null : (
          <span className={styles.kind}>{COPY.emptyBody}</span>
        )}
      </div>
      {stateWord || actions ? (
        <div className={styles.footer}>
          {stateWord ? (
            <span className={styles.state} data-ui="state-word">
              {stateWord}
            </span>
          ) : null}
          {actions}
        </div>
      ) : null}
    </article>
  );
}
