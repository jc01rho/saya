import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { AdapterTab } from "../../app/adapterTabs";
import { adapterRoomHash, roomHash } from "../../app/routes";
import type { ClientStores, Immutable, RoomSnapshot } from "../../core/stores";
import {
  type AdapterProblem,
  type AdapterRoom,
  fetchCapabilities,
  fetchRooms,
  streamAdapter,
} from "../../transport/adapters";
import { cx, formatTime, RoomAvatar, UnreadBadge, unreadName } from "../../ui";
import { problemSentence } from "../adapters/copy";
import { rememberRooms } from "../adapters/rooms";
import styles from "./Inbox.module.css";

const COPY = {
  nav: "대화 목록",
  search: "대화방 이름 검색",
  searchPlaceholder: "대화방 검색",
  kakao: "카카오",
  kakaoLoading: "카카오 대화 목록을 불러오는 중입니다.",
  kakaoUnavailable: "카카오 대화 목록을 불러오지 못했습니다.",
  retry: "다시 확인",
  adapterLoading: (name: string) => `${name} 방 목록을 불러오는 중입니다.`,
  adapterProblem: (name: string, sentence: string) =>
    `${name} 방 목록을 불러오지 못했습니다. ${sentence}`,
  empty: "표시할 방이 없습니다.",
  emptySearch: "불러온 대화방 이름 중에 맞는 것이 없습니다.",
  noText: "텍스트 없는 메시지",
  me: "나: ",
  adapterUnread: (count: number) =>
    `안 읽음 ${count.toLocaleString("ko-KR")}개`,
  from: (name: string) => `${name} 대화`,
} as const;

const PREVIEW = 200;

export type InboxMode =
  | { kind: "all" }
  | { kind: "adapter"; adapterId: string };

export interface InboxProps {
  stores: ClientStores;
  mode: InboxMode;
  adapters: AdapterTab[];
  /** The KakaoTalk catalog as the app holds it; only the all list shows it. */
  kakao: { state: "loading" | "ready" | "unavailable"; onRetry: () => void };
  /** The room the route names, keyed by provider, or null. */
  active: { provider: string; roomId: string } | null;
  heading: string;
  className?: string | undefined;
}

type Row = {
  key: string;
  provider: string;
  providerName: string;
  /** The letter on the row's badge: K for KakaoTalk, as the rail draws it. */
  mark: string;
  title: string;
  at: string | null;
  preview: string | null;
  unread: number;
  unreadLabel: string;
  href: string;
  images?: RoomSnapshot["room"]["images"];
};

/** Re-renders on any change to the catalog order or to one of its rooms. */
function useKakaoSnapshots(
  stores: ClientStores,
  enabled: boolean,
): Immutable<RoomSnapshot>[] {
  const version = useRef(0);
  const [subscribe] = useState(() => (listener: () => void) => {
    let rooms: (() => void)[] = [];
    const changed = () => {
      version.current += 1;
      listener();
    };
    const watch = () => {
      for (const unsubscribe of rooms) unsubscribe();
      rooms = stores
        .getSnapshot("rooms.order")
        .map((id) => stores.subscribe(`room.${id}`, changed));
    };
    const order = stores.subscribe("rooms.order", () => {
      watch();
      changed();
    });
    watch();
    return () => {
      order();
      for (const unsubscribe of rooms) unsubscribe();
    };
  });
  const cache = useRef<{
    version: number;
    enabled: boolean;
    value: Immutable<RoomSnapshot>[];
  }>({ version: -1, enabled, value: [] });
  const read = useCallback(() => {
    const held = cache.current;
    if (held.version === version.current && held.enabled === enabled)
      return held.value;
    const value = enabled
      ? stores.getSnapshot("rooms.order").flatMap((id) => {
          const snapshot = stores.getSnapshot(`room.${id}`);
          return snapshot ? [snapshot] : [];
        })
      : [];
    cache.current = { version: version.current, enabled, value };
    return value;
  }, [stores, enabled]);
  return useSyncExternalStore(subscribe, read, read);
}

type AdapterRooms =
  | { state: "loading" }
  | { state: "ready"; rooms: AdapterRoom[] }
  | { state: "problem"; problem: AdapterProblem };

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Each adapter's rooms, kept current: a live message moves its room up and
 * becomes its preview at once, and the list is asked again shortly after so
 * the unread count stays the messenger's own.
 */
function useAdapterRooms(ids: string[]): Map<string, AdapterRooms> {
  const [rooms, setRooms] = useState(() => new Map<string, AdapterRooms>());
  const key = ids.join(",");
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const set = (id: string, value: AdapterRooms) =>
      setRooms((current) => new Map(current).set(id, value));
    for (const id of key ? key.split(",") : []) {
      set(id, { state: "loading" });
      let refresh: ReturnType<typeof setTimeout> | undefined;
      const load = () =>
        fetchRooms(id, signal).then(
          (result) => {
            if (result.kind === "ok") rememberRooms(id, result.data.rooms);
            set(
              id,
              result.kind === "ok"
                ? { state: "ready", rooms: result.data.rooms }
                : { state: "problem", problem: result },
            );
          },
          () => {
            // Only an abort rejects.
          },
        );
      signal.addEventListener("abort", () => clearTimeout(refresh), {
        once: true,
      });
      void (async () => {
        // An adapter outside this client's contract range is drawn from nothing.
        const declared = await fetchCapabilities(id, signal).catch(() => null);
        if (signal.aborted) return;
        if (declared?.kind === "incompatible") {
          set(id, { state: "problem", problem: declared });
          return;
        }
        void load();
        let failures = 0;
        while (!signal.aborted) {
          const end = await streamAdapter(id, {
            since: {},
            signal,
            onEvent(event) {
              if (event.type === "ready") failures = 0;
              if (event.type !== "message") return;
              const { message } = event.data;
              setRooms((current) => {
                const entry = current.get(id);
                if (entry?.state !== "ready") return current;
                const next = entry.rooms.map((room) =>
                  room.id === message.roomId
                    ? {
                        ...room,
                        lastActivityAt: message.sentAt,
                        lastMessage: {
                          text: [...message.text].slice(0, PREVIEW).join(""),
                          fromMe: message.fromMe,
                        },
                      }
                    : room,
                );
                return new Map(current).set(id, {
                  state: "ready",
                  rooms: next,
                });
              });
              clearTimeout(refresh);
              refresh = setTimeout(load, 3000);
            },
          });
          if (end.kind === "aborted" || signal.aborted) return;
          failures += 1;
          await pause(
            Math.min(30_000, 1000 * 2 ** Math.min(failures, 5)),
            signal,
          );
        }
      })();
    }
    return () => controller.abort();
  }, [key]);
  return rooms;
}

function sortRows(rows: Row[]): Row[] {
  const time = (row: Row) => (row.at ? Date.parse(row.at) : Number.NaN);
  return rows.sort((a, b) => {
    const left = time(a);
    const right = time(b);
    if (Number.isNaN(left) !== Number.isNaN(right))
      return Number.isNaN(left) ? 1 : -1;
    if (!Number.isNaN(left) && left !== right) return right - left;
    return a.title.localeCompare(b.title, "ko-KR");
  });
}

function initial(name: string): string {
  return [...name][0]?.toLocaleUpperCase("ko-KR") ?? "?";
}

function InboxRow({
  row,
  active,
  now,
}: {
  row: Row;
  active: boolean;
  now: Date;
}) {
  const time = formatTime(row.at, now);
  return (
    <li
      className={cx(styles.row, active && styles.active)}
      data-ui="inbox-row"
      data-provider={row.provider}
    >
      <a
        className={styles.link}
        href={row.href}
        aria-current={active ? "page" : undefined}
      >
        <span className={styles.avatar}>
          <RoomAvatar name={row.title} size={48} images={row.images} />
          <span
            className={styles.provider}
            role="img"
            aria-label={COPY.from(row.providerName)}
          >
            {row.mark}
          </span>
        </span>
        <span className={styles.body}>
          <span className={styles.top}>
            <span className={styles.title}>{row.title}</span>
            {row.at ? (
              <time className={styles.time} dateTime={time.dateTime ?? ""}>
                {time.label}
              </time>
            ) : null}
          </span>
          <span className={styles.bottom}>
            <span className={styles.preview}>{row.preview}</span>
            {row.unread > 0 ? (
              <span className={styles.badge}>
                <UnreadBadge count={row.unread} />
                <span className="sr-only">{row.unreadLabel}</span>
              </span>
            ) : null}
          </span>
        </span>
      </a>
    </li>
  );
}

/**
 * One list over several messengers, newest activity first: KakaoTalk rooms
 * from the catalog this tab holds, and each adapter's rooms as it declares
 * them. A messenger that cannot answer says so in one line and leaves the
 * others standing.
 */
export default function Inbox({
  stores,
  mode,
  adapters,
  kakao,
  active,
  heading,
  className,
}: InboxProps) {
  const [query, setQuery] = useState("");
  const all = mode.kind === "all";
  const kakaoRooms = useKakaoSnapshots(stores, all && kakao.state === "ready");
  const shown = useMemo(
    () =>
      all
        ? adapters
        : adapters.filter(
            (tab) => mode.kind === "adapter" && tab.id === mode.adapterId,
          ),
    [all, adapters, mode],
  );
  const adapterIds = useMemo(
    () =>
      mode.kind === "adapter" ? [mode.adapterId] : shown.map((tab) => tab.id),
    [mode, shown],
  );
  const adapterRooms = useAdapterRooms(adapterIds);
  const nameOf = (id: string) =>
    adapters.find((tab) => tab.id === id)?.name ?? id;

  const rows = useMemo(() => {
    const list: Row[] = kakaoRooms.map(({ room, preview }) => ({
      key: `kakao:${room.id}`,
      provider: "kakao",
      providerName: COPY.kakao,
      mark: "K",
      title: room.title,
      at: room.lastActivityAt,
      preview,
      unread: room.unread,
      unreadLabel: unreadName(room.unread),
      href: roomHash(room.id),
      images: room.images,
    }));
    for (const id of adapterIds) {
      const entry = adapterRooms.get(id);
      if (entry?.state !== "ready") continue;
      const providerName = adapters.find((tab) => tab.id === id)?.name ?? id;
      for (const room of entry.rooms)
        list.push({
          key: `${id}:${room.id}`,
          provider: id,
          providerName,
          mark: initial(providerName),
          title: room.title,
          at: room.lastActivityAt ?? null,
          preview: room.lastMessage
            ? (room.lastMessage.fromMe ? COPY.me : "") +
              (room.lastMessage.text || COPY.noText)
            : null,
          unread: room.unread,
          unreadLabel: COPY.adapterUnread(room.unread),
          href: adapterRoomHash(id, room.id),
        });
    }
    return sortRows(list);
  }, [kakaoRooms, adapterIds, adapterRooms, adapters]);

  const words = query.trim().toLocaleLowerCase("ko-KR");
  const visible = words
    ? rows.filter((row) => row.title.toLocaleLowerCase("ko-KR").includes(words))
    : rows;
  const now = new Date();
  const lines: ReactNode[] = [];
  if (all && kakao.state === "loading")
    lines.push(<p key="kakao">{COPY.kakaoLoading}</p>);
  if (all && kakao.state === "unavailable")
    lines.push(
      <p key="kakao">
        {COPY.kakaoUnavailable}{" "}
        <button type="button" onClick={kakao.onRetry}>
          {COPY.retry}
        </button>
      </p>,
    );
  for (const id of adapterIds) {
    const entry = adapterRooms.get(id);
    if (!entry || entry.state === "loading")
      lines.push(<p key={id}>{COPY.adapterLoading(nameOf(id))}</p>);
    else if (entry.state === "problem")
      lines.push(
        <p key={id}>
          {COPY.adapterProblem(nameOf(id), problemSentence(entry.problem))}
        </p>,
      );
  }

  return (
    <nav
      className={cx(styles.pane, className)}
      aria-label={COPY.nav}
      data-ui="inbox"
      data-mode={mode.kind}
    >
      <div className={styles.head}>
        <h1 className={styles.heading}>{heading}</h1>
        <div className={styles.search}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="6.75" cy="6.75" r="4.75" />
            <path d="M10.25 10.25 13.5 13.5" />
          </svg>
          <input
            aria-label={COPY.search}
            type="search"
            placeholder={COPY.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
      </div>
      <div className={styles.scroller}>
        {lines.length ? <div className={styles.lines}>{lines}</div> : null}
        {visible.length ? (
          <ul className={styles.list}>
            {visible.map((row) => (
              <InboxRow
                key={row.key}
                row={row}
                now={now}
                active={
                  active !== null &&
                  active.provider === row.provider &&
                  row.key === `${active.provider}:${active.roomId}`
                }
              />
            ))}
          </ul>
        ) : lines.length ? null : (
          <p className={styles.empty}>
            {words ? COPY.emptySearch : COPY.empty}
          </p>
        )}
      </div>
    </nav>
  );
}
