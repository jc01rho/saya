import {
  AdapterRoomBody,
  AdaptersPane,
  type KakaoStatus,
  useAdapterRoom,
} from "../features/adapters";
import { cx, RoomAvatar } from "../ui";
import styles from "./App.module.css";
import { ADAPTERS_HASH, ROOMS_HASH } from "./routes";

const COPY = {
  adapters: "연결",
  adaptersSubtitle: "메신저 연결",
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

/** The connections view: a header like a room's, over the KakaoTalk core and every adapter. */
function AdaptersOutlet({
  kakao,
  onKakaoRetry,
}: {
  kakao: KakaoStatus;
  onKakaoRetry: () => void;
}) {
  return (
    <>
      <header className={styles.threadHead}>
        <Back href={ROOMS_HASH} label={COPY.back} />
        <div className={styles.identity}>
          <h1 className={styles.title}>{COPY.adapters}</h1>
          <p className={styles.subtitle}>{COPY.adaptersSubtitle}</p>
        </div>
      </header>
      <AdaptersPane kakao={kakao} onKakaoRetry={onKakaoRetry} />
    </>
  );
}

/** An adapter room: a header like a KakaoTalk room's, over the adapter's own thread. */
function AdapterRoomOutlet({
  adapterId,
  roomId,
  backHref,
}: {
  adapterId: string;
  roomId: string;
  backHref: string | undefined;
}) {
  const { room, capabilities } = useAdapterRoom(adapterId, roomId);
  const title = room?.title ?? COPY.untitled;
  return (
    <>
      <header className={styles.threadHead}>
        {/* Beside a list the way back is the mobile one; alone, it shows at every width. */}
        {backHref ? (
          <Back href={backHref} label={COPY.back} />
        ) : (
          <Back href={ADAPTERS_HASH} label={COPY.toAdapterList} always />
        )}
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
  backHref,
  kakao = { kind: "checking" },
  onKakaoRetry = () => {},
}: {
  adapterId?: string;
  roomId?: string;
  /** The KakaoTalk core's state, for its card in 연결. */
  kakao?: KakaoStatus;
  onKakaoRetry?: () => void;
  /** The list beside this room, if any; without it the way back is 연결. */
  backHref?: string;
}) {
  return adapterId !== undefined && roomId !== undefined ? (
    <AdapterRoomOutlet
      adapterId={adapterId}
      roomId={roomId}
      backHref={backHref}
    />
  ) : (
    <AdaptersOutlet kakao={kakao} onKakaoRetry={onKakaoRetry} />
  );
}
