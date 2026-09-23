import { expect, test } from "bun:test";
import { MemoryMetadata } from "../../src/coordination/metadata";
import type { ClockPort } from "../../src/coordination/platform";
import { RetryRequest } from "../../src/coordination/retry";
import { ReplayRing } from "../../src/coordination/ring";
import { generateData } from "../fixtures/data";

test("oversize parsed messages are explicit gaps and batches are bounded", () => {
  const ring = new ReplayRing();
  const data = generateData("baseline");
  const room = data.rooms[0];
  if (!room) throw new Error("Missing fixture room");
  const message = data.messages.get(room.id)?.[0];
  if (!message) throw new Error("Missing fixture message");
  ring.append(1, {
    type: "message",
    data: { ok: true, message: { ...message, text: "가".repeat(30000) } },
  });
  expect(ring.after(0).records[0]?.event.type).toBe("oversize-gap");
  for (let seq = 2; seq < 3000; seq++)
    ring.append(seq, { type: "ping", data: { ok: true } });
  expect(ring.count).toBeLessThanOrEqual(2048);
  expect(ring.bytes).toBeLessThanOrEqual(2 * 1024 * 1024);
  expect(ring.after(0).gap).toBe(true);
  expect(ring.after(2990).records.length).toBeLessThanOrEqual(64);
});

test("a boundary-sized record cannot wedge an empty pull forever", () => {
  const ring = new ReplayRing();
  const data = generateData("baseline");
  const room = data.rooms[0];
  if (!room) throw new Error("Missing fixture room");
  const message = data.messages.get(room.id)?.[0];
  if (!message) throw new Error("Missing fixture message");
  const event = {
    type: "message" as const,
    data: { ok: true as const, message: { ...message, text: "" } },
  };
  const overhead = new TextEncoder().encode(
    JSON.stringify({ seq: 1, event }),
  ).byteLength;
  event.data.message.text = "x".repeat(65535 - overhead);
  ring.append(1, event);
  const batch = ring.after(0);
  expect(batch.records).toHaveLength(1);
  expect(
    new TextEncoder().encode(JSON.stringify(batch.records)).byteLength,
  ).toBeLessThanOrEqual(65536);
});

test("epoch allocation is atomic and does not reset spent subscriber credit", async () => {
  const metadata = new MemoryMetadata();
  await metadata.update((state) => {
    state.subscribers.push({ nonce: "tab", credit: 0, lastRequestSeq: 4 });
  });
  await Promise.all(
    Array.from({ length: 5 }, () =>
      metadata.update((state) => {
        state.epoch++;
        state.generation++;
      }),
    ),
  );
  const state = await metadata.read();
  expect(state.epoch).toBe(5);
  expect(state.generation).toBe(5);
  expect(state.subscribers[0]?.credit).toBe(0);
});

test("metadata rejects content fields and subscriber overflow", async () => {
  const metadata = new MemoryMetadata();
  await expect(
    metadata.update((state) => {
      Object.assign(state, { token: "forbidden" });
    }),
  ).rejects.toThrow();
  await expect(
    metadata.update((state) => {
      for (let i = 0; i < 33; i++)
        state.subscribers.push({
          nonce: `t${i}`,
          credit: 1,
          lastRequestSeq: 0,
        });
    }),
  ).rejects.toThrow();
});

test("request retries are exactly 1/2/4 seconds and reuse the same request", () => {
  let callback: (() => void) | undefined;
  const delays: number[] = [];
  const clock: ClockPort = {
    setTimeout(fn, ms) {
      callback = fn;
      delays.push(ms);
      return ms;
    },
    clearTimeout() {
      callback = undefined;
    },
  };
  const sent: object[] = [];
  let exhausted = false;
  const request = { kind: "pull", requestSeq: 17 };
  const retry = new RetryRequest(
    clock,
    () => sent.push(request),
    () => {
      exhausted = true;
    },
  );
  retry.start();
  callback?.();
  callback?.();
  callback?.();
  expect(delays).toEqual([1000, 2000, 4000]);
  expect(sent).toEqual([request, request, request]);
  expect(exhausted).toBe(true);
});
