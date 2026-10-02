/** Words the experiment uses. Nothing here claims a model, a summary or a send. */
export const AGENT_COPY = {
  open: "설정",
  title: "설정",
  close: "닫기",
  label: "에이전트 도구(실험)",
  hint: "이 탭에 연결된 AI 에이전트가 읽기 전용 도구 4개를 쓸 수 있습니다. 보내기·읽음 처리·삭제 도구는 없습니다.",
  unsupported: "이 브라우저는 아직 에이전트 도구를 제공하지 않습니다",
  warning: "이 탭의 AI 에이전트가 대화를 읽을 수 있습니다",
  warningBody:
    "켜면 이 탭에 붙은 에이전트가 방 목록과 대화 내용을 읽을 수 있습니다. 언제든 다시 끌 수 있고, 끄면 도구는 즉시 내려갑니다.",
  confirm: "확인하고 켜기",
  cancel: "취소",
  logTitle: "최근 호출 10개",
  logEmpty: "아직 호출된 적이 없습니다",
  reading: (what: string) => `에이전트가 ${what} 읽는 중`,
  failed: "실패",
  finished: "완료",
  /** What each tool reads, in the words the screen already uses. */
  what: {
    list_rooms: "대화 목록을",
    get_room_messages: "대화 내용을",
    search_messages: "검색 결과를",
    unread_summary: "안 읽은 대화를",
  } as Record<string, string>,
  unknownTool: "도구 결과를",
} as const;
