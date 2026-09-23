import type { CSSProperties } from "react";
import styles from "./Avatar.module.css";

/**
 * Tones for the monogram. Eight of them, picked by a hash of the name so the
 * same person keeps the same circle across a session and across panes.
 */
const TONES = [
  "#5865F2",
  "#57F287",
  "#FEE75C",
  "#EB459E",
  "#ED4245",
  "#00A8FC",
  "#F47B67",
  "#1ABC9C",
] as const;

function toneFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return TONES[Math.abs(hash) % TONES.length] ?? TONES[0];
}

/**
 * White sinks into the lighter tones, so the monogram takes the page's ink
 * there instead. WCAG relative luminance, same formula as the token audit.
 */
function inkFor(tone: string): string {
  const channel = (offset: number) => {
    const value = Number.parseInt(tone.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.4 ? "#2A2724" : "#FFFFFF";
}

/**
 * The first grapheme of the name, so a Hangul syllable, an emoji or a Latin
 * letter all give one glyph rather than half a surrogate pair.
 */
function monogram(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const [first] = [...trimmed];
  return (first ?? "?").toUpperCase();
}

export interface AvatarProps {
  /** The name the circle stands for; also the seed of its tone. */
  name: string;
  /** Diameter in px. */
  size: number;
}

/**
 * `Room` and `Message` carry no image member in `openapi.json`, so there is no
 * photograph to fetch and none is invented: this is a letter on a colour.
 * Decorative by definition — the name it stands for is already in the row.
 */
export function Avatar({ name, size }: AvatarProps) {
  const tone = toneFor(name);
  return (
    <span
      className={styles.avatar}
      data-ui="avatar"
      aria-hidden="true"
      style={
        {
          "--size": `${size}px`,
          "--tone": tone,
          "--tone-ink": inkFor(tone),
        } as CSSProperties
      }
    >
      {monogram(name)}
    </span>
  );
}
