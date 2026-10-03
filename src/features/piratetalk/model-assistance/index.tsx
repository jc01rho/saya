import { useEffect, useId, useRef, useState } from "react";
import type { components } from "../../../contract/piratetalk/decoded";
import type { ExtensionResult } from "../../../transport/piratetalk";
import styles from "./ModelAssistance.module.css";

type Schemas = components["schemas"];
export type SummaryRequest = Schemas["SummaryRequest"];
export type SummaryResponse = Schemas["SummaryResponse"];
export type QuestionRequest = Schemas["QuestionRequest"];
export type QuestionResponse = Schemas["QuestionResponse"];
export type ModelResult<T> = ExtensionResult<T>;

export interface ModelAssistanceProps {
  readonly roomId: string;
  readonly models: readonly string[];
  readonly summaryAvailable: boolean;
  readonly questionAvailable: boolean;
  readonly summarize: (
    request: SummaryRequest,
    signal: AbortSignal,
  ) => Promise<ModelResult<SummaryResponse>>;
  readonly ask: (
    request: QuestionRequest,
    signal: AbortSignal,
  ) => Promise<ModelResult<QuestionResponse>>;
  readonly onCitation: (roomId: string, messageId: string) => void;
}

function localDate(seconds: number): string {
  const date = new Date(seconds * 1000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 19);
}

export function selectedPeriod(
  from: string,
  to: string,
  all: boolean,
): { from: number; to: number } | null {
  const start = all ? 0 : new Date(from).getTime() / 1000;
  const end = new Date(to).getTime() / 1000;
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    start >= 0 &&
    end >= start
    ? { from: start, to: end }
    : null;
}

export function ModelAssistance(props: ModelAssistanceProps) {
  if (
    (!props.summaryAvailable && !props.questionAvailable) ||
    props.models.length === 0
  )
    return null;
  return <RoomModelAssistance key={props.roomId} {...props} />;
}

function RoomModelAssistance({
  roomId,
  models,
  summaryAvailable,
  questionAvailable,
  summarize,
  ask,
  onCitation,
}: ModelAssistanceProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() =>
    localDate(Math.floor(Date.now() / 1000) - 86400),
  );
  const [to, setTo] = useState(() => localDate(Math.floor(Date.now() / 1000)));
  const [all, setAll] = useState(false);
  const [model, setModel] = useState(models[0] ?? "");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Schemas["Error"] | null>(null);
  const [result, setResult] = useState<
    SummaryResponse | QuestionResponse | null
  >(null);
  const active = useRef<AbortController | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => () => active.current?.abort(), []);

  function cancel() {
    active.current?.abort();
    active.current = null;
    setBusy(false);
  }

  async function submit(kind: "summary" | "question") {
    const period = selectedPeriod(from, to, all);
    if (
      !period ||
      !models.includes(model) ||
      (kind === "question" && !question.trim())
    ) {
      setError({
        code: "invalid_request",
        detail: "기간, 모델, 질문을 확인해 주세요.",
      });
      return;
    }
    cancel();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const scope = { roomId, ...period, model };
      const response =
        kind === "summary"
          ? await summarize(scope, controller.signal)
          : await ask(
              { ...scope, question: question.trim() },
              controller.signal,
            );
      if (controller.signal.aborted || active.current !== controller) return;
      if (response.kind === "cancelled") return;
      if (response.kind === "failure") setError(response.error);
      else if (
        response.data.roomId !== roomId ||
        response.data.from !== period.from ||
        response.data.to !== period.to
      ) {
        setError({
          code: "malformed_response",
          detail: "요청한 방과 기간에 맞지 않는 응답입니다.",
        });
      } else setResult(response.data);
    } catch (cause) {
      if (controller.signal.aborted || active.current !== controller) return;
      setError({
        code: "unreachable",
        detail:
          cause instanceof Error
            ? "모델 응답을 받지 못했습니다."
            : "요청을 완료하지 못했습니다.",
      });
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <section className={styles.root} data-ui="piratetalk-model">
      <button
        ref={toggle}
        type="button"
        className={styles.quiet}
        data-ui="piratetalk-model-open"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (open) cancel();
          setOpen(!open);
        }}
      >
        모델 요약 · 질문
      </button>
      {open && (
        <fieldset
          id={id}
          style={{ border: 0, margin: 0, minWidth: 0 }}
          aria-label="모델 요약 및 질문"
          className={styles.panel}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancel();
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          <h2>모델 요약 · 질문</h2>
          <p className={styles.note}>
            발췌와 별개로 모델이 작성합니다. 선택한 기간의 보관 기록 전체를
            처리하며, 보관되지 않은 대화는 포함되지 않습니다.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit(questionAvailable ? "question" : "summary");
            }}
          >
            <fieldset disabled={busy} className={styles.fields}>
              <legend>분석할 기간과 모델</legend>
              <label>
                <input
                  type="checkbox"
                  checked={all}
                  onChange={(event) => setAll(event.target.checked)}
                  data-ui="piratetalk-model-all"
                />
                처음부터
              </label>
              <label>
                시작 (현지 시간)
                <input
                  type="datetime-local"
                  step="1"
                  value={from}
                  disabled={all}
                  onChange={(event) => setFrom(event.target.value)}
                  data-ui="piratetalk-model-from"
                />
              </label>
              <label>
                종료 (현지 시간)
                <input
                  type="datetime-local"
                  step="1"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  data-ui="piratetalk-model-to"
                />
              </label>
              <label>
                모델
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  data-ui="piratetalk-model-select"
                >
                  {models.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              {questionAvailable && (
                <label>
                  이 기간의 대화에 질문
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    data-ui="piratetalk-model-question"
                  />
                </label>
              )}
              <div className={styles.actions}>
                {summaryAvailable && (
                  <button
                    type="button"
                    className={styles.quiet}
                    onClick={() => void submit("summary")}
                    data-ui="piratetalk-model-summary"
                  >
                    전체 기간 요약
                  </button>
                )}
                {questionAvailable && (
                  <button
                    type="submit"
                    className={styles.quiet}
                    disabled={!question.trim()}
                    data-ui="piratetalk-model-ask"
                  >
                    질문하기
                  </button>
                )}
              </div>
            </fieldset>
          </form>
          {busy && (
            <p role="status">
              전체 기간 처리 중{" "}
              <button
                type="button"
                className={styles.quiet}
                onClick={cancel}
                data-ui="piratetalk-model-cancel"
              >
                취소
              </button>
            </p>
          )}
          {error && (
            <p
              role="alert"
              data-ui="piratetalk-model-error"
              data-code={error.code}
            >
              {error.detail}
            </p>
          )}
          {result && (
            <article data-ui="piratetalk-model-result" aria-live="polite">
              <p className={styles.note}>
                {result.model} ·{" "}
                {"summary" in result
                  ? `${result.messageCount}개 기록 · ${result.chunkCount}개 구간`
                  : `${result.windowCount}개 기록 · ${result.matchCount}개 일치`}
              </p>
              <p className={styles.note}>
                자료: {result.coverage.source} ·{" "}
                {result.coverage.complete
                  ? "선택 범위 처리 완료"
                  : "보관 자료 범위만 포함"}
                {result.coverage.stale ? " · 이전 자료" : ""}
              </p>
              <div className={styles.answer}>
                {"summary" in result ? result.summary : result.answer}
              </div>
              {"citations" in result && (
                <ul className={styles.citations}>
                  {result.citations.map((citation) => (
                    <li key={citation.messageId}>
                      <button
                        type="button"
                        className={styles.citation}
                        onClick={() => onCitation(roomId, citation.messageId)}
                        data-ui="piratetalk-model-citation"
                        data-message-id={citation.messageId}
                      >
                        {citation.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )}
        </fieldset>
      )}
    </section>
  );
}
