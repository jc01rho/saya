import type { components } from "../../contract/decoded";
import { compareDecimalIds } from "../../core/ids";
import type { ClientStores } from "../../core/stores";
import type { HttpOutcome, JsonRequest } from "../../transport/http";
import type {
  AgentSource,
  MessageFacts,
  RoomFacts,
  WindowResult,
} from "./tools";

type Context = components["schemas"]["Context"];
type Message = components["schemas"]["Message"];

export interface AgentTransport {
  request(request: JsonRequest<"/context">): Promise<HttpOutcome<Context>>;
}

const CONTRACT_CEILING = 1000;

function factsOf(message: Message): MessageFacts {
  return {
    id: message.id,
    roomId: message.roomId,
    sender: message.sender,
    text: message.text,
    kind: message.kind,
    sentAt: message.sentAt,
    fromMe: message.fromMe,
  };
}

/**
 * What the tools read: this tab's own catalog and rows, and `/context` for a
 * room an agent names. The request carries roomId and limit and nothing else —
 * no `open`, because opening a room marks it read in the desktop client, and
 * a tool that reads must not change what the person sees when they come back.
 * Its generation key is its own, so an agent's request never discards the
 * answer the conversation on screen is waiting for.
 */
export function agentSourceOf(
  stores: ClientStores,
  http: AgentTransport,
): AgentSource {
  const rooms = (): readonly RoomFacts[] =>
    stores.getSnapshot("rooms.order").flatMap((id) => {
      const snapshot = stores.getSnapshot(`room.${id}`);
      if (!snapshot) return [];
      const room = snapshot.room;
      return [
        {
          id: room.id,
          title: room.title,
          unread: room.unread,
          lastActivityAt: room.lastActivityAt,
          kind: room.kind,
          readable: room.readable,
        },
      ];
    });

  const loaded = (): readonly MessageFacts[] =>
    stores.getSnapshot("rooms.order").flatMap((roomId) => {
      const thread = stores.getSnapshot(`thread.${roomId}`);
      return thread.order.flatMap((id) => {
        const message = thread.messages[id];
        return message ? [factsOf(message as Message)] : [];
      });
    });

  const window = async (
    roomId: string,
    limit: number,
    signal: AbortSignal,
  ): Promise<WindowResult> => {
    const bounded = Math.min(CONTRACT_CEILING, Math.max(1, limit));
    let outcome: HttpOutcome<Context>;
    try {
      outcome = await http.request({
        path: "/context",
        signal,
        generationKey: `agent:context:${roomId}`,
        query: new URLSearchParams({ roomId, limit: String(bounded) }),
      });
    } catch {
      return { ok: false, code: "NO_ANSWER" };
    }
    if (outcome.kind === "discarded") return { ok: false, code: "DISCARDED" };
    if (outcome.kind === "failure")
      return { ok: false, code: outcome.error.code };
    if (outcome.data.messages.some((message) => message.roomId !== roomId))
      return { ok: false, code: "ANOTHER_ROOM" };
    return {
      ok: true,
      messages: [...outcome.data.messages]
        .sort((a, b) => compareDecimalIds(a.id, b.id))
        .map(factsOf),
    };
  };

  return { rooms, loaded, window };
}
