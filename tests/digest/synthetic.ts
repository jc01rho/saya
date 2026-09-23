import type { components } from "../../src/contract/decoded";
import { validateDigest } from "../../src/contract/validators.js";
import type {
  DigestRequests,
  DigestTransport,
} from "../../src/features/digest/requests";
import type { HttpOutcome, JsonRequest } from "../../src/transport/http";

type Digest = components["schemas"]["Digest"];
type Slice = components["schemas"]["DigestSlice"];
type Message = components["schemas"]["Message"];
type Room = components["schemas"]["Room"];

export const EPOCH = Date.UTC(2037, 3, 7, 9);
export const SPAN_MS = 30 * 60_000;
/** The fixture's note. It names no model and no summary; the surface must not either. */
export const NOTE =
  "합성 발췌 fixture: 실제 메시지를 그대로 골라냈고, 어떤 모델도 실행하지 않았습니다.";

export type Pending = {
  request: JsonRequest<"/digest">;
  resolve: (outcome: HttpOutcome<Digest>) => void;
  reject: (reason: unknown) => void;
};

/** A transport whose answers the test releases by hand, in any order. */
export function fakeTransport() {
  const pending: Pending[] = [];
  const transport: DigestTransport = {
    request: (request) =>
      new Promise<HttpOutcome<Digest>>((resolve, reject) => {
        pending.push({ request, resolve, reject });
      }),
  };
  return { transport, pending };
}

export function roomFor(id: string, title: string): Room {
  return {
    id,
    title,
    kind: "group",
    type: "MultiChat",
    memberCount: 5,
    unread: 0,
    lastMessageId: null,
    lastActivityAt: null,
    readable: true,
  };
}

/** Invented Hangul rows one minute apart with ids beyond 2^53; `from` shifts the run. */
export function syntheticRows(
  roomId: string,
  count: number,
  from = 0,
): Message[] {
  return Array.from({ length: count }, (_, index) => {
    const serial = from + index;
    const sender = serial % 4;
    return {
      id: (28300000000000000n + BigInt(serial)).toString(),
      roomId,
      senderId: (38000000000000000n + BigInt(sender)).toString(),
      sender: `가상참여자-${sender}`,
      text: `가상 등불 ${serial}번, 발췌 창의 ${serial}번째 줄입니다.`,
      kind: "text",
      sentAt: new Date(EPOCH + serial * 60_000).toISOString(),
      fromMe: sender === 0,
    };
  });
}

/** One 30-minute slice over `messages`, framed the way the bridge frames it: real rows as highlights. */
export function sliceFor(messages: Message[], highlights: number): Slice {
  const first = messages[0];
  const start = first?.sentAt
    ? Math.floor(Date.parse(first.sentAt) / SPAN_MS) * SPAN_MS
    : EPOCH;
  const speakers = new Map<string, number>();
  for (const message of messages)
    speakers.set(message.sender, (speakers.get(message.sender) ?? 0) + 1);
  return {
    from: new Date(start).toISOString(),
    to: new Date(start + SPAN_MS).toISOString(),
    count: messages.length,
    speakers: [...speakers].map(([name, count]) => ({ name, count })),
    keywords: [{ word: "가상", count: messages.length }],
    highlights: messages.slice(0, highlights),
  };
}

export function digestOf(
  room: Room,
  shape: { span: string; considered: number; slices: Slice[] },
): Digest {
  const digest: Digest = {
    ok: true,
    room,
    span: shape.span,
    considered: shape.considered,
    slices: shape.slices,
    note: NOTE,
  };
  if (!validateDigest(digest))
    throw new Error(
      `Synthetic digest breaks the contract: ${validateDigest.errors?.[0]?.instancePath}`,
    );
  return digest;
}

export const success = (data: Digest): HttpOutcome<Digest> => ({
  kind: "success",
  data,
});

/** Resolves on the store notification that ends the request; registered before the answer is released. */
export function whenSettled(requests: DigestRequests, roomId: string) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error(`Timeout: digest ${roomId} never settled`));
    }, 5_000);
    const off = requests.subscribe(roomId, () => {
      if (requests.getSnapshot(roomId).loading) return;
      clearTimeout(timer);
      off();
      resolve();
    });
  });
}

/** One macrotask turn: every reaction to an already-released answer has run by then. */
export const drain = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));
