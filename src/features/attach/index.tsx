import { lazy, useRef } from "react";
import { formatSize } from "../attachments/pages";
import styles from "./Attach.module.css";

export const ATTACH_COPY = {
  pick: "파일 첨부",
  send: "파일 보내기",
  sending: "보내는 중",
  cancel: "빼기",
  tooLarge: (max: number) =>
    `파일이 너무 큽니다. ${formatSize(max)}까지 보낼 수 있습니다.`,
  empty: "빈 파일은 보낼 수 없습니다.",
} as const;

/** The browser's own file picker, behind a button in the composer's row. */
export function AttachButton({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.clip}
        data-ui="attach"
        aria-label={ATTACH_COPY.pick}
        title={ATTACH_COPY.pick}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 11.5 12.2 19.3a5 5 0 0 1-7.1-7.1l8.3-8.3a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.6 1.6 0 0 1-2.3-2.3l7.6-7.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <input
        ref={input}
        type="file"
        hidden
        tabIndex={-1}
        data-ui="attach-input"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) onPick(file);
        }}
      />
    </>
  );
}

/** The picked-file row, loaded when a file is first picked: its styles stay out of the first paint. */
export const StagedFile = lazy(() =>
  import("./Staged").then((module) => ({ default: module.StagedFile })),
);
