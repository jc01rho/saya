import { useCallback, useEffect, useRef, useState } from "react";
import {
  type HttpFailure,
  type HttpOutcome,
  HttpProtocolError,
} from "../../transport/http";
import { COPY } from "../../ui";
import { connectionStateFor } from "../connection";
import { THREAD_COPY } from "../thread/copy";

/**
 * The reads added in openapi.json 0.15.0 — `/notice`, `/attachments`,
 * `/revisions`, `/file` — are answered by both cores since contract 0.16.0
 * (kanao-cli and kamado-cli 0.22.0). They share one request shape and one
 * account of failure, kept here.
 */
export type ReadFailure =
  /** The bridge answered with an error envelope. Only its code is ever shown. */
  | { kind: "bridge"; outcome: HttpFailure }
  /** No answer reached us. */
  | { kind: "network" }
  /** An answer arrived that is not the contract's. */
  | { kind: "protocol" };

export type ReadState<T> =
  | { phase: "loading" }
  | { phase: "ready"; data: T }
  | { phase: "failed"; failure: ReadFailure };

export const READ_COPY = {
  failed: "불러오지 못했습니다",
  messageNotFound: "이 기기에서 이 메시지를 읽을 수 없습니다",
  fileExpired:
    "파일 주소가 만료되었고, 데스크톱 앱이 저장해 둔 사본도 찾지 못했습니다",
  olderCore:
    "공지, 모아보기, 수정 기록, 파일 받기는 kanao·kamado 0.22.0 이상의 코어가 제공합니다",
} as const;

export function failureOf(error: unknown): ReadFailure {
  return { kind: error instanceof HttpProtocolError ? "protocol" : "network" };
}

/**
 * A route this build does not know answers 404 with a code that is not about
 * the room or the message. That is a core older than 0.22.0, not a missing room.
 */
export function isUnsupported(failure: ReadFailure): boolean {
  if (failure.kind !== "bridge") return false;
  const { status, error } = failure.outcome;
  return (
    status === 404 &&
    error.code !== "CHAT_NOT_FOUND" &&
    error.code !== "MESSAGE_NOT_FOUND"
  );
}

/** Words for a refused read. Codes are branched on with a default; messages are never UI input. */
export function readFailureCopy(failure: ReadFailure): {
  title: string;
  code: string | null;
  hint: string | null;
} {
  if (failure.kind === "network")
    return { title: THREAD_COPY.network, code: null, hint: null };
  if (failure.kind === "protocol")
    return { title: THREAD_COPY.protocol, code: null, hint: null };
  const code = failure.outcome.error.code;
  switch (code) {
    case "MESSAGE_NOT_FOUND":
      return { title: READ_COPY.messageNotFound, code, hint: null };
    case "FILE_EXPIRED":
      return { title: READ_COPY.fileExpired, code, hint: null };
  }
  const state = connectionStateFor(failure.outcome);
  switch (state.kind) {
    case "unauthorized":
      return { title: THREAD_COPY.unauthorized, code, hint: null };
    case "host-not-ready":
      return state.code === "KEY_UNAVAILABLE"
        ? { title: COPY.unreadable, code, hint: THREAD_COPY.unreadableHint }
        : { title: THREAD_COPY.hostNotReady, code, hint: null };
    case "permission-required":
      return { title: THREAD_COPY.permission, code, hint: null };
    default:
      return {
        title: READ_COPY.failed,
        code,
        hint: isUnsupported(failure) ? READ_COPY.olderCore : null,
      };
  }
}

/**
 * One read keyed by `key`: a new key aborts the old request and its answer
 * never lands (latest request wins); `retry` asks again for the same key. A
 * null key reads nothing.
 */
export function useRead<T>(
  key: string | null,
  run: (signal: AbortSignal) => Promise<HttpOutcome<T>>,
): [ReadState<T>, () => void] {
  const [state, setState] = useState<ReadState<T>>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  // The latest closure, read when the effect fires; the key alone decides when.
  const runner = useRef(run);
  runner.current = run;

  const request = key === null ? null : `${attempt}:${key}`;
  useEffect(() => {
    if (request === null) return;
    const controller = new AbortController();
    setState({ phase: "loading" });
    runner.current(controller.signal).then(
      (outcome) => {
        if (controller.signal.aborted || outcome.kind === "discarded") return;
        setState(
          outcome.kind === "failure"
            ? { phase: "failed", failure: { kind: "bridge", outcome } }
            : { phase: "ready", data: outcome.data },
        );
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ phase: "failed", failure: failureOf(error) });
      },
    );
    return () => controller.abort();
  }, [request]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return [state, retry];
}
