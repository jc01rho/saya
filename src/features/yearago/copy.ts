const DAY = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" });

export const YEAR_AGO_COPY = {
  label: "작년 오늘",
  title: (day: Date) => `${DAY.format(day)} 이 방에서`,
  count: (count: number) => `메시지 ${count}개`,
  collapse: "접기",
  expand: "펼치기",
  close: "닫기",
  pictures: "그날의 사진",
  pictureGone: "만료",
} as const;
