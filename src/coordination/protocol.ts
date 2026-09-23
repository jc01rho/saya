import type { SseRecord } from "../transport/sse";
export const STREAM_LOCK = "saya:core:/api:stream:v1";
export const REQUEST_CHANNEL = "saya:requests:v1";
export const VERSION = 1;
export type Gap = {
  type: "oversize-gap";
  roomId: string;
  messageId: string;
  bytes: number;
};
export type RingRecord = { seq: number; event: SseRecord | Gap };
export type Request = {
  kind: "register" | "pull";
  version: number;
  nonce: string;
  requestSeq: number;
  epoch: number;
  afterSeq: number;
  creditBytes: number;
};
export type Reply = {
  kind:
    | "registered"
    | "batch"
    | "hint"
    | "not-ready"
    | "resync-required"
    | "reload-required"
    | "terminal";
  epoch: number;
  generation: number;
  head: number;
  startSeq?: number;
  requestSeq?: number;
  records?: RingRecord[];
  outcome?: string | undefined;
};
export function requestFrom(value: unknown): Request | undefined {
  if (!value || typeof value !== "object") return;
  const item = value as Request;
  if (
    (item.kind !== "register" && item.kind !== "pull") ||
    typeof item.nonce !== "string" ||
    !/^[a-zA-Z0-9-]{1,80}$/.test(item.nonce) ||
    !Number.isSafeInteger(item.version) ||
    !Number.isSafeInteger(item.requestSeq) ||
    item.requestSeq < 1 ||
    !Number.isSafeInteger(item.epoch) ||
    !Number.isSafeInteger(item.afterSeq) ||
    !Number.isSafeInteger(item.creditBytes) ||
    item.creditBytes < 1 ||
    item.creditBytes > 65536
  )
    return;
  return item;
}
