import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { ClientStores } from "../../src/core/stores";
import {
  type ModelContextLike,
  modelContextOf,
  registerAgentTools,
} from "../../src/features/agent/registry";
import {
  type AgentTransport,
  agentSourceOf,
} from "../../src/features/agent/source";
import { AgentToolsState } from "../../src/features/agent/state";
import {
  type AgentSource,
  type AgentTool,
  createAgentTools,
  type MessageFacts,
  type RoomFacts,
  type WindowResult,
} from "../../src/features/agent/tools";

type Message = components["schemas"]["Message"];
type Room = components["schemas"]["Room"];

const roomFacts = (id: string, unread: number, at: string): RoomFacts => ({
  id,
  title: `가상 관측소 ${id}`,
  unread,
  lastActivityAt: at,
  kind: "group",
  readable: true,
});

const facts = (id: string, roomId: string, text: string): MessageFacts => ({
  id,
  roomId,
  sender: "가상참여자-1",
  text,
  kind: "text",
  sentAt: "2037-04-07T09:00:00.000Z",
  fromMe: false,
});

function fakeSource(options: {
  rooms?: readonly RoomFacts[];
  loaded?: readonly MessageFacts[];
  windows?: Record<string, WindowResult>;
}) {
  const asked: { roomId: string; limit: number }[] = [];
  const source: AgentSource = {
    rooms: () => options.rooms ?? [],
    loaded: () => options.loaded ?? [],
    window: async (roomId, limit) => {
      asked.push({ roomId, limit });
      return (
        options.windows?.[roomId] ?? { ok: false, code: "KEY_UNAVAILABLE" }
      );
    },
  };
  return { asked, tools: createAgentTools(source) };
}

const byName = (tools: readonly AgentTool[], name: string): AgentTool => {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`No tool ${name}`);
  return tool;
};

const run = (tool: AgentTool, input: unknown) =>
  tool.run(input, new AbortController().signal) as Promise<
    Record<string, unknown>
  >;

const ROWS = Array.from({ length: 10 }, (_, index) =>
  facts(String(2800 + index), "9001", `가상 ${index}번째 줄`),
);

describe("the tools an agent is offered", () => {
  test("are exactly four, and every one of them only reads", () => {
    const { tools } = fakeSource({});
    expect(tools.map((tool) => tool.name)).toEqual([
      "list_rooms",
      "get_room_messages",
      "search_messages",
      "unread_summary",
    ]);
  });

  test("refuse an input the schema does not describe, naming every problem at once", async () => {
    const { tools, asked } = fakeSource({});
    const messages = byName(tools, "get_room_messages");
    expect(await run(messages, {})).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ field: "roomId", reason: "required" }],
    });
    expect(
      await run(messages, { roomId: "9001", surprise: true }),
    ).toMatchObject({
      problems: [{ field: "surprise", reason: "unknown-member" }],
    });
    expect(await run(messages, { roomId: "9001", limit: "40" })).toMatchObject({
      problems: [{ field: "limit", reason: "wrong-type" }],
    });
    expect(await run(messages, "9001")).toMatchObject({
      problems: [{ field: ".", reason: "not-an-object" }],
    });
    expect(asked).toEqual([]);
  });

  test("hold their limits: over the ceiling is refused, never quietly clamped", async () => {
    const { tools, asked } = fakeSource({
      windows: { "9001": { ok: true, messages: ROWS } },
    });
    expect(
      await run(byName(tools, "get_room_messages"), {
        roomId: "9001",
        limit: 201,
      }),
    ).toMatchObject({ problems: [{ field: "limit", reason: "out-of-range" }] });
    expect(
      await run(byName(tools, "search_messages"), {
        query: "가상",
        limit: 101,
      }),
    ).toMatchObject({ problems: [{ field: "limit", reason: "out-of-range" }] });
    expect(
      await run(byName(tools, "unread_summary"), { perRoom: 21 }),
    ).toMatchObject({
      problems: [{ field: "perRoom", reason: "out-of-range" }],
    });
    expect(
      await run(byName(tools, "get_room_messages"), {
        roomId: "9001",
        limit: 200,
      }),
    ).toMatchObject({ ok: true });
    expect(asked).toEqual([{ roomId: "9001", limit: 200 }]);
  });

  test("ask for the window's default when no limit is given", async () => {
    const { tools, asked } = fakeSource({
      windows: { "9001": { ok: true, messages: ROWS } },
    });
    await run(byName(tools, "get_room_messages"), { roomId: "9001" });
    expect(asked).toEqual([{ roomId: "9001", limit: 40 }]);
  });

  test("before reads the page just older than a message, from the window held", async () => {
    const { tools } = fakeSource({
      windows: { "9001": { ok: true, messages: ROWS } },
    });
    const answer = await run(byName(tools, "get_room_messages"), {
      roomId: "9001",
      before: "2805",
      limit: 2,
    });
    expect(answer.ok).toBe(true);
    expect((answer.messages as MessageFacts[]).map((row) => row.id)).toEqual([
      "2803",
      "2804",
    ]);
  });

  test("a room the client cannot read answers its code, and nothing is invented", async () => {
    const { tools } = fakeSource({});
    expect(
      await run(byName(tools, "get_room_messages"), { roomId: "9001" }),
    ).toEqual({ ok: false, error: "KEY_UNAVAILABLE", roomId: "9001" });
  });

  test("search without a room reads only what this tab already holds", async () => {
    const { tools, asked } = fakeSource({ loaded: ROWS });
    const answer = await run(byName(tools, "search_messages"), {
      query: "7번째",
    });
    expect(asked).toEqual([]);
    expect(answer).toMatchObject({ ok: true, scope: "loaded-in-this-tab" });
    expect((answer.matches as MessageFacts[]).map((row) => row.id)).toEqual([
      "2807",
    ]);
  });

  test("search with a room reads that room's newest window, newest match first", async () => {
    const { tools, asked } = fakeSource({
      windows: { "9001": { ok: true, messages: ROWS } },
    });
    const answer = await run(byName(tools, "search_messages"), {
      query: "가상",
      roomId: "9001",
      limit: 3,
    });
    expect(asked).toEqual([{ roomId: "9001", limit: 1000 }]);
    expect((answer.matches as MessageFacts[]).map((row) => row.id)).toEqual([
      "2809",
      "2808",
      "2807",
    ]);
  });

  test("the unread summary covers unread rooms only, quoting rows and stating refusals", async () => {
    const { tools, asked } = fakeSource({
      rooms: [
        roomFacts("9001", 3, "2037-04-07T09:00:00.000Z"),
        roomFacts("9002", 0, "2037-04-07T10:00:00.000Z"),
        roomFacts("9003", 7, "2037-04-06T09:00:00.000Z"),
      ],
      windows: { "9001": { ok: true, messages: ROWS.slice(-2) } },
    });
    const answer = await run(byName(tools, "unread_summary"), { perRoom: 2 });
    expect(asked).toEqual([
      { roomId: "9001", limit: 2 },
      { roomId: "9003", limit: 2 },
    ]);
    const rooms = answer.rooms as Record<string, unknown>[];
    expect(rooms.map((room) => room.id)).toEqual(["9001", "9003"]);
    const quoted = rooms[0]?.messages as MessageFacts[] | undefined;
    expect(quoted).toHaveLength(2);
    expect(rooms[1]?.error).toBe("KEY_UNAVAILABLE");
  });
});

describe("what the tools are allowed to ask the bridge", () => {
  const roomRow = (id: string): Room => ({
    id,
    title: "가상 관측소",
    kind: "group",
    type: "MultiChat",
    memberCount: 3,
    unread: 2,
    lastMessageId: null,
    lastActivityAt: "2037-04-07T09:00:00.000Z",
    readable: true,
  });
  const messageRow = (id: string, roomId: string): Message => ({
    id,
    roomId,
    senderId: "38000000000000001",
    sender: "가상참여자-1",
    text: "가상 줄",
    kind: "text",
    sentAt: "2037-04-07T09:00:00.000Z",
    fromMe: false,
  });

  function fakeHttp(answer: (roomId: string) => unknown) {
    const seen: JsonQuery[] = [];
    type JsonQuery = { key: string | undefined; query: URLSearchParams };
    const http: AgentTransport = {
      request: async (request) => {
        seen.push({
          key: request.generationKey,
          query: request.query ?? new URLSearchParams(),
        });
        return answer(request.query?.get("roomId") ?? "") as never;
      },
    };
    return { http, seen };
  }

  test("never opens a room: no open parameter, and its own generation key", async () => {
    const stores = new ClientStores();
    const { http, seen } = fakeHttp((roomId) => ({
      kind: "success",
      data: {
        ok: true,
        room: roomRow(roomId),
        messages: [messageRow("2802", roomId), messageRow("2801", roomId)],
        lastMessageFromMe: null,
        attention: { mentionsMe: [], repliesToMe: [], mentionsEveryone: [] },
        coverage: {
          localOnly: true,
          reachesLatestKnown: true,
          catalogLatestMessageId: null,
          newestReadMessageId: null,
          hasEarlier: false,
          storedLocally: 2,
        },
      },
    }));
    const source = agentSourceOf(stores, http);
    const answer = await source.window(
      "9001",
      40,
      new AbortController().signal,
    );
    expect(seen).toHaveLength(1);
    expect(seen[0]?.query.get("open")).toBeNull();
    expect(seen[0]?.query.get("limit")).toBe("40");
    expect(seen[0]?.key).toBe("agent:context:9001");
    expect(seen[0]?.key).not.toBe("context:9001");
    expect(answer.ok).toBe(true);
    if (answer.ok)
      expect(answer.messages.map((row) => row.id)).toEqual(["2801", "2802"]);
  });

  test("a refusal keeps its code, another room's rows are never shown, no answer is said", async () => {
    const stores = new ClientStores();
    const refused = agentSourceOf(
      stores,
      fakeHttp(() => ({
        kind: "failure",
        status: 503,
        error: { code: "KEY_UNAVAILABLE", message: "" },
      })).http,
    );
    expect(
      await refused.window("9001", 40, new AbortController().signal),
    ).toEqual({ ok: false, code: "KEY_UNAVAILABLE" });

    const crossed = agentSourceOf(
      stores,
      fakeHttp(() => ({
        kind: "success",
        data: {
          ok: true,
          room: roomRow("9001"),
          messages: [messageRow("2802", "9999")],
          lastMessageFromMe: null,
          attention: { mentionsMe: [], repliesToMe: [], mentionsEveryone: [] },
          coverage: {
            localOnly: true,
            reachesLatestKnown: true,
            catalogLatestMessageId: null,
            newestReadMessageId: null,
            hasEarlier: false,
            storedLocally: 1,
          },
        },
      })).http,
    );
    expect(
      await crossed.window("9001", 40, new AbortController().signal),
    ).toEqual({ ok: false, code: "ANOTHER_ROOM" });

    const silent = agentSourceOf(stores, {
      request: () => Promise.reject(new Error("no answer")),
    });
    expect(
      await silent.window("9001", 40, new AbortController().signal),
    ).toEqual({ ok: false, code: "NO_ANSWER" });
  });

  test("the catalog and the loaded rows come from this tab's own stores", () => {
    const stores = new ClientStores();
    stores.setCatalog([roomRow("9001")]);
    stores.setThread("9001", [messageRow("2801", "9001")]);
    const source = agentSourceOf(
      stores,
      fakeHttp(() => ({ kind: "discarded" })).http,
    );
    expect(source.rooms().map((room) => room.id)).toEqual(["9001"]);
    expect(source.loaded().map((row) => row.id)).toEqual(["2801"]);
  });
});

describe("registration against the browser's model context", () => {
  function fakeContext() {
    const registered: {
      tool: {
        name: string;
        annotations: Record<string, boolean>;
        execute: (
          input: unknown,
          options?: { signal?: AbortSignal },
        ) => unknown;
      };
      options: { signal?: AbortSignal } | undefined;
    }[] = [];
    const context: ModelContextLike = {
      registerTool: (tool, options) => {
        registered.push({ tool, options });
      },
    };
    return { context, registered };
  }

  test("a browser without the API is simply not used", () => {
    expect(modelContextOf(undefined)).toBeNull();
    expect(modelContextOf({})).toBeNull();
    expect(modelContextOf({ modelContext: {} })).toBeNull();
    expect(modelContextOf({ modelContext: { registerTool: 7 } })).toBeNull();
    expect(
      modelContextOf({ modelContext: { registerTool: () => {} } }),
    ).not.toBeNull();
  });

  test("every tool is registered read-only, and its output is marked untrusted", async () => {
    const { context, registered } = fakeContext();
    const { tools } = fakeSource({ loaded: ROWS });
    await registerAgentTools(context, tools, () => () => {});
    expect(registered).toHaveLength(4);
    for (const entry of registered) {
      expect(entry.tool.annotations.readOnlyHint).toBe(true);
      expect(entry.tool.annotations.untrustedContentHint).toBe(true);
      expect(entry.tool.annotations.consequentialHint).toBe(false);
    }
  });

  test("a call is announced before it runs and settled after it, and the answer is a JSON string", async () => {
    const { context, registered } = fakeContext();
    const { tools } = fakeSource({ loaded: ROWS });
    const seen: string[] = [];
    const release = await registerAgentTools(context, tools, (name) => {
      seen.push(`start:${name}`);
      return (ok) => seen.push(`done:${name}:${ok}`);
    });
    const search = registered.find(
      (entry) => entry.tool.name === "search_messages",
    );
    const answer = await search?.tool.execute({ query: "가상" });
    expect(typeof answer).toBe("string");
    expect(JSON.parse(String(answer)).ok).toBe(true);
    expect(seen).toEqual([
      "start:search_messages",
      "done:search_messages:true",
    ]);

    await search?.tool.execute({ query: "" });
    expect(seen.at(-1)).toBe("done:search_messages:false");

    expect(search?.options?.signal?.aborted).toBe(false);
    release();
    expect(search?.options?.signal?.aborted).toBe(true);
  });
});

describe("the experiment is off until this tab is told otherwise", () => {
  function fakeStorage(initial: Record<string, string> = {}): Storage {
    const map = new Map(Object.entries(initial));
    return {
      get length() {
        return map.size;
      },
      clear: () => map.clear(),
      getItem: (key: string) => map.get(key) ?? null,
      key: (index: number) => [...map.keys()][index] ?? null,
      removeItem: (key: string) => {
        map.delete(key);
      },
      setItem: (key: string, value: string) => {
        map.set(key, value);
      },
    };
  }

  test("a stored yes means nothing where the browser offers no tools", () => {
    const storage = fakeStorage({ "saya.agent-tools": "on" });
    const state = new AgentToolsState(storage, false);
    expect(state.getSnapshot()).toMatchObject({
      supported: false,
      enabled: false,
    });
    state.setSupported(true);
    expect(state.getSnapshot().enabled).toBe(true);
  });

  test("nothing is remembered until consent, and withdrawing it is remembered too", () => {
    const storage = fakeStorage();
    const state = new AgentToolsState(storage, true);
    expect(state.getSnapshot().enabled).toBe(false);
    state.setEnabled(true);
    expect(storage.getItem("saya.agent-tools")).toBe("on");
    expect(state.getSnapshot().enabled).toBe(true);
    state.setEnabled(false);
    expect(storage.getItem("saya.agent-tools")).toBe("off");
    expect(state.getSnapshot().enabled).toBe(false);
  });

  test("a refused storage is not a crash", () => {
    const state = new AgentToolsState(null, true);
    state.setEnabled(true);
    expect(state.getSnapshot().enabled).toBe(true);
  });

  test("the log keeps the ten newest calls and what became of them", () => {
    const state = new AgentToolsState(null, true);
    for (let index = 0; index < 12; index++)
      state.begin(`tool-${index}`)(index % 2 === 0);
    const calls = state.getSnapshot().calls;
    expect(calls).toHaveLength(10);
    expect(calls[0]?.name).toBe("tool-11");
    expect(calls[0]?.ok).toBe(false);
    expect(state.getSnapshot().running).toBeNull();
  });
});
