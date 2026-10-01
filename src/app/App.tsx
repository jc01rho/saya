import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { components } from "../contract/decoded";
import { Coordinator } from "../coordination/coordinator";
import { browserPlatform } from "../coordination/platform";
import { BoundedCache } from "../core/cache";
import { ContextWindows } from "../core/context";
import { Reconciler } from "../core/reconcile";
import type { ClientStores, Immutable } from "../core/stores";
import {
  AgentActivity,
  AgentToolsEntry,
  AgentToolsState,
  agentSourceOf,
  createAgentTools,
  useAgentTools,
} from "../features/agent";
import { AttachmentsPanel, AttachmentsToggle } from "../features/attachments";
import { Composer } from "../features/composer";
import { ConnectionScreen } from "../features/connection";
import { DigestEntry } from "../features/digest";
import icon from "../features/digest/DigestEntry.module.css";
import { NoticeBar } from "../features/notice";
import { RoomsPane, useCatalog, useSlice } from "../features/rooms";
import { ThreadPane } from "../features/thread";
import { HttpClient } from "../transport/http";
import { Cat, COPY, RoomAvatar } from "../ui";
import styles from "./App.module.css";
import { Rail } from "./Rail";
import { ROOMS_HASH, useRoute } from "./routes";

/** Everything a tab holds in memory. Nothing here touches disk. */
export type Session = {
  http: HttpClient;
  cache: BoundedCache;
  stores: ClientStores;
  /** Per-room newest windows: which limit each room asks for and what is in flight. */
  windows: ContextWindows;
  /** Orders `/context` replies against live `/stream` records for the same room. */
  reconciler: Reconciler;
  /**
   * Builds the `/stream` subscription: one connection for the whole browser,
   * elected across tabs. A `Coordinator` holds a Web Lock and its `stop()` is
   * terminal, so each mount gets a fresh one rather than restarting a dead one.
   */
  createCoordinator: () => Coordinator;
};

export function createSession(): Session {
  const http = new HttpClient();
  const cache = new BoundedCache();
  // Windows load through the reconciler so a context reply can never overwrite
  // a newer row the stream already delivered.
  const reconciler = new Reconciler(cache, { http });
  const createCoordinator = () =>
    new Coordinator({
      platform: browserPlatform(),
      apply(records) {
        for (const { event } of records)
          reconciler.accept(
            event.type === "oversize-gap"
              ? // A record the ring could not carry is a discarded frame by any
                // other name: the following cursor turns it into a stated gap.
                { type: "discarded-frame", bytes: event.bytes }
              : event,
          );
      },
      // Resume by cursor, never Last-Event-ID: one `since=roomId:logId` per room.
      query() {
        const params = new URLSearchParams();
        for (const [roomId, logId] of Object.entries(
          reconciler.resume().cursor,
        ))
          params.append("since", `${roomId}:${logId}`);
        return params;
      },
    });
  return {
    http,
    cache,
    stores: cache.stores,
    windows: new ContextWindows(reconciler, cache),
    reconciler,
    createCoordinator,
  };
}

const APP_COPY = {
  pick: "대화를 선택하세요",
  back: "목록으로",
  untitled: "대화",
  direct: "1:1 대화",
  members: (count: number) => `멤버 ${count}명`,
  retry: "다시 확인",
  networkTitle: "브리지에 연결할 수 없습니다",
  networkBody:
    "프록시가 응답하지 않습니다. 프록시와 코어가 실행 중인지 확인하세요.",
  protocolTitle: "브리지 응답을 해석할 수 없습니다",
  protocolBody:
    "프록시 뒤의 응답이 계약과 다릅니다. 프록시 대상과 코어 버전을 확인하세요.",
  capacityTitle: "목록이 표시 가능한 범위를 넘었습니다",
  capacityBody: (limit: string) =>
    `카탈로그 응답이 이 클라이언트의 ${limit} 정책을 넘어 표시하지 않았습니다.`,
} as const;

/**
 * The line under the room title. Every word comes from a member the contract
 * actually carries — `readable`, `kind`, `memberCount` — and the line is absent
 * when none of them applies rather than filled with a guess.
 */
function roomSubtitle(
  room: Immutable<components["schemas"]["Room"]> | undefined,
): string | null {
  if (!room) return null;
  if (!room.readable) return COPY.unreadable;
  if (room.kind === "direct") return APP_COPY.direct;
  if (room.memberCount > 0) return APP_COPY.members(room.memberCount);
  return null;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <main className={styles.notice} data-ui="app-notice">
      {children}
    </main>
  );
}

function EmptyOutlet() {
  return (
    <div className={styles.empty}>
      <Cat height={48} />
      <p>{APP_COPY.pick}</p>
    </div>
  );
}

/**
 * Where the thread mounts: the header the mobile view needs (a way back and
 * the room title as the h1) above the conversation wall, which owns its scroll.
 */
function RoomOutlet({
  stores,
  windows,
  http,
  roomId,
}: {
  stores: ClientStores;
  windows: ContextWindows;
  http: HttpClient;
  roomId: string;
}) {
  const snapshot = useSlice(stores, `room.${roomId}`);
  const subtitle = roomSubtitle(snapshot?.room);
  // The side panel stays open across rooms, as a messenger's info pane does;
  // what it shows is keyed by the room inside it.
  const [info, setInfo] = useState(false);
  const panelId = useId();
  const toggle = useRef<HTMLDivElement>(null);
  const closeInfo = useCallback(() => {
    setInfo(false);
    toggle.current
      ?.querySelector<HTMLButtonElement>('[data-ui="attachments-open"]')
      ?.focus();
  }, []);
  return (
    <>
      <div className={styles.top}>
        <header className={styles.threadHead}>
          <a className={styles.back} href={ROOMS_HASH}>
            <span className="sr-only">{APP_COPY.back}</span>
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
          <RoomAvatar
            name={snapshot?.room.title ?? APP_COPY.untitled}
            size={40}
            images={snapshot?.room.images}
          />
          <div className={styles.identity}>
            <h1 className={styles.title}>
              {snapshot?.room.title ?? APP_COPY.untitled}
            </h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          <div className={styles.actions} ref={toggle}>
            <DigestEntry stores={stores} http={http} roomId={roomId} />
            <AttachmentsToggle
              className={icon.open}
              open={info}
              controls={panelId}
              onToggle={() => setInfo((open) => !open)}
            />
          </div>
        </header>
        <NoticeBar key={roomId} http={http} roomId={roomId} />
      </div>
      <div className={styles.lower}>
        <div className={styles.conversation}>
          <ThreadPane
            stores={stores}
            windows={windows}
            roomId={roomId}
            http={http}
          />
          <Composer http={http} roomId={roomId} />
        </div>
        {info ? (
          <AttachmentsPanel
            id={panelId}
            http={http}
            roomId={roomId}
            onClose={closeInfo}
          />
        ) : null}
      </div>
    </>
  );
}

/**
 * The composition root: one session, the hash route, the catalog request, and
 * the two panes. The shell is 100dvh and never scrolls; the list and, later,
 * the conversation wall own their own scrolling.
 */
export function App({ session }: { session?: Session }) {
  const [own] = useState(() => session ?? createSession());
  const [agent] = useState(() => new AgentToolsState());
  const tools = useMemo(
    () => () => createAgentTools(agentSourceOf(own.stores, own.http)),
    [own],
  );
  useAgentTools(agent, tools);
  const route = useRoute();
  const { phase, reload } = useCatalog(own.http, own.cache);
  const roomId = route.kind === "room" ? route.roomId : null;

  // The active room is pinned against eviction and keeps the larger window.
  useEffect(() => {
    own.cache.selectRoom(roomId);
  }, [own, roomId]);

  // One `/stream` per browser, elected across tabs. Without this the screen
  // only ever shows what a `/context` request happened to fetch.
  useEffect(() => {
    const coordinator = own.createCoordinator();
    void coordinator.start();
    return () => {
      void coordinator.stop();
    };
  }, [own]);

  if (phase.kind === "failed")
    return (
      <Notice>
        <ConnectionScreen state={phase.state} onRetry={reload} />
      </Notice>
    );
  if (phase.kind === "unreachable" || phase.kind === "over-capacity") {
    const protocol =
      phase.kind === "unreachable" && phase.reason === "protocol";
    const title =
      phase.kind === "over-capacity"
        ? APP_COPY.capacityTitle
        : protocol
          ? APP_COPY.protocolTitle
          : APP_COPY.networkTitle;
    const body =
      phase.kind === "over-capacity"
        ? APP_COPY.capacityBody(
            `${own.cache.limits.catalogBytes / (1024 * 1024)} MiB`,
          )
        : protocol
          ? APP_COPY.protocolBody
          : APP_COPY.networkBody;
    return (
      <Notice>
        <section aria-labelledby="catalog-heading">
          <h1 id="catalog-heading">{title}</h1>
          <p>{body}</p>
          <button type="button" onClick={reload}>
            {APP_COPY.retry}
          </button>
        </section>
      </Notice>
    );
  }

  return (
    <div className={styles.shell} data-ui="app" data-route={route.kind}>
      <Rail className={styles.rail} stores={own.stores} />
      <RoomsPane
        className={styles.list}
        stores={own.stores}
        activeRoomId={roomId}
        loading={phase.kind === "loading"}
        actions={<AgentToolsEntry state={agent} />}
      />
      <main className={styles.thread} data-ui="thread-outlet">
        {roomId === null ? (
          <EmptyOutlet />
        ) : (
          <RoomOutlet
            stores={own.stores}
            windows={own.windows}
            http={own.http}
            roomId={roomId}
          />
        )}
      </main>
      <AgentActivity state={agent} />
    </div>
  );
}
