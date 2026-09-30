import type { components } from "../../src/contract/decoded";

type Room = components["schemas"]["Room"];
type Message = components["schemas"]["Message"];
type Notice = components["schemas"]["Notice"];
type Revision = components["schemas"]["Revision"];
export type Dataset = "baseline" | "stress";
export const SEED = 7;
export const FIRST_ROOM_ID = "18491246151592761";
const EPOCH = Date.UTC(2037, 3, 7, 9);

/** All values are invented; no source outside this generator is consulted. */
export function generateData(dataset: Dataset = "baseline", seed = SEED) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const count = dataset === "stress" ? 1000 : 100;
  const messageCount = dataset === "stress" ? 1000 : 40;
  const rooms: Room[] = [];
  const messages = new Map<string, Message[]>();
  const notices = new Map<string, Notice>();
  const revisions = new Map<string, Revision[]>();
  const files = new Map<string, { name: string; bytes: string }>();
  for (let r = 0; r < count; r++) {
    const id = (BigInt(FIRST_ROOM_ID) + BigInt(r)).toString();
    const rows: Message[] = [];
    // Only the active room carries the full stress window. Other rooms stay cheap.
    const size = r === 0 ? messageCount : 40;
    for (let m = 0; m < size; m++) {
      const senderIndex = random() % 8;
      const sender = `가상참여자-${senderIndex}`;
      const row: Message = {
        id: (28000000000000000n + BigInt(r * 10000 + m + seed)).toString(),
        roomId: id,
        senderId: (38000000000000000n + BigInt(senderIndex)).toString(),
        sender,
        // Hangul-dominant on purpose: the reading surface is Korean, and CJK wraps,
        // measures and line-breaks differently from ASCII. An ASCII-only fixture would
        // let a broken Korean measure pass. Every value here is invented.
        text:
          `가상 등불 ${random() % 10000}번, ${r}번 방 ${m}번째 줄입니다.` +
          (m % 10 === 0 ? "\n둘째 줄 표본: 별빛 모형." : "") +
          (m % 25 === 0
            ? " 긴 문단 표본입니다. 이 문장은 62자 기준 너비에서 한글이 어떻게 줄바꿈되는지, 그리고 가변 높이 행 측정이 실제로 다시 계산되는지 확인하려고 일부러 길게 늘여 쓴 합성 문장입니다."
            : ""),
        kind: "text",
        sentAt: new Date(EPOCH - r * 86_400_000 + m * 1000).toISOString(),
        fromMe: senderIndex === 0,
      };
      if (m % 5 === 0 && m > 0) {
        const previous = rows[m - 1];
        if (!previous) throw new Error("Missing generated predecessor");
        row.kind = "reply";
        row.replyTo = {
          messageId: previous.id,
          senderId: previous.senderId,
          sender: previous.sender,
          text: previous.text,
          kind: previous.kind,
        };
      }
      if (m % 10 === 0) {
        row.mentions = [
          {
            userId: "38000000000000000",
            // Korean like every other label. NOTE: the body text deliberately does NOT contain
            // this name at offset 0, so any implementation that blindly slices the text by
            // at/length is caught rather than silently rendering the wrong range.
            name: "가상참여자-0",
            at: [0],
            length: 7,
          },
        ];
        row.mentionsMe = true;
      }
      rows.push(row);
    }
    // The second room carries the 0.15.0 members at its newest end, where an
    // opened thread shows them. Nothing here consumes the random stream, so
    // every other value is what it was before.
    if (r === 1 && size >= 40) {
      const [reacted, edited, covered, file, linked] = rows.slice(-5);
      if (!reacted || !edited || !covered || !file || !linked)
        throw new Error("Missing generated extras");
      reacted.reactions = [
        { label: "좋아요", count: 3 },
        { label: "최고", count: 1 },
      ];
      revisions.set(edited.id, [
        { revision: 0, text: "가상 등불 첫 문장입니다.", kind: "text" },
        { revision: 1, text: edited.text, kind: "text" },
      ]);
      edited.edited = true;
      covered.covered = "safebot";
      covered.text = "";
      file.kind = "file";
      file.text = "가상 관측 보고서.txt";
      files.set(file.id, {
        name: file.text,
        bytes: "가상 관측 보고서: 합성 데이터입니다.\n",
      });
      linked.text = "가상 문서 주소 https://example.invalid/가상-문서";
      linked.reactions = [{ label: "좋아요", count: 2 }];
      notices.set(id, {
        text: "가상 공지: 이번 주 관측 일정은 목요일 저녁입니다. 합성 문장입니다.",
        kind: "text",
        authorId: "38000000000000001",
        author: "가상참여자-1",
        postedAt: new Date(EPOCH - 3 * 86_400_000).toISOString(),
        source: "board",
      });
    }
    const last = rows.at(-1);
    rooms.push({
      id,
      title: `가상 관측소 ${r + 1}`,
      kind: r % 3 === 0 ? "direct" : "group",
      type: r % 3 === 0 ? "DirectChat" : "MultiChat",
      memberCount: 2 + (random() % 7),
      unread: random() % 160,
      lastMessageId: last?.id ?? null,
      lastActivityAt: last?.sentAt ?? null,
      readable: r % 19 !== 18,
    });
    messages.set(id, rows);
  }
  return { seed, dataset, rooms, messages, notices, revisions, files };
}

export type SyntheticData = ReturnType<typeof generateData>;
