import { useCallback, useEffect, useRef, useState } from "react";
import type { components } from "../contract/decoded";
import { COPY } from "./copy";
import { cx } from "./cx";
import { carrierExpired } from "./expiry";
import styles from "./Photo.module.css";

type PhotoData = components["schemas"]["Photo"];
type PhotoImage = components["schemas"]["PhotoImage"];

/** Four tiles at most; the rest are reached by opening the album. */
const TILE_LIMIT = 4;

/**
 * A size the client did not store arrives as 0. Falling back to a square keeps
 * the reserved box honest instead of dividing by zero.
 */
function ratio(image: PhotoImage): string {
  return image.width > 0 && image.height > 0
    ? `${image.width} / ${image.height}`
    : "1 / 1";
}

function Tile({
  image,
  index,
  more,
  now,
  onOpen,
}: {
  image: PhotoImage;
  index: number;
  /** Pictures hidden behind this tile, drawn as +N like every messenger. */
  more: number;
  now: Date;
  onOpen: (index: number) => void;
}) {
  const [failed, setFailed] = useState(false);
  // Past its signed deadline the address is never put on an `src`, so the
  // browser makes no request the host would refuse.
  const gone = failed || carrierExpired(image, now);
  return (
    <button
      type="button"
      className={styles.tile}
      data-ui="photo"
      aria-label={COPY.photoOpenAt(index + 1)}
      onClick={() => onOpen(index)}
    >
      {gone ? (
        <span className={styles.gone}>{COPY.photoGone}</span>
      ) : (
        <img
          className={styles.image}
          src={image.url}
          width={image.width || undefined}
          height={image.height || undefined}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
      {more > 0 ? (
        <span className={styles.more} aria-hidden="true">
          +{more}
        </span>
      ) : null}
    </button>
  );
}

function Lightbox({
  images,
  at,
  onMove,
  onClose,
}: {
  images: readonly PhotoImage[];
  at: number;
  onMove: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const current = images[at];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    // A click that lands on the dialog itself landed on its backdrop; one on
    // the picture or the bar has them as its target instead. Registered here
    // rather than as a JSX handler so the element keeps its native semantics.
    const onClick = (event: MouseEvent) => {
      if (event.target === element) onClose();
    };
    element.addEventListener("click", onClick);
    return () => element.removeEventListener("click", onClick);
  }, [onClose]);

  // Arrow keys walk the album; <dialog> already gives us Escape.
  useEffect(() => {
    if (images.length < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onMove((at + 1) % images.length);
      if (event.key === "ArrowLeft")
        onMove((at - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, images.length, onMove]);

  if (!current) return null;
  return (
    <dialog
      ref={dialog}
      className={styles.lightbox}
      data-ui="photo-lightbox"
      onClose={onClose}
    >
      <img
        className={styles.large}
        src={current.url}
        width={current.width || undefined}
        height={current.height || undefined}
        alt=""
        referrerPolicy="no-referrer"
      />
      <div className={styles.bar}>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className={styles.step}
              aria-label={COPY.photoPrev}
              onClick={() => onMove((at - 1 + images.length) % images.length)}
            >
              ‹
            </button>
            <span className={styles.counter}>
              {at + 1} / {images.length}
            </span>
            <button
              type="button"
              className={styles.step}
              aria-label={COPY.photoNext}
              onClick={() => onMove((at + 1) % images.length)}
            >
              ›
            </button>
          </>
        ) : null}
        <button type="button" className={styles.close} onClick={onClose}>
          {COPY.photoClose}
        </button>
      </div>
    </dialog>
  );
}

/**
 * The pictures on a message.
 *
 * `photo.images` carries every one the message had, so an album is drawn as a
 * grid and opens to the picture that was clicked. `url`/`width`/`height` repeat
 * the first image; only `images` is read here so there is one source of truth.
 *
 * Addresses are the client's own CDN, signed and short-lived, so an expired one
 * is ordinary and says so rather than leaving a broken image.
 */
export function Photo({ photo, now }: { photo: PhotoData; now: Date }) {
  const [at, setAt] = useState<number | null>(null);
  const images = photo.images.length
    ? photo.images
    : [{ url: photo.url, width: photo.width, height: photo.height }];
  const shown = images.slice(0, TILE_LIMIT);
  const hidden = images.length - shown.length;
  const close = useCallback(() => setAt(null), []);

  return (
    <>
      <div
        className={cx(styles.grid, shown.length > 1 && styles.album)}
        data-count={shown.length}
        style={
          shown.length === 1 && shown[0]
            ? // One picture keeps its own shape; a grid is square tiles.
              { aspectRatio: ratio(shown[0]) }
            : undefined
        }
      >
        {shown.map((image, index) => (
          <Tile
            key={image.url}
            image={image}
            index={index}
            more={index === shown.length - 1 ? hidden : 0}
            now={now}
            onOpen={setAt}
          />
        ))}
      </div>
      {at !== null ? (
        <Lightbox
          images={images.filter((image) => !carrierExpired(image, now))}
          at={at}
          onMove={setAt}
          onClose={close}
        />
      ) : null}
    </>
  );
}
