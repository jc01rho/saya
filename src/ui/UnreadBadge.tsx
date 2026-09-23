import { badgeLabel } from "./format";
import styles from "./UnreadBadge.module.css";

/**
 * The desktop's unread count as a pill: exact 1..99, then 99+, nothing at 0.
 * It is decorative for assistive tech; the row carries the exact count in its name.
 */
export function UnreadBadge({ count }: { count: number }) {
  const label = badgeLabel(count);
  if (label === null) return null;
  return (
    <span className={styles.badge} data-ui="unread-badge" aria-hidden="true">
      {label}
    </span>
  );
}
