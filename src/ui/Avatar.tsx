import { type CSSProperties, useState } from "react";
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

/**
 * Addresses that failed once in this tab. A profile picture that did not load
 * is not asked for again by every row that shows the same person; the
 * monogram stands in until the page is reloaded.
 */
const failed = new Set<string>();

/** Whether an address is worth drawing: present and not already known to fail. */
export function usable(src: string | null | undefined): src is string {
  return typeof src === "string" && src !== "" && !failed.has(src);
}

/**
 * A picture laid over its own monogram. The monogram is always there, so a
 * picture that is slow, missing or refused never leaves a hole or moves the
 * row; when it fails, it is simply taken away.
 */
export function Picture({ src, onFail }: { src: string; onFail: () => void }) {
  return (
    <img
      className={styles.picture}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => {
        failed.add(src);
        onFail();
      }}
    />
  );
}

export interface AvatarProps {
  /** The name the square stands for; also the seed of its tone. */
  name: string;
  /** Side in px. */
  size: number;
  /**
   * The profile picture the bridge reported (0.17.0 `senderImage`), if any.
   * Without one — or once it fails — the monogram is what is drawn.
   */
  src?: string | null | undefined;
}

/**
 * A profile picture where the contract gives one, a letter on a colour where it
 * does not. Decorative by definition — the name it stands for is already in
 * the row — so it is hidden from assistive tech either way.
 */
export function Avatar({ name, size, src }: AvatarProps) {
  const tone = toneFor(name);
  const [, setBroken] = useState(0);
  const draw = usable(src);
  return (
    <span
      className={styles.avatar}
      data-ui="avatar"
      data-picture={draw || undefined}
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
      {draw ? (
        <Picture src={src} onFail={() => setBroken((count) => count + 1)} />
      ) : null}
    </span>
  );
}

export interface RoomAvatarProps {
  /** The room's title, for the monogram under the pictures. */
  name: string;
  size: number;
  /** 0.17.0 `Room.images`: the pictures its icon is made of, best first. */
  images?: readonly string[] | undefined;
}

/**
 * A room's icon: one picture as a single square; two to four as a grid inside
 * the same square, the way the messenger arrangement draws a group. A picture
 * that fails drops out of the grid, and with none left the monogram remains.
 */
export function RoomAvatar({ name, size, images }: RoomAvatarProps) {
  const [, setBroken] = useState(0);
  const shown = (images ?? []).filter(usable).slice(0, 4);
  if (shown.length <= 1)
    return <Avatar name={name} size={size} src={shown[0] ?? null} />;
  const tone = toneFor(name);
  return (
    <span
      className={styles.grid}
      data-ui="avatar"
      data-picture="grid"
      data-count={shown.length}
      aria-hidden="true"
      style={
        {
          "--size": `${size}px`,
          "--tone": tone,
        } as CSSProperties
      }
    >
      {shown.map((src) => (
        <span key={src} className={styles.cell}>
          <Picture src={src} onFail={() => setBroken((count) => count + 1)} />
        </span>
      ))}
    </span>
  );
}
