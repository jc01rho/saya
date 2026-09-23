import { COPY } from "../../ui";

const pad = (value: number) => String(value).padStart(2, "0");

function dayLabel(date: Date, now: Date): string {
  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return date.getFullYear() === now.getFullYear()
    ? monthDay
    : `${date.getFullYear()}년 ${monthDay}`;
}

const clock = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/**
 * A slice's span in local time: one day label when both ends share a day,
 * both otherwise. Garbage in either end reads 시간 미상, never Invalid Date (G9).
 */
export function formatRange(from: string, to: string, now: Date): string {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return COPY.unknownTime;
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  return sameDay
    ? `${dayLabel(start, now)} ${clock(start)}~${clock(end)}`
    : `${dayLabel(start, now)} ${clock(start)} ~ ${dayLabel(end, now)} ${clock(end)}`;
}
