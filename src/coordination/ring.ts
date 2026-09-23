import type { SseRecord } from "../transport/sse";
import type { RingRecord } from "./protocol";
export class ReplayRing {
  private items: { record: RingRecord; bytes: number }[] = [];
  private retained = 0;
  private floor = 0;
  get count() {
    return this.items.length;
  }
  get bytes() {
    return this.retained;
  }
  get startSeq() {
    return this.floor;
  }
  reset(head: number) {
    this.items = [];
    this.retained = 0;
    this.floor = head;
  }
  append(seq: number, event: SseRecord): RingRecord {
    const encoder = new TextEncoder();
    const size = encoder.encode(JSON.stringify({ seq, event })).byteLength;
    const record: RingRecord = {
      seq,
      event:
        size > 64 * 1024 - 513 && event.type === "message"
          ? {
              type: "oversize-gap",
              roomId: event.data.message.roomId,
              messageId: event.data.message.id,
              bytes: size,
            }
          : event,
    };
    const bytes = encoder.encode(JSON.stringify(record)).byteLength;
    // Non-message envelopes cannot be silently truncated into valid checkpoints.
    if (bytes > 64 * 1024 - 513)
      throw new Error("Fan-out envelope exceeds credit");
    this.items.push({ record, bytes });
    this.retained += bytes;
    while (this.items.length > 2048 || this.retained > 2 * 1024 * 1024) {
      const first = this.items[0] as { record: RingRecord; bytes: number };
      this.items.shift();
      this.retained -= first.bytes;
      this.floor = first.record.seq;
    }
    return record;
  }
  after(
    seq: number,
    limit = 64 * 1024,
  ): { records: RingRecord[]; gap: boolean } {
    const records: RingRecord[] = [];
    // Reserve the bounded reply envelope as well as the JSON array delimiters.
    let bytes = 512;
    for (const item of this.items) {
      if (item.record.seq <= seq) continue;
      if (records.length === 64 || bytes + item.bytes + 1 > limit) break;
      records.push(item.record);
      bytes += item.bytes + 1;
    }
    return { records, gap: seq < this.floor };
  }
}
