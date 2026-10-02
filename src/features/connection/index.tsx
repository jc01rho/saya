import type { HttpOutcome } from "../../transport/http";

export type HostNotReadyCode =
  | "KAKAO_NOT_RUNNING"
  | "KEY_UNAVAILABLE"
  | "NO_USER_DATA"
  | "BUSY";

export type ConnectionState =
  | { kind: "healthy" }
  | { kind: "unauthorized" }
  | { kind: "host-not-ready"; code: HostNotReadyCode }
  | { kind: "permission-required" }
  | { kind: "default"; code: string }
  | { kind: "discarded" };

/** Maps only machine-readable error codes; error messages are never UI input. */
export function connectionStateFor(
  outcome: HttpOutcome<unknown>,
): ConnectionState {
  if (outcome.kind === "success") return { kind: "healthy" };
  if (outcome.kind === "discarded") return { kind: "discarded" };

  switch (outcome.error.code) {
    case "UNAUTHORIZED":
      return { kind: "unauthorized" };
    case "KAKAO_NOT_RUNNING":
    case "KEY_UNAVAILABLE":
    case "NO_USER_DATA":
    case "BUSY":
      return { kind: "host-not-ready", code: outcome.error.code };
    case "PERMISSION_REQUIRED":
      return { kind: "permission-required" };
    default:
      return { kind: "default", code: outcome.error.code };
  }
}

export function ConnectionScreen({
  state,
  onRetry,
}: {
  state: ConnectionState;
  onRetry?: () => void;
}) {
  if (state.kind === "healthy")
    return (
      <section aria-labelledby="connection-heading">
        <h1 id="connection-heading">연결됨</h1>
        <p>브리지에 연결되었습니다.</p>
      </section>
    );

  if (state.kind === "unauthorized")
    return (
      <section aria-labelledby="connection-heading">
        <h1 id="connection-heading">프록시 인증 설정이 필요합니다</h1>
        <p>프록시의 토큰 설정이 올바르지 않습니다.</p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            다시 확인
          </button>
        ) : null}
      </section>
    );

  if (state.kind === "host-not-ready")
    return (
      <section aria-labelledby="connection-heading">
        <h1 id="connection-heading">호스트를 아직 사용할 수 없습니다</h1>
        <p>
          상태 코드: <code>{state.code}</code>
        </p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            다시 확인
          </button>
        ) : null}
      </section>
    );

  if (state.kind === "permission-required")
    return (
      <section aria-labelledby="connection-heading">
        <h1 id="connection-heading">macOS 권한이 필요합니다</h1>
        <p>
          macOS 시스템 설정의 개인정보 보호 및 보안에서 kamado에 필요한 손쉬운
          사용 권한을 허용한 뒤 다시 여세요.
        </p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            다시 확인
          </button>
        ) : null}
      </section>
    );

  if (state.kind === "default")
    return (
      <section aria-labelledby="connection-heading">
        <h1 id="connection-heading">알 수 없는 브리지 상태</h1>
        <p>
          상태 코드: <code>{state.code}</code>
        </p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            다시 확인
          </button>
        ) : null}
      </section>
    );

  return (
    <section aria-live="polite">
      <p>
        <span data-ui="theme-loader" aria-hidden="true" />
        연결 상태를 확인하는 중입니다.
      </p>
    </section>
  );
}
