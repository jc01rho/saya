import { useMemo, useSyncExternalStore } from "react";
import type { ClientStores } from "../core/stores";
import { adapterMark, cx, UnreadBadge } from "../ui";
import type { AdapterTab } from "./adapterTabs";
import styles from "./Rail.module.css";
import {
  ADAPTERS_HASH,
  ALL_HASH,
  adapterListHash,
  type ListMode,
  ROOMS_HASH,
} from "./routes";

const RAIL_COPY = {
  nav: "메뉴",
  brand: "さや (saya)",
  all: "전체",
  kakao: "카카오",
  adapters: "연결",
  unread: (count: number) =>
    `데스크톱 기준 안 읽음 ${count.toLocaleString("ko-KR")}개`,
  adapterUnread: (name: string, count: number) =>
    `${name} 기준 안 읽음 ${count.toLocaleString("ko-KR")}개`,
} as const;

/**
 * The sum of the desktop's unread counts over the catalog. It is the desktop's
 * number, never one this client lowers (G2), so it moves only with `/rooms`.
 */
function createTotalUnread(stores: ClientStores) {
  const compute = () =>
    stores
      .getSnapshot("rooms.order")
      .reduce(
        (sum, id) => sum + (stores.getSnapshot(`room.${id}`)?.room.unread ?? 0),
        0,
      );
  const subscribe = (listener: () => void) => {
    let rooms: (() => void)[] = [];
    const watch = () => {
      for (const unsubscribe of rooms) unsubscribe();
      rooms = stores
        .getSnapshot("rooms.order")
        .map((id) => stores.subscribe(`room.${id}`, listener));
    };
    const order = stores.subscribe("rooms.order", () => {
      watch();
      listener();
    });
    watch();
    return () => {
      order();
      for (const unsubscribe of rooms) unsubscribe();
    };
  };
  return { subscribe, compute };
}

function useTotalUnread(stores: ClientStores): number {
  const source = useMemo(() => createTotalUnread(stores), [stores]);
  return useSyncExternalStore(source.subscribe, source.compute, source.compute);
}

/** A messenger's mark in an outlined squircle; no messenger artwork is drawn. */
function Mark({ text }: { text: string }) {
  return (
    <span className={styles.mark} aria-hidden="true">
      {text}
    </span>
  );
}

/**
 * The left rail of the messenger arrangement: the mark, then 전체 (every
 * messenger, newest first), 카카오 (the KakaoTalk core), one item per adapter
 * the proxy fronts, and 연결. Nothing here claims a connection state.
 */
export function Rail({
  stores,
  mode,
  adapters,
  className,
}: {
  stores: ClientStores;
  /** The list on screen, or null on the connections view. */
  mode: ListMode | null;
  adapters: AdapterTab[];
  className?: string | undefined;
}) {
  const unread = useTotalUnread(stores);
  return (
    <nav
      className={cx(styles.rail, className)}
      aria-label={RAIL_COPY.nav}
      data-ui="rail"
    >
      <span className={styles.brand} role="img" aria-label={RAIL_COPY.brand}>
        <span lang="ja" aria-hidden="true">
          さ
        </span>
      </span>
      <a
        className={styles.item}
        href={ALL_HASH}
        aria-current={mode?.kind === "all" || undefined}
        data-ui="rail-all"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h9A1.5 1.5 0 0 1 16 6.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3h0A1.5 1.5 0 0 1 4 12.5z" />
          <path d="M19 9.5h.5A1.5 1.5 0 0 1 21 11v6a1.5 1.5 0 0 1-1.5 1.5H19v2.5l-3-2.5h-4.5A1.5 1.5 0 0 1 10 17v-1" />
        </svg>
        <span className={styles.label}>{RAIL_COPY.all}</span>
      </a>
      <a
        className={styles.item}
        href={ROOMS_HASH}
        aria-current={mode?.kind === "kakao" || undefined}
        data-ui="rail-kakao"
      >
        <Mark text="K" />
        <span className={styles.label}>{RAIL_COPY.kakao}</span>
        {unread > 0 ? (
          <span className={styles.badge}>
            <UnreadBadge count={unread} />
            <span className="sr-only">{RAIL_COPY.unread(unread)}</span>
          </span>
        ) : null}
      </a>
      {adapters.map((tab) => (
        <a
          key={tab.id}
          className={styles.item}
          href={adapterListHash(tab.id)}
          aria-current={
            (mode?.kind === "adapter" && mode.adapterId === tab.id) || undefined
          }
          data-ui="rail-adapter"
        >
          <Mark text={adapterMark(tab.id, tab.name)} />
          <span className={styles.label}>{tab.name}</span>
          {tab.unread ? (
            <span className={styles.badge}>
              <UnreadBadge count={tab.unread} />
              <span className="sr-only">
                {RAIL_COPY.adapterUnread(tab.name, tab.unread)}
              </span>
            </span>
          ) : null}
        </a>
      ))}
      <a
        className={styles.item}
        href={ADAPTERS_HASH}
        aria-current={mode === null || undefined}
        data-ui="rail-adapters"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.6 1.6" />
          <path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />
        </svg>
        <span className={styles.label}>{RAIL_COPY.adapters}</span>
      </a>
    </nav>
  );
}
