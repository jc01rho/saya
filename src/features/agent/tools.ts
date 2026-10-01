import { compareDecimalIds } from "../../core/ids";
import { type Input, type ToolSchema, validateInput } from "./schema";

export type RoomFacts = {
  id: string;
  title: string;
  unread: number;
  lastActivityAt: string | null;
  kind: string;
  readable: boolean;
};
export type MessageFacts = {
  id: string;
  roomId: string;
  sender: string;
  text: string;
  kind: string;
  sentAt: string | null;
  fromMe: boolean;
};
export type WindowResult =
  | { ok: true; messages: readonly MessageFacts[] }
  | { ok: false; code: string };

/**
 * What the tools are allowed to read, and nothing else. `window` asks the
 * bridge for a room's newest N — never with `open`, which the contract says
 * marks the room read in the desktop client. There is no member here that
 * sends, marks or deletes anything, so no tool can grow one.
 */
export interface AgentSource {
  rooms(): readonly RoomFacts[];
  /** Rows this tab already holds, newest last. Nothing is fetched for them. */
  loaded(): readonly MessageFacts[];
  window(
    roomId: string,
    limit: number,
    signal: AbortSignal,
  ): Promise<WindowResult>;
}

export const CEILING = {
  rooms: 200,
  messages: 200,
  search: 100,
  query: 200,
  roomId: 64,
  unreadRooms: 10,
  perRoom: 20,
  /** The newest window the contract offers; a `before` page is cut out of it. */
  window: 1000,
} as const;

export type ToolAnswer = Readonly<Record<string, unknown>>;

export type AgentTool = {
  name: string;
  description: string;
  inputSchema: ToolSchema;
  run(input: unknown, signal: AbortSignal): Promise<ToolAnswer>;
};

const schema = (
  properties: ToolSchema["properties"],
  required: readonly string[] = [],
): ToolSchema => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const roomIdProperty = {
  type: "string",
  description: "The room id as listed by list_rooms.",
  maxLength: CEILING.roomId,
} as const;

const newestFirst = (rows: readonly MessageFacts[]) =>
  [...rows].sort((a, b) => -compareDecimalIds(a.id, b.id));

const sortRooms = (rooms: readonly RoomFacts[]) =>
  [...rooms].sort((a, b) =>
    (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""),
  );

function gate(
  tool: Omit<AgentTool, "run">,
  run: (input: Input, signal: AbortSignal) => Promise<ToolAnswer>,
): AgentTool {
  return {
    ...tool,
    run: async (input, signal) => {
      const checked = validateInput(tool.inputSchema, input);
      if (!checked.ok)
        return {
          ok: false,
          error: "invalid-input",
          problems: checked.problems,
        };
      return run(checked.value, signal);
    },
  };
}

const text = (value: Input, field: string): string | undefined => {
  const given = value[field];
  return typeof given === "string" ? given : undefined;
};
const count = (value: Input, field: string, fallback: number): number => {
  const given = value[field];
  return typeof given === "number" ? given : fallback;
};

/**
 * The four read-only tools this client offers an agent in the tab. They answer
 * from the same bridge the screen reads and never ask for anything the screen
 * could not already show.
 */
export function createAgentTools(source: AgentSource): readonly AgentTool[] {
  const list = gate(
    {
      name: "list_rooms",
      description:
        "List the conversations in this client's catalog: title, unread count and when each was last active. Read-only.",
      inputSchema: schema({
        limit: {
          type: "integer",
          description: "How many rooms to return, most recently active first.",
          minimum: 1,
          maximum: CEILING.rooms,
          default: 50,
        },
      }),
    },
    async (input) => {
      const limit = count(input, "limit", 50);
      const rooms = sortRooms(source.rooms());
      return {
        ok: true,
        total: rooms.length,
        rooms: rooms.slice(0, limit).map((room) => ({
          id: room.id,
          title: room.title,
          unread: room.unread,
          lastActivityAt: room.lastActivityAt,
          kind: room.kind,
          readable: room.readable,
        })),
      };
    },
  );

  const messages = gate(
    {
      name: "get_room_messages",
      description:
        "Read the newest messages of one room, oldest first. With before, read the page just older than that message id. Read-only: it never opens the room, so a room the client has not loaded answers an error instead of being marked read.",
      inputSchema: schema(
        {
          roomId: roomIdProperty,
          limit: {
            type: "integer",
            description: "How many messages to return.",
            minimum: 1,
            maximum: CEILING.messages,
            default: 40,
          },
          before: {
            type: "string",
            description:
              "Return the messages older than this message id, from the newest window the client holds.",
            maxLength: CEILING.roomId,
          },
        },
        ["roomId"],
      ),
    },
    async (input, signal) => {
      const roomId = text(input, "roomId") ?? "";
      const limit = count(input, "limit", 40);
      const before = text(input, "before");
      const answer = await source.window(
        roomId,
        before ? CEILING.window : limit,
        signal,
      );
      if (!answer.ok) return { ok: false, error: answer.code, roomId };
      const rows = before
        ? answer.messages.filter((row) => compareDecimalIds(row.id, before) < 0)
        : answer.messages;
      const page = rows.slice(-limit);
      return {
        ok: true,
        roomId,
        messages: page,
        /** True when this answer begins where the client's own window does, so older rows may exist unread by anyone. */
        reachedWindowStart: page.length >= rows.length,
      };
    },
  );

  const search = gate(
    {
      name: "search_messages",
      description:
        "Find messages whose text contains a phrase. With roomId it reads that room's newest window; without one it searches only the conversations already loaded in this tab. Read-only.",
      inputSchema: schema(
        {
          query: {
            type: "string",
            description: "The phrase to look for.",
            maxLength: CEILING.query,
          },
          roomId: roomIdProperty,
          limit: {
            type: "integer",
            description: "How many matches to return, newest first.",
            minimum: 1,
            maximum: CEILING.search,
            default: 20,
          },
        },
        ["query"],
      ),
    },
    async (input, signal) => {
      const query = (text(input, "query") ?? "").toLowerCase();
      const roomId = text(input, "roomId");
      const limit = count(input, "limit", 20);
      let rows: readonly MessageFacts[];
      if (roomId !== undefined) {
        const answer = await source.window(roomId, CEILING.window, signal);
        if (!answer.ok) return { ok: false, error: answer.code, roomId };
        rows = answer.messages;
      } else rows = source.loaded();
      const matches = newestFirst(rows)
        .filter((row) => row.text.toLowerCase().includes(query))
        .slice(0, limit);
      return {
        ok: true,
        scope: roomId === undefined ? "loaded-in-this-tab" : "room",
        searched: rows.length,
        matches,
      };
    },
  );

  const unread = gate(
    {
      name: "unread_summary",
      description:
        "For each conversation with unread messages, the most recent messages verbatim. It summarises nothing; the words are the client's own. Read-only, and it never marks anything read.",
      inputSchema: schema({
        rooms: {
          type: "integer",
          description: "How many unread conversations to cover.",
          minimum: 1,
          maximum: CEILING.unreadRooms,
          default: 5,
        },
        perRoom: {
          type: "integer",
          description: "How many of the newest messages to quote per room.",
          minimum: 1,
          maximum: CEILING.perRoom,
          default: 5,
        },
      }),
    },
    async (input, signal) => {
      const limit = count(input, "rooms", 5);
      const perRoom = count(input, "perRoom", 5);
      const unreadRooms = sortRooms(source.rooms())
        .filter((room) => room.unread > 0)
        .slice(0, limit);
      const rooms = [];
      for (const room of unreadRooms) {
        const answer = await source.window(room.id, perRoom, signal);
        rooms.push({
          id: room.id,
          title: room.title,
          unread: room.unread,
          ...(answer.ok
            ? { messages: answer.messages }
            : { error: answer.code }),
        });
      }
      return { ok: true, rooms };
    },
  );

  return [list, messages, search, unread];
}
