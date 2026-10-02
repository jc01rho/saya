import { KAKAO_ICON, ProviderMark } from "../../ui/ProviderMark";
import styles from "./Adapters.module.css";

/** The KakaoTalk core as the app's catalog request found it. */
export type KakaoStatus =
  | { kind: "checking" }
  | { kind: "connected"; rooms: number }
  | { kind: "refused"; code: string }
  | { kind: "unreachable" }
  | { kind: "protocol" }
  | { kind: "over-capacity" };

const COPY = {
  name: "카카오톡",
  source: "데스크톱 카카오톡 · kanao / kamado serve",
  rooms: (count: number) => `방 ${count.toLocaleString("ko-KR")}개`,
  features: "제공하는 기능",
  retry: "다시 확인",
  status: {
    checking: "확인 중",
    connected: "연결됨",
    unauthorized: "인증 필요",
    notReady: "준비 안 됨",
    refused: "거절됨",
    unreachable: "닿지 않음",
    protocol: "응답 이상",
    capacity: "목록 초과",
  },
  unauthorized: "프록시가 보내는 코어 토큰이 코어의 토큰과 다릅니다.",
  permission:
    "macOS 시스템 설정의 개인정보 보호 및 보안에서 kamado에 필요한 손쉬운 사용 권한을 허용한 뒤 다시 확인하세요.",
  notReady: (code: string) =>
    `코어가 아직 대화를 읽을 수 없습니다. 상태 코드: ${code}`,
  refused: (code: string) => `코어가 오류를 돌려주었습니다. 상태 코드: ${code}`,
  unreachable:
    "코어가 응답하지 않습니다. 카카오톡이 있는 기계에서 kanao serve(또는 kamado serve)가 실행 중인지 확인하세요.",
  protocol:
    "코어 응답을 해석할 수 없습니다. 코어가 꺼져 있어도 프록시가 오류 페이지를 돌려주므로, kanao serve(또는 kamado serve)가 실행 중인지와 프록시 대상·코어 버전을 확인하세요.",
  capacity: "대화 목록이 이 클라이언트가 담을 수 있는 크기를 넘었습니다.",
} as const;

/** What the KakaoTalk contract gives this client; fixed, unlike an adapter's declaration. */
const FEATURES = [
  "대화 목록",
  "메시지 읽기",
  "실시간 수신",
  "메시지 보내기",
  "공지",
  "모아보기",
  "수정 기록",
  "파일 받기",
  "발췌",
];

const NOT_READY = new Set([
  "KAKAO_NOT_RUNNING",
  "KEY_UNAVAILABLE",
  "NO_USER_DATA",
  "BUSY",
]);

function label(status: KakaoStatus): string {
  switch (status.kind) {
    case "checking":
      return COPY.status.checking;
    case "connected":
      return COPY.status.connected;
    case "refused":
      if (status.code === "UNAUTHORIZED") return COPY.status.unauthorized;
      return NOT_READY.has(status.code) || status.code === "PERMISSION_REQUIRED"
        ? COPY.status.notReady
        : COPY.status.refused;
    case "unreachable":
      return COPY.status.unreachable;
    case "protocol":
      return COPY.status.protocol;
    case "over-capacity":
      return COPY.status.capacity;
  }
}

export function kakaoProblem(status: KakaoStatus): string | null {
  switch (status.kind) {
    case "refused":
      if (status.code === "UNAUTHORIZED") return COPY.unauthorized;
      if (status.code === "PERMISSION_REQUIRED") return COPY.permission;
      return NOT_READY.has(status.code)
        ? COPY.notReady(status.code)
        : COPY.refused(status.code);
    case "unreachable":
      return COPY.unreachable;
    case "protocol":
      return COPY.protocol;
    case "over-capacity":
      return COPY.capacity;
    default:
      return null;
  }
}

/** The KakaoTalk core's card: always first in 연결, because it needs no adapter setting. */
export function KakaoCard({
  status,
  onRetry,
}: {
  status: KakaoStatus;
  onRetry: () => void;
}) {
  const problem = kakaoProblem(status);
  return (
    <article
      className={styles.card}
      data-ui="kakao-card"
      data-state={status.kind}
    >
      <header className={styles.cardHead}>
        <ProviderMark className={styles.mark} src={KAKAO_ICON} mark="K" />
        <h2 className={styles.name}>{COPY.name}</h2>
        <span
          className={styles.status}
          data-tone={status.kind === "connected" ? "ok" : status.kind}
          role="status"
        >
          {status.kind === "checking" ? (
            <span data-ui="theme-loader" aria-hidden="true" />
          ) : null}
          {label(status)}
        </span>
      </header>
      <p className={styles.line}>{COPY.source}</p>
      {status.kind === "connected" ? (
        <>
          <p className={styles.meta}>{COPY.rooms(status.rooms)}</p>
          <h3 className={styles.subheading}>{COPY.features}</h3>
          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </>
      ) : null}
      {problem ? (
        <>
          <p className={styles.line}>{problem}</p>
          <button type="button" className={styles.retry} onClick={onRetry}>
            {COPY.retry}
          </button>
        </>
      ) : null}
    </article>
  );
}
