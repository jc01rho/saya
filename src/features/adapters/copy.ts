import type { AdapterProblem } from "../../transport/adapters";

/** One sentence per way an adapter request can fail; codes, never messages, drive it. */
export function problemSentence(problem: AdapterProblem): string {
  switch (problem.kind) {
    case "refused":
      switch (problem.code) {
        case "UNAUTHORIZED":
          return "프록시가 보내는 이 어댑터의 토큰이 어댑터의 토큰과 다릅니다.";
        case "RATE_LIMITED":
          return "메신저가 잠시 쉬어 가라고 했습니다. 조금 뒤에 다시 시도하세요.";
        case "NOT_FOUND":
          return "이 계정에서 그 방을 찾을 수 없습니다.";
        case "NOT_SUPPORTED":
          return "이 어댑터는 그 기능을 제공하지 않습니다.";
        default:
          return `어댑터가 오류를 돌려주었습니다. 상태 코드: ${problem.code}`;
      }
    case "unreachable":
      return "어댑터가 응답하지 않습니다. 어댑터가 실행 중인지, 프록시가 어댑터 주소에 닿는지 확인하세요.";
    case "protocol":
      return "응답이 어댑터 계약과 다릅니다. 프록시 대상과 어댑터의 계약 버전을 확인하세요.";
  }
}
