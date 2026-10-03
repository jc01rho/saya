import {
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
import { ComposerState } from "../features/composer/state";
import { ConnectionScreen } from "../features/connection";
import { DigestEntry } from "../features/digest";
import icon from "../features/digest/DigestEntry.module.css";
import { NoticeBar } from "../features/notice";
import {
  PirateTalkActions,
  PirateTalkSession,
  PirateTalkStatus,
} from "../features/piratetalk";
import {
  hasDecoration,
  richTextRequest,
  type TextDecoration,
} from "../features/piratetalk/authoring/model";
import { RoomsPane, useCatalog, useSlice } from "../features/rooms";
import { ThemeControl } from "../features/theme";
import { ThreadPane } from "../features/thread";
import { HttpClient } from "../transport/http";
import { Cat, COPY, cx, RoomAvatar } from "../ui";
import styles from "./App.module.css";

// The adapter views and the adapter contract's validators load only when opened.
const AdapterOutlet = lazy(() => import("./AdapterOutlets"));
const Inbox = lazy(() => import("../features/inbox"));

import type { KakaoStatus } from "../features/adapters";
import { useAdapterTabs } from "./adapterTabs";
import { ListTabs } from "./ListTabs";
import { nothingConnected } from "./nothingConnected";
import { Rail } from "./Rail";
import {
  ADAPTERS_HASH,
  type ListMode,
  listHash,
  listModeOf,
  type Route,
  sameMode,
  useRoute,
} from "./routes";

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
  toAdapters: "다른 메신저 연결 보기",
  all: "전체",
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
      {/* The KakaoTalk core being down does not close the other messengers. */}
      <a className={styles.noticeLink} href={ADAPTERS_HASH}>
        {APP_COPY.toAdapters}
      </a>
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
  backHref,
  piratetalk,
  composer,
}: {
  stores: ClientStores;
  windows: ContextWindows;
  http: HttpClient;
  roomId: string;
  /** The list this room was opened from, for the mobile way back. */
  backHref: string;
  piratetalk: PirateTalkSession;
  composer: ComposerState;
}) {
  const snapshot = useSlice(stores, `room.${roomId}`);
  const capabilities = useSyncExternalStore(
    piratetalk.subscribe,
    piratetalk.getSnapshot,
  );
  useSyncExternalStore(composer.subscribe, composer.getSnapshot);
  const currentDecoration = composer.getDecoration(roomId);
  const setDecoration = (value: TextDecoration) =>
    composer.setDecoration(value);
  const [navigationError, setNavigationError] = useState<string>();
  const [anchor, setAnchor] = useState<components["schemas"]["Message"]>();
  const anchorRequest = useRef<AbortController | null>(null);
  useEffect(() => () => anchorRequest.current?.abort(), []);
  const navigate = useCallback(
    (targetRoom: string, messageId: string) => {
      anchorRequest.current?.abort();
      const controller = new AbortController();
      anchorRequest.current = controller;
      window.location.hash = `#/room/${encodeURIComponent(targetRoom)}?messageId=${encodeURIComponent(messageId)}`;
      setAnchor(undefined);
      void http
        .request({
          path: "/context",
          signal: controller.signal,
          generationKey: "piratetalk-anchor",
          query: new URLSearchParams({
            roomId: targetRoom,
            messageId,
            limit: "50",
          }),
        })
        .then((result) => {
          if (controller.signal.aborted || anchorRequest.current !== controller)
            return;
          if (result.kind !== "success") {
            setNavigationError("선택한 기록을 읽을 수 없습니다.");
            return;
          }
          const exact = result.data.messages.find(
            (message) =>
              message.id === messageId && message.roomId === targetRoom,
          );
          if (!exact) {
            setNavigationError("선택한 기록이 응답에 없습니다.");
            return;
          }
          setAnchor(exact);
          setNavigationError(undefined);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setNavigationError("선택한 기록에 연결할 수 없습니다.");
        });
    },
    [http],
  );
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    const id = params.get("messageId");
    if (id && (!anchor || anchor.roomId !== roomId || anchor.id !== id))
      navigate(roomId, id);
  }, [roomId, anchor, navigate]);
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
          <a className={styles.back} href={backHref}>
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
            storedStickers={
              capabilities.kind === "available" &&
              capabilities.capabilities.features.storedStickers?.available ===
                true
            }
            stores={stores}
            windows={windows}
            roomId={roomId}
            http={http}
            anchor={anchor?.roomId === roomId ? anchor : undefined}
            onCloseAnchor={() => {
              anchorRequest.current?.abort();
              setAnchor(undefined);
              window.location.hash = `#/room/${encodeURIComponent(roomId)}`;
            }}
            onReply={
              capabilities.kind === "available" &&
              capabilities.capabilities.features.reply.available
                ? (message) =>
                    setDecoration({
                      ...currentDecoration,
                      reply: {
                        roomId,
                        messageId: message.id,
                        text: message.text,
                      },
                    })
                : undefined
            }
            onThread={
              capabilities.kind === "available" &&
              capabilities.capabilities.features.thread.available
                ? (message) =>
                    setDecoration({
                      ...currentDecoration,
                      reply: {
                        roomId,
                        messageId: message.id,
                        text: message.text,
                      },
                      threadRoot: message.id,
                    })
                : undefined
            }
          />
          <div className={styles.extensions}>
            <PirateTalkStatus session={piratetalk} />
            <PirateTalkActions
              key={roomId}
              anchor={anchor?.roomId === roomId ? anchor : undefined}
              session={piratetalk}
              roomId={roomId}
              stores={stores}
              composer={composer}
              decoration={currentDecoration}
              onDecoration={setDecoration}
              onNavigate={navigate}
              onAttachment={(room, message) => {
                navigate(room, message);
                setInfo(true);
              }}
              onRefresh={() => {
                windows.retry(roomId);
                void http
                  .request({
                    path: "/rooms",
                    signal: new AbortController().signal,
                    generationKey: "piratetalk-local-overlay",
                  })
                  .then((result) => {
                    if (result.kind === "success")
                      stores.setCatalog(result.data.rooms);
                  })
                  .catch(() =>
                    setNavigationError(
                      "로컬 읽음 정보를 다시 불러오지 못했습니다.",
                    ),
                  );
              }}
            />
            {navigationError && <p role="status">{navigationError}</p>}
          </div>
          <Composer
            http={http}
            roomId={roomId}
            sharedState={composer}
            richSend={
              hasDecoration(currentDecoration)
                ? async (text) => {
                    const request = richTextRequest(
                      roomId,
                      text,
                      currentDecoration,
                    );
                    if (!request) return;
                    const result = await piratetalk.send(
                      request,
                      composer,
                      new AbortController().signal,
                    );
                    if (result.outcome !== "confirmed")
                      throw new Error(result.error.detail);
                    if (composer.getDraft(roomId).text === "")
                      setDecoration({
                        roomId,
                        mentions: [],
                        mentionEveryone: false,
                      });
                  }
                : undefined
            }
          />
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

/** The KakaoTalk catalog phase in the words the 연결 card uses. */
function kakaoStatusOf(
  phase: ReturnType<typeof useCatalog>["phase"],
  rooms: number,
): KakaoStatus {
  switch (phase.kind) {
    case "loading":
      return { kind: "checking" };
    case "ready":
      return { kind: "connected", rooms };
    case "unreachable":
      return { kind: phase.reason === "protocol" ? "protocol" : "unreachable" };
    case "over-capacity":
      return { kind: "over-capacity" };
    case "failed":
      switch (phase.state.kind) {
        case "unauthorized":
          return { kind: "refused", code: "UNAUTHORIZED" };
        case "permission-required":
          return { kind: "refused", code: "PERMISSION_REQUIRED" };
        case "host-not-ready":
        case "default":
          return { kind: "refused", code: phase.state.code };
        default:
          return { kind: "checking" };
      }
  }
}

/**
 * Which list sits beside a room: the one the route names, or for a room the
 * list it was opened from (전체 stays 전체; otherwise the room's own messenger).
 */
function modeFor(route: Route, last: ListMode): ListMode | null {
  const named = listModeOf(route);
  if (named) return named;
  if (route.kind === "adapters") return null;
  if (last.kind === "all") return last;
  if (route.kind === "adapter-room")
    return { kind: "adapter", adapterId: route.adapterId };
  return { kind: "kakao" };
}

/**
 * The composition root: one session, the hash route, the catalog request, and
 * the panes. The shell is 100dvh and never scrolls; the list and the
 * conversation wall own their own scrolling. 카카오 keeps the whole-screen
 * notice when the core cannot answer; 전체 and the adapter lists do not wait
 * on it, because the adapters are separate upstreams.
 */
export function App({ session }: { session?: Session }) {
  const [own] = useState(() => session ?? createSession());
  const [piratetalk] = useState(() => new PirateTalkSession());
  const [composer] = useState(() => new ComposerState());
  useEffect(() => {
    piratetalk.start();
    return piratetalk.observeLocal(own.stores);
  }, [piratetalk, own]);
  const [agent] = useState(() => new AgentToolsState());
  const tools = useMemo(
    () => () => createAgentTools(agentSourceOf(own.stores, own.http)),
    [own],
  );
  useAgentTools(agent, tools);
  const route = useRoute();
  const { phase, reload: reloadCatalog } = useCatalog(own.http, own.cache);
  const reload = useCallback(() => {
    piratetalk.reconnect();
    reloadCatalog();
  }, [piratetalk, reloadCatalog]);
  const adapterState = useAdapterTabs();
  const adapters = adapterState.tabs;
  const kakaoVisible = phase.kind === "loading" || phase.kind === "ready";
  const [last, setLast] = useState<ListMode>({ kind: "all" });
  const mode = modeFor(route, last);
  const roomId = route.kind === "room" ? route.roomId : null;

  useEffect(() => {
    const named = listModeOf(route);
    if (named && !sameMode(named, last)) setLast(named);
  }, [route, last]);

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

  if (mode === null)
    return (
      <div className={styles.shell} data-ui="app" data-route="adapters">
        <Rail
          className={styles.rail}
          stores={own.stores}
          mode={null}
          kakaoVisible={kakaoVisible}
          adapters={adapters}
        />
        <main className={cx(styles.thread, styles.wide)} data-ui="adapters">
          <Suspense fallback={null}>
            <AdapterOutlet
              kakao={kakaoStatusOf(
                phase,
                own.stores.getSnapshot("rooms.order").length,
              )}
              onKakaoRetry={reload}
            />
          </Suspense>
        </main>
      </div>
    );

  if (mode.kind === "kakao" && phase.kind === "failed")
    return (
      <Notice>
        <ConnectionScreen state={phase.state} onRetry={reload} />
      </Notice>
    );
  if (
    mode.kind === "kakao" &&
    (phase.kind === "unreachable" || phase.kind === "over-capacity")
  ) {
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

  if (mode.kind === "all" && nothingConnected(phase.kind, adapterState))
    return (
      <div
        className={styles.shell}
        data-ui="app"
        data-route="no-messenger"
        data-list="all"
      >
        <Rail
          className={styles.rail}
          stores={own.stores}
          mode={mode}
          kakaoVisible={kakaoVisible}
          adapters={adapters}
        />
        <div className={cx(styles.wide, styles.disconnected)}>
          <ListTabs
            mode={mode}
            adapters={adapters}
            kakaoVisible={kakaoVisible}
          />
          <main className={cx(styles.notice, styles.connectionNotice)}>
            <section aria-labelledby="no-messenger-heading">
              <Cat height={48} />
              <h1 id="no-messenger-heading">연결된 메신저가 없습니다</h1>
              <p data-source="kakao">
                {phase.kind === "over-capacity"
                  ? "카카오톡 — 대화 목록이 표시 가능한 범위를 넘었습니다."
                  : "카카오톡 — 코어(kanao·kamado serve)가 응답하지 않습니다."}
              </p>
              {adapters.map(({ id, name, connection }) => (
                <p key={id} data-source={id}>
                  {name} —{" "}
                  {connection.kind === "incompatible"
                    ? "버전이 맞지 않습니다."
                    : connection.kind === "refused"
                      ? connection.code === "UNAUTHORIZED"
                        ? "인증이 필요합니다."
                        : "연결이 거절되었습니다."
                      : "응답하지 않습니다."}
                </p>
              ))}
              {adapterState.index === "unconfigured" ? (
                <p data-source="adapter-index">
                  설정된 어댑터가 없습니다 (SAYA_ADAPTERS).
                </p>
              ) : adapterState.index === "unreachable" ? (
                <p data-source="adapter-index">
                  어댑터 목록 — 응답하지 않습니다.
                </p>
              ) : null}
              <p>연결에서 설정을 확인하세요.</p>
              <button
                type="button"
                onClick={() => {
                  reload();
                  adapterState.retry();
                }}
              >
                {APP_COPY.retry}
              </button>
            </section>
            <a className={styles.noticeLink} href={ADAPTERS_HASH}>
              연결
            </a>
          </main>
        </div>
      </div>
    );

  const back = listHash(mode);
  const tabs = (
    <ListTabs mode={mode} adapters={adapters} kakaoVisible={kakaoVisible} />
  );
  const thread = route.kind === "room" || route.kind === "adapter-room";
  // Settings belong to the app, not to one list: every list head carries them.
  const headActions = (
    <span className={styles.headActions}>
      <ThemeControl />
      <AgentToolsEntry state={agent} />
    </span>
  );
  const list =
    mode.kind === "kakao" ? (
      <RoomsPane
        className={styles.list}
        stores={own.stores}
        activeRoomId={roomId}
        loading={phase.kind === "loading"}
        actions={headActions}
      />
    ) : (
      <Suspense fallback={null}>
        <Inbox
          className={styles.list}
          stores={own.stores}
          mode={mode}
          adapters={adapters}
          kakao={{
            state:
              phase.kind === "ready"
                ? "ready"
                : phase.kind === "loading"
                  ? "loading"
                  : "unavailable",
            onRetry: reload,
          }}
          active={
            route.kind === "room"
              ? { provider: "kakao", roomId: route.roomId }
              : route.kind === "adapter-room"
                ? { provider: route.adapterId, roomId: route.roomId }
                : null
          }
          heading={
            mode.kind === "all"
              ? APP_COPY.all
              : (adapters.find((tab) => tab.id === mode.adapterId)?.name ??
                mode.adapterId)
          }
          actions={headActions}
        />
      </Suspense>
    );

  return (
    <div
      className={styles.shell}
      data-ui="app"
      data-route={thread ? "room" : "rooms"}
      data-list={mode.kind}
    >
      <Rail
        className={styles.rail}
        stores={own.stores}
        mode={mode}
        kakaoVisible={kakaoVisible}
        adapters={adapters}
      />
      {/* The tabs sit above the list, outside its navigation, so the list stays the rooms alone. */}
      <div className={cx(styles.list, styles.listColumn)}>
        {tabs}
        {list}
      </div>
      <main className={styles.thread} data-ui="thread-outlet">
        {route.kind === "room" ? (
          <RoomOutlet
            stores={own.stores}
            windows={own.windows}
            http={own.http}
            roomId={route.roomId}
            backHref={back}
            piratetalk={piratetalk}
            composer={composer}
          />
        ) : route.kind === "adapter-room" ? (
          <Suspense fallback={null}>
            <AdapterOutlet
              key={`${route.adapterId}/${route.roomId}`}
              adapterId={route.adapterId}
              roomId={route.roomId}
              backHref={back}
            />
          </Suspense>
        ) : (
          <EmptyOutlet />
        )}
      </main>
      <AgentActivity state={agent} />
    </div>
  );
}
