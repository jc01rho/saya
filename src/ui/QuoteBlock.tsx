import type { KeyboardEvent } from "react";
import type { components } from "../contract/decoded";
import { COPY, kindLabel } from "./copy";
import styles from "./QuoteBlock.module.css";

type ReplySource = components["schemas"]["ReplySource"];

export interface QuoteBlockProps {
  /** The reply's own copy of what it answered; every member may be null (G9). */
  source: ReplySource | null | undefined;
  /** Present where the original can be looked for; the quote becomes a button to it. */
  onJump?: (() => void) | undefined;
}

function jumpProps(onJump: () => void) {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": COPY.quoteJump,
    "data-jump": "true",
    onClick: onJump,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onJump();
    },
  } as const;
}

/**
 * The quoted message inside a reply bubble: a 2px rule, the quoted speaker and
 * two lines of text. Missing information is said, never invented.
 */
export function QuoteBlock({ source, onJump }: QuoteBlockProps) {
  const text = source?.text?.trim() ? source.text : null;
  const kind = source?.kind ? kindLabel(source.kind) : null;
  const body = text ?? kind;
  const sender = source?.sender ?? null;
  if (!body && !sender) {
    return (
      <blockquote
        className={styles.quote}
        data-ui="quote"
        data-empty="true"
        {...(onJump ? jumpProps(onJump) : {})}
      >
        <span className={styles.text}>{COPY.quoteMissing}</span>
      </blockquote>
    );
  }
  return (
    <blockquote
      className={styles.quote}
      data-ui="quote"
      {...(onJump ? jumpProps(onJump) : {})}
    >
      {sender ? <span className={styles.sender}>{sender}</span> : null}
      <span className={styles.text}>{body ?? COPY.quoteMissing}</span>
    </blockquote>
  );
}
