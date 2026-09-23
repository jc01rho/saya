import type { ReactNode } from "react";
import type { components } from "../contract/decoded";
import { LinkCard } from "../features/linkcard";
import { Avatar } from "./Avatar";
import { COPY, kindLabel } from "./copy";
import { cx } from "./cx";
import { formatTime } from "./format";
import { firstUrl, linkify } from "./linkify";
import { Mention } from "./Mention";
import styles from "./MessageBubble.module.css";
import { Photo } from "./Photo";
import { QuoteBlock } from "./QuoteBlock";
import { Video } from "./Video";

type Message = components["schemas"]["Message"];

/** Below-ledge request states. An observed row never carries one. */
export type SendState = "pending" | "unknown" | "rejected";

const STATE_WORDS: Record<SendState, string> = {
  pending: COPY.pending,
  unknown: COPY.unknown,
  rejected: COPY.rejected,
};

/**
 * The words the desktop client writes in place of an attachment it cannot put
 * in a text column: 사진, 사진 N장, 동영상. They are not a caption — KakaoTalk
 * has none on an attachment — so once the picture or the player is drawn they
 * say strictly less than it does.
 *
 * Matched exactly, against this message's own count, so anything a person
 * actually typed survives. A body equal to its own kind label is the same kind
 * of placeholder and goes with them.
 */
function isMediaPlaceholder(
  text: string | undefined,
  message: Message,
  kind: string | null,
): boolean {
  const body = text?.trim();
  if (!body) return false;
  if (kind && body === kind) return true;
  if (
    message.photo &&
    (body === "사진" || body === `사진 ${message.photo.count}장`)
  )
    return true;
  return Boolean(message.video) && body === "동영상";
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
  const mentioned =
    message.mentionsAll === true || (message.mentions?.length ?? 0) > 0;
  // One card per turn, for the first address: a body full of links is a body,
  // not a wall of cards.
  const linked = message.text ? firstUrl(message.text) : null;
  // With the picture on screen, the kind label names what is already visible —
  // and it is the raw `other:27` for a kind the core could not name, which says
  // nothing to anyone. The body beside it is the client's placeholder for the
  // same attachment. Both go; a real caption, which is neither, stays.
  const media = Boolean(message.photo || message.video);
  const placeholder = isMediaPlaceholder(message.text, message, kind);
  const showLabel = Boolean(kind) && !media && !placeholder;
  const showText = Boolean(message.text) && !placeholder;

  return (
    <article
      className={cx(styles.turn, message.fromMe ? styles.self : styles.other)}
      data-ui="message"
      data-side={message.fromMe ? "self" : "other"}
      data-state={state ?? (message.fromMe ? "read" : undefined)}
    >
      <div className={styles.row}>
        {message.fromMe ? null : <Avatar name={speakerName} size={36} />}
        <div className={styles.bubble}>
          {message.fromMe && !mentioned ? null : (
            <div className={styles.meta}>
              {message.fromMe ? null : (
                <span className={styles.speaker}>{speakerName}</span>
              )}
              {message.mentionsAll ? <Mention name={null} all /> : null}
              {message.mentions?.map((mention) => (
                <Mention
                  key={`${mention.userId}:${mention.at.join(",")}:${mention.length}`}
                  name={mention.name}
                />
              ))}
            </div>
          )}
          {quoted ? <QuoteBlock source={message.replyTo ?? null} /> : null}
          {/*
            The core sends a photo as kind `photo` with the body text 사진. That
            word is a placeholder for the picture, so once the picture itself is
            on screen neither the label nor the body should repeat it.
          */}
          {showLabel ? (
            <span className={styles.kind} data-ui="kind-label">
              {kind}
            </span>
          ) : null}
          {showText ? (
            <p className={styles.text}>{linkify(message.text as string)}</p>
          ) : showLabel || media ? null : (
            <span className={styles.kind}>{COPY.emptyBody}</span>
          )}
          {message.photo ? <Photo photo={message.photo} now={now} /> : null}
          {message.video ? <Video video={message.video} now={now} /> : null}
          {linked ? <LinkCard url={linked} /> : null}
          {/* The stamp rides the last line, as it does in every messenger. */}
          <time
            className={styles.time}
            {...(time.dateTime ? { dateTime: time.dateTime } : {})}
          >
            {time.label}
          </time>
        </div>
      </div>
      {stateWord || actions ? (
        <div className={styles.footer}>
          {stateWord ? (
            <span
              /*
               * A row that was read back needs no word repeated under every
               * line: its presence on the wall, above the ledge, already says
               * it. The word stays in the accessible name, where the ledge's
               * position carries nothing.
               */
              className={state ? styles.state : "sr-only"}
              data-ui="state-word"
            >
              {stateWord}
            </span>
          ) : null}
          {actions}
        </div>
      ) : null}
    </article>
  );
}
