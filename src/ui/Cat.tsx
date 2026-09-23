import type { CSSProperties } from "react";
import styles from "./Cat.module.css";
import { COPY } from "./copy";
import { cx } from "./cx";

export interface CatProps {
  /** walk only while the stream is connecting; still is the brand mark and the empty state. */
  motion?: "walk" | "still";
  /** Rendered height in CSS pixels; the mark is one text line tall by default. */
  height?: number;
  label?: string;
  className?: string;
}

/**
 * The saya cat: an original vector drawn here, in side profile, walking left to
 * right. Its silhouette follows the current ink. Motion is CSS transform only,
 * and under prefers-reduced-motion the cat stops and sits while staying visible.
 */
export function Cat({ motion = "still", height, label, className }: CatProps) {
  const walking = motion === "walk";
  const style = height
    ? ({ "--cat-height": `${height}px` } as CSSProperties)
    : undefined;
  return (
    <span
      className={cx(styles.cat, walking && styles.walking, className)}
      data-ui="cat"
      data-motion={motion}
      style={style}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 64 40"
        role="img"
        aria-label={label ?? (walking ? COPY.catWalking : COPY.cat)}
      >
        <title>{label ?? (walking ? COPY.catWalking : COPY.cat)}</title>
        <g className={styles.walkPose} data-cat-pose="walk">
          <g className={styles.facing}>
            <rect
              className={cx(styles.leg, styles.legA)}
              data-cat-part="leg"
              x="17"
              y="26"
              width="4.2"
              height="13"
              rx="2.1"
            />
            <rect
              className={cx(styles.leg, styles.legB)}
              data-cat-part="leg"
              x="22"
              y="26"
              width="4.2"
              height="13"
              rx="2.1"
            />
            <rect
              className={cx(styles.leg, styles.legB)}
              data-cat-part="leg"
              x="38"
              y="26"
              width="4.2"
              height="13"
              rx="2.1"
            />
            <rect
              className={cx(styles.leg, styles.legA)}
              data-cat-part="leg"
              x="43"
              y="26"
              width="4.2"
              height="13"
              rx="2.1"
            />
            <g className={styles.body}>
              <path
                className={styles.tail}
                d="M15 21C9 21 5 15 8 8C9 5 12 5 12 7"
              />
              <path d="M14 24C12.5 18 17 12.5 27 12C35 11.7 43 13.5 47.5 17C49.5 19.5 49 24 47 27C43 29.5 36 29.5 30 29C24 28.5 17 29.5 15 27.5C13.8 26.5 13.8 25.2 14 24Z" />
              <circle cx="52.5" cy="13" r="6.8" />
              <circle cx="58.5" cy="14.5" r="2.8" />
              <path d="M46.5 8.5L48 1.5L51.5 6.2Z" />
              <path d="M52.5 6.2L56 1.5L57.5 8.5Z" />
            </g>
          </g>
        </g>
        <g className={styles.sitPose} data-cat-pose="sit">
          <path
            className={styles.tail}
            d="M18 38C24 39.5 30 39.5 36 38.4C42 37.5 46 37 48 35.5"
          />
          <path d="M16 39C13 31 15 19 25 13.5C30 11 38 12.5 41 19L43 39Z" />
          <rect x="36.5" y="28" width="4.2" height="11" rx="2.1" />
          <rect x="42" y="28" width="4.2" height="11" rx="2.1" />
          <circle cx="42" cy="11.5" r="7" />
          <circle cx="48.5" cy="13" r="2.6" />
          <path d="M36.5 7L38 0.5L41.5 5Z" />
          <path d="M42.5 5L46 0.5L47.5 7Z" />
        </g>
      </svg>
    </span>
  );
}
