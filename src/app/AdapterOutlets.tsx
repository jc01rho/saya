import {
  AdapterRoomBody,
  AdaptersPane,
  useAdapterRoom,
} from "../features/adapters";
import { cx, RoomAvatar } from "../ui";
import styles from "./App.module.css";
import { ADAPTERS_HASH, ROOMS_HASH } from "./routes";

const COPY = {
  adapters: "연결",
  adaptersSubtitle: "메신저 어댑터",
  back: "목록으로",
  toAdapterList: "연결로",
  untitled: "대화",
} as const;

function Back({
  href,
  label,
  always,
}: {
  href: string;
  label: string;
  always?: boolean;
}) {
  return (
    <a className={cx(styles.back, always && styles.always)} href={href}>
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15 5l-7 7 7 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

/** The connections view: a header like a room's, over every adapter the proxy fronts. */
function AdaptersOutlet() {
  return (
    <>
      <header className={styles.threadHead}>
        <Back href={ROOMS_HASH} label={COPY.back} />
        <div className={styles.identity}>
          <h1 className={styles.title}>{COPY.adapters}</h1>
          <p className={styles.subtitle}>{COPY.adaptersSubtitle}</p>
        </div>
      </header>
      <AdaptersPane />
    </>
  );
}

/** An adapter room: a header like a KakaoTalk room's, over the adapter's own thread. */
function AdapterRoomOutlet({
  adapterId,
  roomId,
}: {
  adapterId: string;
  roomId: string;
}) {
  const { room, capabilities } = useAdapterRoom(adapterId, roomId);
  const title = room?.title ?? COPY.untitled;
  return (
    <>
      <header className={styles.threadHead}>
        {/* No list column beside an adapter room, so the way back shows at every width. */}
        <Back href={ADAPTERS_HASH} label={COPY.toAdapterList} always />
        <RoomAvatar name={title} size={40} />
        <div className={styles.identity}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            {capabilities.kind === "connected"
              ? capabilities.capabilities.provider.name
              : COPY.adaptersSubtitle}
          </p>
        </div>
      </header>
      <AdapterRoomBody
        adapterId={adapterId}
        roomId={roomId}
        capabilities={capabilities}
      />
    </>
  );
}

export default function AdapterOutlet({
  adapterId,
  roomId,
}: {
  adapterId?: string;
  roomId?: string;
}) {
  return adapterId !== undefined && roomId !== undefined ? (
    <AdapterRoomOutlet adapterId={adapterId} roomId={roomId} />
  ) : (
    <AdaptersOutlet />
  );
}
