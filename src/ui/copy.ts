/**
 * Product copy the primitives render, verbatim from DESIGN.md. Generated
 * concept text is never copied; these strings are the only ones that ship.
 */
export const COPY = {
  me: "나",
  unreadable: "읽을 수 없음 (키 없음)",
  unknownTime: "시간 미상",
  quoteMissing: "인용 정보 없음",
  mentionUnknown: "이름 미상",
  mentionAll: "전체",
  emptyBody: "본문 없음",
  sent: "보냈습니다",
  pending: "입력됨 · 전달 미확인",
  unknown: "결과 확인 필요",
  rejected: "보내는 중인 메시지가 많습니다",
  send: "보내기",
  coverageLocal: "이 기기에 저장된 범위만 표시합니다",
  coverageEarlier: "더 이전 기록이 이 기기에 있습니다",
  coverageBehind: "최신 기록이 아직 반영되지 않았을 수 있습니다",
  ceiling:
    "여기서 볼 수 있는 가장 오래된 메시지입니다. 더 이전 기록은 데스크톱 앱에서 확인하세요",
  gap: "연결이 끊긴 동안의 일부 대화는 아래에 없을 수 있습니다",
  cat: "고양이",
  catWalking: "연결 중인 고양이",
  photoOpenAt: (position: number) => `${position}번째 사진 크게 보기`,
  photoGone: "사진을 불러올 수 없습니다",
  photoPrev: "이전 사진",
  photoNext: "다음 사진",
  photoClose: "닫기",
} as const;

/** The desktop's count belongs in the row's accessible name, exact even past 99. */
export function unreadName(count: number): string {
  return `데스크톱 기준 안 읽음 ${count}개`;
}

/** Kind labels for bodies that carry no text (G8): a word, never a thumbnail or link. */
const KIND_LABELS: Record<string, string> = {
  photo: "사진",
  video: "동영상",
  file: "파일",
  feed: "안내",
};

export function kindLabel(kind: string): string | null {
  if (kind === "text" || kind === "reply") return null;
  return KIND_LABELS[kind] ?? kind;
}
