import type { Period } from "./stats";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const DAY = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" });

export const RECAP_COPY = {
  open: "결산",
  unavailable: "결산 화면을 불러오지 못했습니다. 다시 눌러 시도하세요.",
  title: "결산",
  close: "닫기",
  untitled: "대화",
  periodLabel: "기간",
  period: { year: "올해", "30d": "최근 30일" } satisfies Record<Period, string>,
  loading: "메시지를 불러오는 중",
  failed: "결산에 쓸 메시지를 불러오지 못했습니다",
  retry: "다시 시도",
  empty: "이 기간에 불러온 메시지가 없습니다",
  messages: "메시지",
  speakers: "참여",
  photos: "사진",
  count: (count: number) => count.toLocaleString("ko-KR"),
  people: (count: number) => `${count.toLocaleString("ko-KR")}명`,
  first: "첫 대화",
  last: "마지막 대화",
  date: (date: Date) => DAY.format(date),
  range: (from: Date, to: Date) => `${DAY.format(from)} ~ ${DAY.format(to)}`,
  coverage: (loaded: number, from: Date) =>
    `불러온 메시지 ${loaded.toLocaleString("ko-KR")}개, ${DAY.format(from)}부터`,
  beyond: (count: number) =>
    `이 방에는 ${count.toLocaleString("ko-KR")}개가 더 있지만, 코어가 주는 최근 1,000개까지만 셌습니다`,
  words: "자주 쓴 말",
  emoji: "자주 쓴 이모지",
  senders: "누가 많이 말했나",
  heatmap: "언제 많이 말했나",
  heatmapCell: (day: number, hour: number, count: number) =>
    `${DAYS[day]}요일 ${hour}시 ${count}개`,
  busiest: (day: number, hour: number) =>
    `${DAYS[day]}요일 ${hour}시가 가장 붐볐습니다`,
  none: "없음",
  save: "이미지로 저장",
  saving: "그리는 중",
  saveFailed: "이미지를 만들지 못했습니다",
  saveHint: "이 기기에 내려받을 뿐, 어디에도 보내지 않습니다",
  days: DAYS,
  me: "나",
  footer: "saya · 이 기기에서 센 결과",
} as const;
