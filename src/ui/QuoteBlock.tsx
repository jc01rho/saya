import type { components } from "../contract/decoded";
import { COPY, kindLabel } from "./copy";
import styles from "./QuoteBlock.module.css";

type ReplySource = components["schemas"]["ReplySource"];

export interface QuoteBlockProps {
  /** The reply's own copy of what it answered; every member may be null (G9). */
  source: ReplySource | null | undefined;
}

/**
 * The quoted message inside a reply bubble: a 2px rule, the quoted speaker and
 * two lines of text. Missing information is said, never invented.
 */
export function QuoteBlock({ source }: QuoteBlockProps) {
  const text = source?.text?.trim() ? source.text : null;
  const kind = source?.kind ? kindLabel(source.kind) : null;
  const body = text ?? kind;
  const sender = source?.sender ?? null;
  if (!body && !sender)
    return (
      <blockquote className={styles.quote} data-ui="quote" data-empty="true">
        <span className={styles.text}>{COPY.quoteMissing}</span>
      </blockquote>
    );
  return (
    <blockquote className={styles.quote} data-ui="quote">
      {sender ? <span className={styles.sender}>{sender}</span> : null}
      <span className={styles.text}>{body ?? COPY.quoteMissing}</span>
    </blockquote>
  );
}
