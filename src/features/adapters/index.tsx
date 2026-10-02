import { useEffect, useState } from "react";
import {
  type AdapterIndexOutcome,
  type AdapterOutcome,
  type Capabilities,
  fetchCapabilities,
  iconUrl,
  listAdapters,
} from "../../transport/adapters";
import { adapterMark } from "../../ui";
import { ProviderMark } from "../../ui/ProviderMark";
import styles from "./Adapters.module.css";
import { problemSentence } from "./copy";
import { KakaoCard, type KakaoStatus } from "./kakao";

export type { KakaoStatus } from "./kakao";
export { AdapterRoomBody, useAdapterRoom } from "./thread";

const COPY = {
  checkingIndex: "연결된 어댑터를 확인하는 중입니다.",
  unconfigured:
    "설정된 메신저 어댑터가 없습니다. 프록시에 어댑터를 설정하면 여기에 나타납니다.",
  indexUnreachable:
    "프록시에 닿지 않습니다. 개발 서버나 프록시가 실행 중인지 확인하세요.",
  checking: "확인 중",
  connected: "연결됨",
  refused: "거절됨",
  unauthorized: "인증 필요",
  unreachable: "닿지 않음",
  protocol: "응답 이상",
  incompatible: "버전 다름",
  refusedBody: (code: string) =>
    `어댑터가 오류를 돌려주었습니다. 상태 코드: ${code}`,
  unauthorizedBody:
    "프록시가 보내는 이 어댑터의 토큰이 어댑터의 토큰과 다릅니다.",
  unreachableBody:
    "어댑터가 응답하지 않습니다. 어댑터가 실행 중인지, 프록시가 어댑터 주소에 닿는지 확인하세요.",
  protocolBody:
    "응답이 어댑터 계약과 다릅니다. 프록시 대상과 어댑터의 계약 버전을 확인하세요.",
  retry: "다시 확인",
  account: {
    user: "내 계정으로 연결",
    bot: "봇 계정 — 봇이 들어간 대화만 볼 수 있습니다",
    official: "공식 계정으로 연결",
  } as Record<string, string>,
  accountOther: (kind: string) => `계정 종류: ${kind}`,
  meta: (capabilities: Capabilities) =>
    `${capabilities.adapter.name} ${capabilities.adapter.version} · 계약 ${capabilities.contract.version}`,
  features: "제공하는 기능",
  noFeatures: "아직 이 어댑터가 제공하는 기능이 없습니다.",
} as const;

/** The shared vocabulary in the adapter contract; ids a client does not know are ignored. */
const FEATURE_LABELS: Record<string, string> = {
  "rooms.list": "대화 목록",
  "messages.read": "메시지 읽기",
  "messages.stream": "실시간 수신",
  "messages.send": "메시지 보내기",
  "messages.reply": "답장",
  "messages.edit": "메시지 수정",
  "messages.delete": "메시지 삭제",
  "reactions.read": "반응 보기",
  "reactions.send": "반응 남기기",
  "read.mark": "읽음 처리",
  "typing.send": "입력 중 표시",
  "threads.read": "스레드 읽기",
  "attachments.read": "첨부 받기",
  "avatars.read": "프로필 사진",
  "attachments.send": "첨부 보내기",
};

type CardState = { kind: "checking" } | AdapterOutcome;

function statusLabel(state: CardState): string {
  switch (state.kind) {
    case "checking":
      return COPY.checking;
    case "connected":
      return COPY.connected;
    case "refused":
      return state.code === "UNAUTHORIZED" ? COPY.unauthorized : COPY.refused;
    case "unreachable":
      return COPY.unreachable;
    case "protocol":
      return COPY.protocol;
    case "incompatible":
      return COPY.incompatible;
  }
}

function problem(state: CardState): string | null {
  switch (state.kind) {
    case "refused":
      return state.code === "UNAUTHORIZED"
        ? COPY.unauthorizedBody
        : COPY.refusedBody(state.code);
    case "unreachable":
      return COPY.unreachableBody;
    case "protocol":
      return COPY.protocolBody;
    case "incompatible":
      return problemSentence(state);
    default:
      return null;
  }
}

function Declared({ capabilities }: { capabilities: Capabilities }) {
  const known = Object.keys(capabilities.features).flatMap((id) => {
    const label = FEATURE_LABELS[id];
    return label ? [{ id, label }] : [];
  });
  return (
    <>
      <p className={styles.line}>
        {COPY.account[capabilities.account.kind] ??
          COPY.accountOther(capabilities.account.kind)}
      </p>
      <p className={styles.meta}>{COPY.meta(capabilities)}</p>
      <h3 className={styles.subheading}>{COPY.features}</h3>
      {known.length ? (
        <ul className={styles.features}>
          {known.map(({ id, label }) => (
            <li key={id}>{label}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.line}>{COPY.noFeatures}</p>
      )}
    </>
  );
}

/** One adapter, asked once per mount; 다시 확인 remounts it. */
function AdapterCheck({ id, onRetry }: { id: string; onRetry: () => void }) {
  const [state, setState] = useState<CardState>({ kind: "checking" });
  useEffect(() => {
    const controller = new AbortController();
    fetchCapabilities(id, controller.signal).then(setState, () => {
      // Only an abort rejects, and an unmounted card has nothing to show.
    });
    return () => controller.abort();
  }, [id]);

  const name =
    state.kind === "connected" ? state.capabilities.provider.name : id;
  const trouble = problem(state);
  return (
    <article
      className={styles.card}
      data-ui="adapter-card"
      data-state={state.kind}
    >
      <header className={styles.cardHead}>
        <ProviderMark
          className={styles.mark}
          src={
            state.kind === "connected"
              ? iconUrl(id, state.capabilities.provider.icon)
              : undefined
          }
          mark={adapterMark(name)}
        />
        <h2 className={styles.name}>{name}</h2>
        <span
          className={styles.status}
          data-tone={state.kind === "connected" ? "ok" : state.kind}
          role="status"
        >
          {state.kind === "checking" ? (
            <span data-ui="theme-loader" aria-hidden="true" />
          ) : null}
          {statusLabel(state)}
        </span>
      </header>
      {state.kind === "connected" ? (
        <Declared capabilities={state.capabilities} />
      ) : null}
      {trouble ? (
        <>
          <p className={styles.line}>{trouble}</p>
          <button type="button" className={styles.retry} onClick={onRetry}>
            {COPY.retry}
          </button>
        </>
      ) : null}
    </article>
  );
}

function AdapterCard({ id }: { id: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <AdapterCheck
      key={attempt}
      id={id}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

/**
 * 연결: the KakaoTalk core first, always, then every adapter the proxy fronts,
 * each drawn from what it declares; never from its name. Rooms are in the
 * list tabs, not here.
 */
export function AdaptersPane({
  kakao,
  onKakaoRetry,
}: {
  kakao: KakaoStatus;
  onKakaoRetry: () => void;
}) {
  const [index, setIndex] = useState<AdapterIndexOutcome | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    listAdapters(controller.signal).then(setIndex, () => {
      // Only an abort rejects.
    });
    return () => controller.abort();
  }, []);

  return (
    <div className={styles.pane} data-ui="adapters-pane">
      <div className={styles.column}>
        <KakaoCard status={kakao} onRetry={onKakaoRetry} />
        {index === null ? (
          <p className={styles.line} aria-live="polite">
            <span data-ui="theme-loader" aria-hidden="true" />
            {COPY.checkingIndex}
          </p>
        ) : index.kind === "unconfigured" ? (
          <p className={styles.line}>{COPY.unconfigured}</p>
        ) : index.kind === "unreachable" ? (
          <p className={styles.line}>{COPY.indexUnreachable}</p>
        ) : index.ids.length === 0 ? (
          <p className={styles.line}>{COPY.unconfigured}</p>
        ) : (
          index.ids.map((id) => <AdapterCard key={id} id={id} />)
        )}
      </div>
    </div>
  );
}
