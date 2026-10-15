import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import {
  HISTORY_LIMIT,
  HISTORY_TTL_MS,
  HistorySource,
  type HistoryTransport,
  RETAINED_HISTORIES,
} from "../../src/features/history/source";
import type { HttpOutcome, JsonRequest } from "../../src/transport/http";
import { roomFor } from "../digest/synthetic";

type Context = components["schemas"]["Context"];

type Pending = {
  request: JsonRequest<"/context">;
  resolve: (outcome: HttpOutcome<Context>) => void;
  reject: (reason: unknown) => void;
};

function harness(start = 1_000_000) {
  let clock = start;
  const pending: Pending[] = [];
  const transport: HistoryTransport = {
    request: (request) =>
      new Promise<HttpOutcome<Context>>((resolve, reject) => {
        pending.push({ request, resolve, reject });
      }),
  };
  const source = new HistorySource(transport, () => clock);
  const tick = (ms: number) => {
    clock += ms;
  };
  return { pending, source, tick };
}

function contextOf(roomId: string): HttpOutcome<Context> {
  return {
    kind: "success",
    data: {
      ok: true,
      room: roomFor(roomId, "가상 관측소"),
      messages: [],
      lastMessageFromMe: null,
      attention: { mentionsMe: [], repliesToMe: [], mentionsEveryone: [] },
      coverage: {
        localOnly: true,
        reachesLatestKnown: true,
        catalogLatestMessageId: null,
        newestReadMessageId: null,
        hasEarlier: false,
        storedLocally: 0,
      },
    },
  };
}

const refused: HttpOutcome<Context> = {
  kind: "failure",
  status: 503,
  error: { ok: false, error: { code: "BUSY", message: "" } },
} as unknown as HttpOutcome<Context>;

describe("the shared newest window", () => {
  test("asks for the widest window under its own key, not the wall's", () => {
    const { pending, source } = harness();
    void source.read("1");
    const request = pending[0]?.request;
    expect(request?.path).toBe("/context");
    const query = Object.fromEntries(request?.query?.entries() ?? []);
    expect(query.roomId).toBe("1");
    expect(Number(query.limit)).toBe(HISTORY_LIMIT);
    expect(Number(query.limit)).toBeLessThanOrEqual(1000);
    expect(request?.generationKey).toBeDefined();
    expect(request?.generationKey).not.toBe("context:1");
  });

  test("readers of one room share one request, and the answer is kept for a while", async () => {
    const { pending, source, tick } = harness();
    const first = source.read("1");
    const second = source.read("1");
    expect(pending).toHaveLength(1);
    pending[0]?.resolve(contextOf("1"));
    expect(await first).toBe(await second);
    tick(HISTORY_TTL_MS - 1);
    expect(await source.read("1")).toBe(await first);
    expect(pending).toHaveLength(1);
    tick(1);
    void source.read("1");
    expect(pending).toHaveLength(2);
  });

  test("a refused or failed answer is not kept: the next read asks again", async () => {
    const { pending, source } = harness();
    const first = source.read("1");
    pending[0]?.resolve(refused);
    expect((await first).kind).toBe("failure");
    void source.read("1");
    expect(pending).toHaveLength(2);
    const second = pending[1];
    const failing = source.read("1");
    expect(pending).toHaveLength(2);
    second?.reject(new Error("network"));
    await expect(failing).rejects.toThrow("network");
    void source.read("1");
    expect(pending).toHaveLength(3);
  });

  test("only the most recent rooms are kept", async () => {
    const { pending, source } = harness();
    const rooms = Array.from({ length: RETAINED_HISTORIES + 1 }, (_, i) =>
      String(i + 1),
    );
    const answers = rooms.map((roomId) => source.read(roomId));
    for (const [index, item] of pending.entries())
      item.resolve(contextOf(rooms[index] ?? ""));
    await Promise.all(answers);
    expect(pending).toHaveLength(rooms.length);
    // The first room fell out when the last one came in; asking again evicts the next oldest.
    void source.read(rooms[0] ?? "");
    expect(pending).toHaveLength(rooms.length + 1);
    void source.read(rooms[2] ?? "");
    expect(pending).toHaveLength(rooms.length + 1);
    void source.read(rooms[1] ?? "");
    expect(pending).toHaveLength(rooms.length + 2);
  });
});
