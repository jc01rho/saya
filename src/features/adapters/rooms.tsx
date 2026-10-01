import { useEffect, useState } from "react";
import { adapterRoomHash } from "../../app/routes";
import {
  type AdapterResult,
  type AdapterRoom,
  fetchRooms,
  type RoomsAnswer,
} from "../../transport/adapters";
import { formatTime, RoomAvatar, UnreadBadge } from "../../ui";
import styles from "./Adapters.module.css";
import { problemSentence } from "./copy";

const COPY = {
  loading: "방 목록을 불러오는 중입니다.",
  empty: "이 계정에서 볼 수 있는 방이 없습니다.",
  incomplete: "어댑터가 정한 한도까지만 받았습니다. 더 오래된 방이 있습니다.",
  noText: "텍스트 없는 메시지",
  me: "나: ",
  unread: (count: number) => `안 읽음 ${count.toLocaleString("ko-KR")}개`,
  readOnly: "이 어댑터는 아직 메시지 읽기를 제공하지 않아 방을 열 수 없습니다.",
} as const;

/** Rooms this tab has seen, so a room view can title itself before it asks again. */
const seen = new Map<string, Map<string, AdapterRoom>>();

export function rememberedRoom(
  adapterId: string,
  roomId: string,
): AdapterRoom | undefined {
  return seen.get(adapterId)?.get(roomId);
}

export function rememberRooms(adapterId: string, rooms: AdapterRoom[]) {
  seen.set(adapterId, new Map(rooms.map((room) => [room.id, room])));
}

function preview(room: AdapterRoom): string | null {
  if (!room.lastMessage) return null;
  const text = room.lastMessage.text || COPY.noText;
  return room.lastMessage.fromMe ? COPY.me + text : text;
}

function Row({
  adapterId,
  room,
  now,
  openable,
}: {
  adapterId: string;
  room: AdapterRoom;
  now: Date;
  openable: boolean;
}) {
  const time = formatTime(room.lastActivityAt, now);
  const line = preview(room);
  const body = (
    <>
      <RoomAvatar name={room.title} size={44} />
      <div className={styles.roomBody}>
        <div className={styles.roomTop}>
          <span className={styles.roomTitle}>{room.title}</span>
          {room.lastActivityAt ? (
            <time className={styles.roomTime} dateTime={time.dateTime ?? ""}>
              {time.label}
            </time>
          ) : null}
        </div>
        <div className={styles.roomBottom}>
          <span className={styles.roomPreview}>{line}</span>
          {room.unread > 0 ? (
            <span className={styles.roomBadge}>
              <UnreadBadge count={room.unread} />
              <span className="sr-only">{COPY.unread(room.unread)}</span>
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
  return (
    <li>
      {openable ? (
        <a
          className={styles.roomRow}
          href={adapterRoomHash(adapterId, room.id)}
          data-ui="adapter-room-row"
        >
          {body}
        </a>
      ) : (
        <div className={styles.roomRow} data-ui="adapter-room-row">
          {body}
        </div>
      )}
    </li>
  );
}

/** The rooms an adapter lists, in its own order; a row opens only where reading is declared. */
export function AdapterRooms({
  adapterId,
  openable,
}: {
  adapterId: string;
  openable: boolean;
}) {
  const [state, setState] = useState<
    { kind: "loading" } | AdapterResult<RoomsAnswer>
  >({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    fetchRooms(adapterId, controller.signal).then(
      (result) => {
        if (result.kind === "ok") rememberRooms(adapterId, result.data.rooms);
        setState(result);
      },
      () => {
        // Only an abort rejects, and an unmounted list has nothing to show.
      },
    );
    return () => controller.abort();
  }, [adapterId]);

  if (state.kind === "loading")
    return <p className={styles.line}>{COPY.loading}</p>;
  if (state.kind !== "ok")
    return <p className={styles.line}>{problemSentence(state)}</p>;
  const { rooms, complete } = state.data;
  const now = new Date();
  return (
    <>
      {!openable ? <p className={styles.line}>{COPY.readOnly}</p> : null}
      {rooms.length ? (
        <ul className={styles.rooms} data-ui="adapter-rooms">
          {rooms.map((room) => (
            <Row
              key={room.id}
              adapterId={adapterId}
              room={room}
              now={now}
              openable={openable}
            />
          ))}
        </ul>
      ) : (
        <p className={styles.line}>{COPY.empty}</p>
      )}
      {complete ? null : <p className={styles.meta}>{COPY.incomplete}</p>}
    </>
  );
}
