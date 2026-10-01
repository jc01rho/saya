/** Copy the room list renders. Row-level strings (미리보기 없음, 읽을 수 없음) live in src/ui/copy.ts. */
export const ROOMS_COPY = {
  /** The visible product label; the app heading on the index view. */
  brandMark: "さや",
  brandLatin: "(saya)",
  nav: "대화 목록",
  /** r4: the list's own heading, the h1 of the index view. */
  heading: "대화",
  /** The way to the connections view where there is no rail (below 768px). */
  adapters: "연결",
  search: "대화방 이름 검색",
  searchPlaceholder: "대화방 검색",
  filter: "목록 필터",
  all: "전체",
  unread: "안읽음",
  /** The rooms whose kind is "direct": the contract has no contacts route. */
  people: "사람",
  group: "그룹",
  loading: "목록을 불러오는 중",
  emptyAll: "표시할 방이 없습니다",
  emptyPeople: "표시할 1:1 대화가 없습니다",
  emptyUnread: "데스크톱 기준으로 안 읽은 대화가 없습니다",
  emptyGroup: "표시할 그룹 대화가 없습니다",
  /** Only titles already loaded are searched; there is no search route. */
  emptySearch: "불러온 대화방 이름 중에 맞는 것이 없습니다",
} as const;
