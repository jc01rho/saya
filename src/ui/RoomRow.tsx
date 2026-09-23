import type { MouseEvent } from "react";
import type { components } from "../contract/decoded";
import { COPY, unreadName } from "./copy";
import { cx } from "./cx";
import { formatTime } from "./format";
import styles from "./RoomRow.module.css";
import { UnreadBadge } from "./UnreadBadge";

type Room = components["schemas"]["Room"];

export interface RoomRowProps {
  room: Room;
  /** The hash route for this room; ids travel as the wire string, never as a number. */
  href: string;
  active?: boolean;
  /** A body this client observed through /context or /stream. Nothing else may become a preview (G1). */
  preview?: string | null;
  /** Injected so rows render deterministically; the list decides how often it ticks. */
  now: Date;
  onSelect?: ((event: MouseEvent<HTMLAnchorElement>) => void) | undefined;
}

/**
 * One catalog row: title and time, then the observed preview or its honest
 * absence, then the desktop's unread count. Unreadable rooms keep full ink and
 * state their reason. The active row breaks the list divider: the doorway gap.
 * The parent list continues the divider below the last row.
 */
export function RoomRow({
  room,
  href,
  active = false,
  preview = null,
  now,
  onSelect,
}: RoomRowProps) {
  const time = formatTime(room.lastActivityAt, now);
  const unreadable = !room.readable;
  const secondLine = unreadable ? COPY.unreadable : (preview ?? COPY.noPreview);
  const showBadge = !unreadable && room.unread > 0;
  return (
    <li
      className={cx(
        styles.row,
        active && styles.active,
        unreadable && styles.unreadable,
      )}
      data-ui="room-row"
      data-active={active || undefined}
      data-readable={room.readable}
    >
      <a
        className={styles.link}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onSelect}
      >
        <span className={styles.prefix} aria-hidden="true">
          #
        </span>
        <div className={styles.body}>
          <div className={styles.header}>
            <span className={styles.title}>{room.title}</span>
            {time.dateTime ? (
              <time className={styles.time} dateTime={time.dateTime}>
                {time.label}
              </time>
            ) : (
              <span className={styles.time}>{time.label}</span>
            )}
          </div>
          <div className={styles.sub}>
            <span className={styles.preview}>{secondLine}</span>
            {showBadge ? (
              <span className={styles.badge}>
                <UnreadBadge count={room.unread} />
                <span className="sr-only">{unreadName(room.unread)}</span>
              </span>
            ) : null}
          </div>
        </div>
      </a>
    </li>
  );
}
