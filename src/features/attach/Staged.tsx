import { type ReactNode, useEffect, useState } from "react";
import { formatSize } from "../attachments/pages";
import { ATTACH_COPY } from ".";
import styles from "./Staged.module.css";

/** Raster types the browser draws, read as a data address the page's CSP allows. */
const PREVIEWED = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);
const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;

/** A picked picture's own pixels, for the row; nothing for any other file. */
function usePreview(file: File): string | null {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    setPreview(null);
    if (!PREVIEWED.has(file.type) || file.size > PREVIEW_MAX_BYTES) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  return preview;
}

/**
 * A picked file waiting for its own send: what it is, how large, why it
 * cannot go when it cannot, and the two ways out. Nothing leaves before the
 * person presses this row's send.
 */
export function StagedFile({
  file,
  maxBytes,
  busy,
  blocked,
  onSend,
  onCancel,
  children,
}: {
  file: File;
  maxBytes: number;
  busy: boolean;
  /** Another reason it cannot go yet, already said in `children`. */
  blocked?: boolean;
  onSend: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const preview = usePreview(file);
  const tooLarge = file.size > maxBytes;
  const empty = file.size === 0;
  return (
    <div className={styles.staged} data-ui="attach-staged">
      {preview ? (
        <img className={styles.thumb} src={preview} alt="" />
      ) : (
        <span className={styles.icon}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <div className={styles.about}>
        <span className={styles.name} data-ui="attach-name">
          {file.name}
        </span>
        <span className={styles.size}>{formatSize(file.size)}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.quiet}
          disabled={busy}
          onClick={onCancel}
          data-ui="attach-cancel"
        >
          {ATTACH_COPY.cancel}
        </button>
        <button
          type="button"
          className={styles.go}
          disabled={busy || tooLarge || empty || blocked}
          onClick={onSend}
          data-ui="attach-send"
        >
          {busy ? ATTACH_COPY.sending : ATTACH_COPY.send}
        </button>
      </div>
      {tooLarge || empty || children ? (
        <p className={styles.note} role="status" data-ui="attach-note">
          {tooLarge
            ? ATTACH_COPY.tooLarge(maxBytes)
            : empty
              ? ATTACH_COPY.empty
              : children}
        </p>
      ) : null}
    </div>
  );
}
