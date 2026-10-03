import { useSyncExternalStore } from "react";
import styles from "../composer/Composer.module.css";
import type { PirateTalkSession } from "./session";

export { PirateTalkSession } from "./session";

export function PirateTalkStatus({ session }: { session: PirateTalkSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  if (state.kind === "unsupported") return null;
  const label = (() => {
    switch (state.kind) {
      case "checking":
        return "추가 기능 확인 중";
      case "available":
        return Object.values(state.capabilities.features).some(
          (feature) => feature.available,
        )
          ? "추가 기능 연결됨"
          : "현재 사용할 수 있는 추가 기능이 없습니다.";
      case "unauthorized":
        return "추가 기능 인증이 필요합니다.";
      case "incompatible":
        return "추가 기능 버전이 맞지 않습니다.";
      case "malformed":
        return "추가 기능 응답을 해석할 수 없습니다.";
      case "unreachable":
        return "추가 기능에 연결할 수 없습니다.";
    }
  })();
  return (
    <section
      className={styles.status}
      data-ui="piratetalk-status"
      data-state={state.kind}
      aria-live="polite"
    >
      <span>{label}</span>{" "}
      <button
        type="button"
        className={styles.quiet}
        data-ui="piratetalk-reconnect"
        onClick={session.reconnect}
      >
        다시 연결
      </button>
    </section>
  );
}
