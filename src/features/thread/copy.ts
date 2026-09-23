/**
 * Copy the conversation reader renders. Row-level strings (시간 미상, 인용 정보
 * 없음, kind labels) and the coverage/ceiling lines live in src/ui/copy.ts.
 */
export const THREAD_COPY = {
  log: "대화 기록",
  loading: "이 기기에 저장된 대화를 불러오는 중",
  refreshing: "최신 창을 다시 불러오는 중",
  /** DESIGN.md: the cat, plus this sentence — never a claim that the conversation does not exist. */
  empty: "이 기기에 저장된 대화가 없습니다",
  /** Widens the newest window 40 → 200 → 1000 (G3); it never pages into older history. */
  widen: "더 불러오기",
  widening: "불러오는 중",
  retry: "다시 시도",
  /** Between two observed windows lies a stretch nobody read; it is marked, not glued shut. */
  discontinuity: "이 사이의 기록은 아직 불러오지 않았습니다",
  missingRow: "이 메시지는 표시 가능한 범위를 넘어 내려놓았습니다",
  failed: "대화를 불러오지 못했습니다",
  network: "브리지에 연결할 수 없습니다",
  protocol: "브리지 응답을 해석할 수 없습니다",
  unauthorized: "프록시 인증 설정이 필요합니다",
  hostNotReady: "호스트를 아직 사용할 수 없습니다",
  unreadableHint: "데스크톱 앱에서 이 방을 한 번 열면 읽을 수 있습니다",
  permission: "macOS 권한이 필요합니다",
} as const;
