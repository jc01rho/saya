import type { ReactNode } from "react";
import styles from "./linkify.module.css";

/**
 * Only `http` and `https` are matched, so nothing in a message body can become
 * a `javascript:` or `data:` destination. The run stops at whitespace and the
 * tail is trimmed below.
 */
const URL_PATTERN = /https?:\/\/[^\s]+/g;

/** Trailing marks that read as sentence punctuation, not as part of the address. */
const TRAILING = new Set([
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  '"',
  "'",
  "»",
  "”",
  "’",
]);

/**
 * A closing bracket belongs to the URL only when the URL opened it, which is
 * what Wikipedia-style addresses need and what a URL inside parentheses does not.
 */
function trimTail(url: string): string {
  let end = url.length;
  while (end > 0) {
    const last = url[end - 1] as string;
    if (TRAILING.has(last)) {
      end -= 1;
      continue;
    }
    if (last === ")" || last === "]" || last === "}") {
      const open = last === ")" ? "(" : last === "]" ? "[" : "{";
      const slice = url.slice(0, end);
      const opened = slice.split(open).length - 1;
      const closed = slice.split(last).length - 1;
      if (closed > opened) {
        end -= 1;
        continue;
      }
    }
    break;
  }
  return url.slice(0, end);
}

/**
 * Splits a message body into text and links. The address is shown exactly as it
 * was written — never a title, a favicon or anything else fetched from the site,
 * because nothing here contacts it. Following the link is the reader's own act.
 */
export function linkify(text: string): ReactNode {
  URL_PATTERN.lastIndex = 0;
  const out: ReactNode[] = [];
  let cursor = 0;
  let match = URL_PATTERN.exec(text);
  let index = 0;
  while (match) {
    const href = trimTail(match[0]);
    if (href) {
      if (match.index > cursor) out.push(text.slice(cursor, match.index));
      out.push(
        <a
          key={`${index}:${match.index}`}
          className={styles.link}
          data-ui="message-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {href}
        </a>,
      );
      cursor = match.index + href.length;
      index += 1;
    }
    URL_PATTERN.lastIndex = match.index + match[0].length;
    match = URL_PATTERN.exec(text);
  }
  if (!out.length) return text;
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}
