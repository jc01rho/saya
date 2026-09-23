/** Copy the room list renders. Row-level strings (미리보기 없음, 읽을 수 없음) live in src/ui/copy.ts. */
export const ROOMS_COPY = {
  /** The visible product label; the app heading on the index view. */
  brandMark: "さや",
  brandLatin: "(saya)",
  nav: "대화 목록",
  filter: "목록 필터",
  all: "전체",
  /** The rooms whose kind is "direct": the contract has no contacts route. */
  people: "사람",
  loading: "목록을 불러오는 중",
  emptyAll: "표시할 방이 없습니다",
  emptyPeople: "표시할 1:1 대화가 없습니다",
} as const;
