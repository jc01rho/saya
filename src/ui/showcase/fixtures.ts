import type { components } from "../../contract/decoded";

type Room = components["schemas"]["Room"];
type Message = components["schemas"]["Message"];
type Coverage = components["schemas"]["Coverage"];

/**
 * Invented specimen data for the showcase, using the approved concept's generic
 * room words. Ids exceed 2^53 on purpose and are never rendered.
 */
export const NOW = new Date("2026-09-21T09:40:00+09:00");

const at = (hoursAgo: number, minutes = 0) =>
  new Date(
    NOW.getTime() - hoursAgo * 3_600_000 - minutes * 60_000,
  ).toISOString();

const room = (index: number, overrides: Partial<Room>): Room => ({
  id: (18491246151592761n + BigInt(index)).toString(),
  title: `방 ${index}`,
  kind: "group",
  type: "MultiChat",
  memberCount: 4,
  unread: 0,
  lastMessageId: (28000000000000000n + BigInt(index)).toString(),
  lastActivityAt: at(index),
  readable: true,
  ...overrides,
});

export const ROOMS: {
  room: Room;
  preview: string | null;
  active?: boolean;
  note: string;
}[] = [
  {
    room: room(1, { title: "개발 잡담", unread: 4, lastActivityAt: at(0, 5) }),
    preview: "확인했습니다. 오후에 정리해서 공유하겠습니다.",
    active: true,
    note: "활성 행 · 관찰된 미리보기 · 문 틈",
  },
  {
    room: room(2, { title: "가족", lastActivityAt: at(1) }),
    preview: "주말에 시간 되면 알려 줘",
    note: "읽지 않은 메시지 0 · 배지 없음",
  },
  {
    room: room(3, { title: "북클럽", unread: 1, lastActivityAt: at(26) }),
    preview: null,
    note: "관찰된 본문 없음 → 미리보기 없음",
  },
  {
    room: room(4, {
      title: "점심 모임",
      unread: 12,
      lastActivityAt: at(0, 12),
    }),
    preview: "12시 반에 1층에서 만나요",
    note: "두 자리 수",
  },
  {
    room: room(5, { title: "스터디", unread: 143, lastActivityAt: at(72) }),
    preview: "이번 주 자료 올렸습니다",
    note: "143 → 99+ · 접근성 이름에는 143",
  },
  {
    room: room(6, {
      title: "공지",
      unread: 7,
      readable: false,
      lastActivityAt: at(30),
    }),
    preview: null,
    note: "readable: false · 전체 잉크 · 배지 없음",
  },
  {
    room: room(7, {
      title: "나와의 채팅",
      kind: "self",
      type: "MemoChat",
      memberCount: 1,
      lastActivityAt: null,
      lastMessageId: null,
    }),
    preview: "장보기 목록: 우유, 달걀",
    note: "lastActivityAt null → 시간 미상",
  },
  {
    room: room(8, {
      title: "알림 · 정기 점검과 서비스 안내를 모아 두는 아주 긴 제목의 채널",
      kind: "plus",
      type: "PlusChat",
      unread: 99,
      lastActivityAt: "2025-12-24T03:00:00+09:00",
    }),
    preview:
      "정기 점검 안내와 함께 아주 긴 미리보기 문장이 한 줄에서 말줄임으로 잘리는지 확인합니다.",
    note: "긴 제목과 미리보기 · 정확히 99 · 지난 해 날짜",
  },
];

const PEER_A = { id: "38000000000000001", name: "참여자 A" };
const PEER_B = { id: "38000000000000002", name: "참여자 B" };
const PEER_C = { id: "38000000000000003", name: "참여자 C" };
const ME = { id: "38000000000000000", name: "사용자" };
const ROOM_ID = ROOMS[0]?.room.id ?? "18491246151592762";

const message = (
  index: number,
  sender: { id: string; name: string },
  text: string,
  overrides: Partial<Message> = {},
): Message => ({
  id: (28000000000000100n + BigInt(index)).toString(),
  roomId: ROOM_ID,
  senderId: sender.id,
  sender: sender.name,
  text,
  kind: "text",
  sentAt: new Date(
    NOW.getTime() - (40 - index) * 60_000 - 8 * 60_000,
  ).toISOString(),
  fromMe: sender.id === ME.id,
  ...overrides,
});

const first = message(1, PEER_A, "어제 배포 잘 끝났나요?");

export const MESSAGES: { message: Message; note: string }[] = [
  { message: first, note: "상대 · 기본" },
  {
    message: message(2, PEER_B, "네, 새벽에 문제 없이 끝났습니다.", {
      kind: "reply",
      replyTo: {
        messageId: first.id,
        senderId: first.senderId,
        sender: first.sender,
        text: first.text,
        kind: first.kind,
      },
    }),
    note: "인용 블록",
  },
  {
    message: message(
      3,
      PEER_B,
      "테스트 환경에서 로그인 후 첫 화면이 늦게 뜨는 현상이 있어서 원인을 확인하고 있습니다.\n확인되면 다시 공유하겠습니다.",
    ),
    note: "여러 줄 · 62ch 측정폭",
  },
  {
    message: message(
      4,
      PEER_A,
      "@사용자 회의 자료 오늘 중으로 확인 부탁드립니다.",
      {
        mentions: [{ userId: ME.id, name: ME.name, at: [0], length: 4 }],
        mentionsMe: true,
      },
    ),
    note: "메타데이터 기반 멘션 · 본문은 그대로",
  },
  {
    message: message(5, ME, "확인했습니다. 오후에 정리해서 공유하겠습니다."),
    note: "읽어 온 fromMe 행 · 보냈습니다",
  },
  {
    message: message(6, PEER_C, "", { kind: "photo" }),
    note: "photo · 종류 라벨만",
  },
  {
    message: message(7, PEER_C, "", { kind: "sticker-3d" }),
    note: "알 수 없는 kind · 자기 서술",
  },
  {
    message: message(8, PEER_B, "그 메시지는 삭제된 것 같아요.", {
      kind: "reply",
      replyTo: {
        messageId: null,
        senderId: null,
        sender: null,
        text: null,
        kind: null,
      },
    }),
    note: "replyTo 전부 null → 인용 정보 없음",
  },
  {
    message: message(9, PEER_A, "시간 정보가 없는 메시지입니다.", {
      sentAt: null,
    }),
    note: "sentAt null → 시간 미상",
  },
  {
    message: message(10, PEER_B, "@전체 오늘 회의는 3시입니다.", {
      mentionsAll: true,
    }),
    note: "mentionsAll",
  },
  {
    message: message(11, PEER_A, "네, 그 부분은 제가 정리해서 올리겠습니다.", {
      kind: "reply",
      replyTo: {
        messageId: "28000000000000103",
        senderId: PEER_B.id,
        sender: PEER_B.name,
        text: "테스트 환경에서 로그인 후 첫 화면이 늦게 뜨는 현상이 있어서 원인을 확인하고 있습니다. 확인되면 다시 공유하겠습니다. 재현 절차도 함께 남겨 두겠습니다.",
        kind: "text",
      },
    }),
    note: "긴 인용 → 두 줄 말줄임",
  },
  {
    message: message(12, PEER_C, "", { kind: "text" }),
    note: "text kind에 빈 본문 → 본문 없음",
  },
];

export const PENDING: {
  message: Message;
  state: "pending" | "unknown" | "rejected";
  action: string | null;
  note: string;
}[] = [
  {
    message: message(20, ME, "추가로 확인할 항목이 있으면 알려 주세요."),
    state: "pending",
    action: null,
    note: "submitted · 입력됨 · 전달 미확인",
  },
  {
    message: message(21, ME, "회의록 링크도 같이 공유합니다."),
    state: "pending",
    action: "이 기록으로 확인",
    note: "후보 관찰됨 · 사용자만 연결",
  },
  {
    message: message(22, ME, "결과를 받지 못한 전송입니다."),
    state: "unknown",
    action: "다시 보내기",
    note: "SEND_FAILED · 타임아웃 · 결과 유실",
  },
  {
    message: message(23, ME, "대기열이 가득 찬 상태의 전송입니다."),
    state: "rejected",
    action: null,
    note: "429 RATE_LIMITED",
  },
];

export const COVERAGE: Coverage = {
  localOnly: true,
  reachesLatestKnown: true,
  catalogLatestMessageId: "28000000000000112",
  newestReadMessageId: "28000000000000112",
  hasEarlier: true,
  storedLocally: 445714,
};

export const COVERAGE_BEHIND: Coverage = {
  ...COVERAGE,
  reachesLatestKnown: false,
  hasEarlier: false,
  storedLocally: 40,
};
