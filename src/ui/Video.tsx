import { useCallback, useEffect, useRef, useState } from "react";
import type { components } from "../contract/decoded";
import { COPY } from "./copy";
import { carrierExpired, isExpired } from "./expiry";
import styles from "./Video.module.css";

type VideoData = components["schemas"]["Video"];

/** mm:ss, and h:mm:ss once there is an hour to show. */
function clock(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const whole = Math.floor(seconds);
  const s = String(whole % 60).padStart(2, "0");
  const m = Math.floor(whole / 60) % 60;
  const h = Math.floor(whole / 3600);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * A video on a message.
 *
 * **The contract carries no thumbnail** — it says so, and says a viewer that
 * wants a first frame should ask the video for it. So the tile is the video
 * element itself with `preload="metadata"`, seeking to `#t=0.1` so a frame is
 * painted rather than a black box. This is a browser hint, not a byte limit;
 * lazy tiles attach the address only after entering the viewport.
 *
 * An address whose deadline has passed is **never put on an `src`**: the
 * element is not rendered at all, so no request is made for something the host
 * would refuse.
 */
export function Video({
  video,
  now,
  loading = "eager",
}: {
  video: VideoData;
  now: Date;
  loading?: "eager" | "lazy";
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const frameElement = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useCallback(() => setOpen(false), []);
  // Both sources: the deadline signed into the address and any stated one.
  const expired =
    carrierExpired(video, now) || isExpired(video.url, now, video.expiresAt);

  useEffect(() => {
    const element = frameElement.current;
    if (loading !== "lazy" || !element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    if (!element.open) element.showModal();
    const onClick = (event: MouseEvent) => {
      if (event.target === element) close();
    };
    element.addEventListener("click", onClick);
    return () => element.removeEventListener("click", onClick);
  }, [open, close]);

  if (expired || failed)
    return (
      <p className={styles.gone} data-ui="video-expired">
        {COPY.videoGone}
      </p>
    );

  // The fragment asks for a frame just past the start; it is never sent to the
  // host, so a signed address keeps its signature.
  const frame = `${video.url}#t=0.1`;
  const length = clock(video.duration);
  return (
    <>
      <button
        type="button"
        ref={frameElement}
        className={styles.frame}
        data-ui="video"
        aria-label={COPY.videoOpen}
        onClick={() => setOpen(true)}
        style={
          video.width > 0 && video.height > 0
            ? { aspectRatio: `${video.width} / ${video.height}` }
            : { aspectRatio: "16 / 9" }
        }
      >
        <video
          className={styles.poster}
          src={loading === "eager" || visible ? frame : undefined}
          preload="metadata"
          muted
          playsInline
          onError={() => setFailed(true)}
        />
        <span className={styles.play} aria-hidden="true">
          ▶
        </span>
        {length ? (
          <span className={styles.length} aria-hidden="true">
            {length}
          </span>
        ) : null}
      </button>
      {open ? (
        <dialog
          ref={dialog}
          className={styles.lightbox}
          data-ui="video-lightbox"
          onClose={close}
        >
          {/* biome-ignore lint/a11y/useMediaCaption: same as above; there is no track on the wire. */}
          <video
            className={styles.player}
            src={video.url}
            controls
            autoPlay
            playsInline
          />
          <button type="button" className={styles.close} onClick={close}>
            {COPY.photoClose}
          </button>
        </dialog>
      ) : null}
    </>
  );
}
