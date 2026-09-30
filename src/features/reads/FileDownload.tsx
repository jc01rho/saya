import { useEffect, useRef, useState } from "react";
import type { FileOutcome } from "../../transport/http";
import { failureOf, type ReadFailure, readFailureCopy } from "./index";
import styles from "./reads.module.css";

export interface FileTransport {
  file(request: {
    roomId: string;
    messageId: string;
    signal: AbortSignal;
  }): Promise<FileOutcome>;
}

const FILE_COPY = {
  get: "파일 받기",
  getting: "받는 중",
  again: "다시 받기",
  /** The browser was handed the bytes; where it put them is the browser's business. */
  saved: "내려받기를 시작했습니다",
  local: "데스크톱 앱이 저장한 사본",
  remote: "원래 주소에서 받음",
} as const;

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "saved"; source: "local" | "remote" | null }
  | { kind: "failed"; failure: ReadFailure };

function save(blob: Blob, name: string): string {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  anchor.click();
  return url;
}

/**
 * One file message's 받기. Nothing is fetched until it is pressed, and an
 * expired address is the core's `410 FILE_EXPIRED`, said in words, never a
 * broken download. A failure is retried only by pressing again.
 */
export function FileDownload({
  http,
  roomId,
  messageId,
  name,
}: {
  http: FileTransport;
  roomId: string;
  messageId: string;
  /** The name the message carried, used when the header names none. */
  name?: string | undefined;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const controller = useRef<AbortController | null>(null);
  const saved = useRef<string | null>(null);
  const release = () => {
    if (saved.current) URL.revokeObjectURL(saved.current);
    saved.current = null;
  };

  useEffect(
    () => () => {
      controller.current?.abort();
      if (saved.current) URL.revokeObjectURL(saved.current);
    },
    [],
  );

  const start = () => {
    controller.current?.abort();
    release();
    const current = new AbortController();
    controller.current = current;
    setPhase({ kind: "loading" });
    http.file({ roomId, messageId, signal: current.signal }).then(
      (outcome) => {
        if (current.signal.aborted || outcome.kind === "discarded") return;
        if (outcome.kind === "failure") {
          setPhase({ kind: "failed", failure: { kind: "bridge", outcome } });
          return;
        }
        saved.current = save(outcome.blob, outcome.name ?? name ?? "file");
        setPhase({ kind: "saved", source: outcome.source });
      },
      (error: unknown) => {
        if (current.signal.aborted) return;
        setPhase({ kind: "failed", failure: failureOf(error) });
      },
    );
  };

  const failure =
    phase.kind === "failed" ? readFailureCopy(phase.failure) : null;
  return (
    <span
      className={styles.file}
      data-ui="file-download"
      data-phase={phase.kind}
    >
      <button
        type="button"
        className={styles.action}
        aria-disabled={phase.kind === "loading" || undefined}
        onClick={phase.kind === "loading" ? undefined : start}
      >
        {phase.kind === "loading"
          ? FILE_COPY.getting
          : phase.kind === "idle"
            ? FILE_COPY.get
            : FILE_COPY.again}
      </button>
      <span className={styles.status} role="status">
        {phase.kind === "saved"
          ? `${FILE_COPY.saved}${
              phase.source ? ` · ${FILE_COPY[phase.source]}` : ""
            }`
          : failure
            ? `${failure.title}${failure.code ? ` (${failure.code})` : ""}${
                failure.hint ? `. ${failure.hint}` : ""
              }`
            : null}
      </span>
    </span>
  );
}
