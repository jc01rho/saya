import type { ParamProblem } from "./params";

/**
 * Copy the digest sheet renders. `/digest` is extractive (DESIGN.md truth 15):
 * every word here says "picked", never "written", and nothing names a model.
 * The bridge's own `note` is shown verbatim next to these strings.
 */
export const DIGEST_COPY = {
  title: "발췌",
  close: "닫기",
  untitled: "대화",
  /** What this surface is, in the client's words: real messages, chosen as they are. */
  lead: "브리지가 이 방의 최근 창에서 실제 메시지를 그대로 골라낸 결과입니다.",
  span: "구간 길이",
  spanHint: "예: 30m, 2h, 1d",
  limit: "살펴볼 최근 메시지 수",
  limitHint: "1~1,000",
  highlights: "구간마다 고르는 메시지 수",
  highlightsHint: "1~20",
  submit: "다시 골라내기",
  loading: "골라내는 중",
  refreshing: "다시 골라내는 중",
  scope: (considered: number, span: string, slices: number) =>
    `최근 ${considered.toLocaleString("ko-KR")}개 메시지 · ${span} 간격 · 구간 ${slices.toLocaleString("ko-KR")}개`,
  count: (count: number) => `메시지 ${count.toLocaleString("ko-KR")}개`,
  speakers: "말한 사람",
  keywords: "자주 나온 말",
  none: "없음",
  /** Coverage is not emptiness: nothing here says the conversation does not exist. */
  empty: "이 기기에 저장된 최근 창에서 골라낼 메시지가 없습니다",
  /** Offered only for a row the conversation wall currently holds. */
  jump: "대화에서 보기",
  /** The contract has no older page to ask for, so the absence is stated, not worked around (G3). */
  unloaded: (shown: number) =>
    `지금 불러온 대화 창(최근 ${shown.toLocaleString("ko-KR")}개)에는 없는 메시지입니다`,
  /** A 400: the bridge understood the arguments and could not use them. */
  refused: "브리지가 이 조건을 받지 않았습니다",
  failed: "발췌를 불러오지 못했습니다",
} as const;

/** The sentence a refused field gets; the field's label comes first so the list reads on its own. */
export function problemCopy(problem: ParamProblem): string {
  switch (problem.field) {
    case "span":
      return problem.reason === "zero"
        ? `${DIGEST_COPY.span}는 0보다 커야 합니다`
        : `${DIGEST_COPY.span}는 30m, 2h, 1d처럼 숫자 뒤에 m, h, d 중 하나를 붙여 적으세요`;
    case "limit":
      return `${DIGEST_COPY.limit}는 1부터 1,000까지의 정수만 보낼 수 있습니다`;
    case "highlights":
      return `${DIGEST_COPY.highlights}는 1부터 20까지의 정수만 보낼 수 있습니다`;
  }
}
