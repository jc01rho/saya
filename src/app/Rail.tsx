import { useMemo, useSyncExternalStore } from "react";
import type { ClientStores } from "../core/stores";
import { cx, UnreadBadge } from "../ui";
import styles from "./Rail.module.css";
import { ROOMS_HASH } from "./routes";

const RAIL_COPY = {
  nav: "메뉴",
  brand: "さや (saya)",
  chats: "대화",
  unread: (count: number) =>
    `데스크톱 기준 안 읽음 ${count.toLocaleString("ko-KR")}개`,
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

/**
 * The left rail of the messenger arrangement: the mark, then the one section
 * this client has. Nothing here claims a connection state — the rail draws no
 * status dot, because no slice reports one yet.
 */
export function Rail({
  stores,
  className,
}: {
  stores: ClientStores;
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
        href={ROOMS_HASH}
        aria-current="true"
        data-ui="rail-chats"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-8.5L6 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" />
        </svg>
        <span className={styles.label}>{RAIL_COPY.chats}</span>
        {unread > 0 ? (
          <span className={styles.badge}>
            <UnreadBadge count={unread} />
            <span className="sr-only">{RAIL_COPY.unread(unread)}</span>
          </span>
        ) : null}
      </a>
    </nav>
  );
}
