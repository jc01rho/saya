import { COPY } from "./copy";
import styles from "./Mention.module.css";

export interface MentionProps {
  /** The account's current name, or null when this profile has never seen it. */
  name: string | null;
  /** An @전체 mention that named nobody in particular. */
  all?: boolean;
}

/**
 * A mention rendered from metadata (G7): weight and underline, never colour
 * alone, and never a guessed character range inside the body text.
 */
export function Mention({ name, all = false }: MentionProps) {
  const label = all ? COPY.mentionAll : (name ?? COPY.mentionUnknown);
  return (
    <span className={styles.mention} data-ui="mention">
      @{label}
    </span>
  );
}
