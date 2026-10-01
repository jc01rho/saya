import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import {
  type FocusEvent,
  type KeyboardEvent,
  memo,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { roomHash } from "../../app/routes";
import type { components } from "../../contract/decoded";
import type { ClientStores } from "../../core/stores";
import { Cat, cx, RoomRow } from "../../ui";
import { ROOMS_COPY } from "./copy";
import styles from "./RoomsPane.module.css";
import { type RoomFilter, useSlice, useVisibleRoomIds } from "./slices";

type Room = components["schemas"]["Room"];

export interface RoomsPaneProps {
  stores: ClientStores;
  /** The room the route names, as the wire string, or null on the index. */
  activeRoomId: string | null;
  /** True while the catalog request is in flight; the footer cat walks. */
  loading: boolean;
  className?: string | undefined;
  /** A control the shell puts beside the heading, e.g. the settings entry. */
  actions?: ReactNode | undefined;
}

const FILTERS: { value: RoomFilter; label: string; empty: string }[] = [
  { value: "all", label: ROOMS_COPY.all, empty: ROOMS_COPY.emptyAll },
  { value: "unread", label: ROOMS_COPY.unread, empty: ROOMS_COPY.emptyUnread },
  { value: "people", label: ROOMS_COPY.people, empty: ROOMS_COPY.emptyPeople },
  { value: "group", label: ROOMS_COPY.group, empty: ROOMS_COPY.emptyGroup },
];

/** Time labels depend on the day only, so the list ticks once, at local midnight. */
function useToday(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(
      () => setNow(new Date()),
      midnight.getTime() - now.getTime(),
    );
    return () => clearTimeout(timer);
  }, [now]);
  return now;
}

/**
 * One row subscribes to its own slice, so another room's update never reaches
 * it; memo keeps a route change from rerendering every row for the two whose
 * `active` flag moved.
 */
const RoomItem = memo(function RoomItem({
  stores,
  id,
  active,
  now,
  index,
  start,
  list,
  measureElement,
}: {
  stores: ClientStores;
  id: string;
  active: boolean;
  now: Date;
  index?: number;
  start?: number;
  list: RefObject<HTMLUListElement | null>;
  measureElement: (element: HTMLElement | null) => void;
}) {
  const snapshot = useSlice(stores, `room.${id}`);
  const href = roomHash(id);

  // RoomRow deliberately owns its semantic <li>. Measure that real row after
  // it mounts, rather than adding a non-semantic wrapper to the <ul>.
  useLayoutEffect(() => {
    if (index === undefined || start === undefined) return;
    const row = [
      ...(list.current?.querySelectorAll<HTMLElement>('[data-ui="room-row"]') ??
        []),
    ].find(
      (element) => element.querySelector("a")?.getAttribute("href") === href,
    );
    if (!row) return;
    row.dataset.index = String(index);
    row.style.setProperty("--room-virtual-start", `${start}px`);
    measureElement(row);
    return () => {
      measureElement(null);
    };
  }, [href, index, list, measureElement, start]);

  if (!snapshot) return null;
  return (
    <RoomRow
      // The store's rows are deep-frozen; the row only reads them.
      room={snapshot.room as Room}
      href={href}
      active={active}
      preview={snapshot.preview}
      now={now}
    />
  );
});

/**
 * The catalog as its own cream field: brand and filter at the top, rows that
 * scroll independently, the divider continued to the bottom edge, and the cat
 * walking in the footer while connecting. Rows are links inside a nav; the
 * active one is aria-current and breaks the divider.
 */
export function RoomsPane({
  stores,
  activeRoomId,
  loading,
  className,
  actions,
}: RoomsPaneProps) {
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [query, setQuery] = useState("");
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const ids = useVisibleRoomIds(stores, filter, query);
  const connection = useSlice(stores, "connection");
  const now = useToday();
  const group = useId();
  const list = useRef<HTMLUListElement>(null);
  const [focusRequest, setFocusRequest] = useState<string | null>(null);
  const activeIndex = activeRoomId === null ? -1 : ids.indexOf(activeRoomId);
  const focusedIndex = focusedRoomId === null ? -1 : ids.indexOf(focusedRoomId);
  const rangeExtractor = useCallback(
    (range: {
      startIndex: number;
      endIndex: number;
      overscan: number;
      count: number;
    }) => {
      const indexes = defaultRangeExtractor(range);
      if (activeIndex >= 0) indexes.push(activeIndex);
      if (focusedIndex >= 0) indexes.push(focusedIndex);
      return [...new Set(indexes)].sort((left, right) => left - right);
    },
    [activeIndex, focusedIndex],
  );
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLElement>({
    count: ids.length,
    getScrollElement: () =>
      document.querySelector<HTMLDivElement>('[data-ui="room-scroller"]'),
    estimateSize: () => 68,
    getItemKey: (index) => ids[index] ?? `missing-${index}`,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
    rangeExtractor,
  });
  const virtual = ids.length > 100;
  const items = virtual ? virtualizer.getVirtualItems() : [];
  const connecting = loading || connection.status === "connecting";
  // One h1 per view: the brand is the heading on the index, the thread's title takes over in a room.
  const Brand = activeRoomId === null ? "h1" : "p";
  const empty = !loading && ids.length === 0;

  const focusRoom = useCallback((id: string) => {
    setFocusedRoomId(id);
    setFocusRequest(id);
  }, []);
  const onRowFocus = useCallback(
    (event: FocusEvent<HTMLUListElement>) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      const href = event.target.getAttribute("href");
      const id = ids.find((candidate) => roomHash(candidate) === href);
      if (id) setFocusedRoomId(id);
    },
    [ids],
  );
  const onRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLUListElement>) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      const href = event.target.getAttribute("href");
      const current = ids.findIndex(
        (candidate) => roomHash(candidate) === href,
      );
      if (current < 0) return;
      const next =
        event.key === "ArrowDown"
          ? ids[current + 1]
          : event.key === "ArrowUp"
            ? ids[current - 1]
            : event.key === "Home"
              ? ids[0]
              : event.key === "End"
                ? ids.at(-1)
                : undefined;
      if (!next) return;
      event.preventDefault();
      focusRoom(next);
    },
    [focusRoom, ids],
  );
  useLayoutEffect(() => {
    if (!focusRequest) return;
    const link = [
      ...(list.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []),
    ].find(
      (element) => element.getAttribute("href") === roomHash(focusRequest),
    );
    if (!link) return;
    setFocusRequest(null);
    link.focus();
  }, [focusRequest]);

  return (
    <nav
      className={cx(styles.pane, className)}
      aria-label={ROOMS_COPY.nav}
      aria-busy={loading || undefined}
      data-ui="rooms-pane"
      data-filter={filter}
    >
      <div className={styles.head}>
        <div className={styles.headInner}>
          <div className={styles.headTop}>
            {/* The rail carries the mark from 768px; below it the list does. */}
            <span className={styles.mark} lang="ja" aria-hidden="true">
              {[...ROOMS_COPY.brandMark][0]}
            </span>
            <Brand className={styles.brand}>
              {ROOMS_COPY.heading}
              <span className="sr-only">
                {" "}
                · <span lang="ja">{ROOMS_COPY.brandMark}</span>{" "}
                {ROOMS_COPY.brandLatin}
              </span>
            </Brand>
            {actions}
          </div>
          <div className={styles.search}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="6.75" cy="6.75" r="4.75" />
              <path d="M10.25 10.25 13.5 13.5" />
            </svg>
            <input
              aria-label={ROOMS_COPY.search}
              type="search"
              data-ui="room-search"
              placeholder={ROOMS_COPY.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
          </div>
        </div>
        <fieldset className={styles.filter}>
          <legend className="sr-only">{ROOMS_COPY.filter}</legend>
          {FILTERS.map(({ value, label }) => (
            <label key={value} className={styles.chip}>
              <input
                className="sr-only"
                type="radio"
                name={group}
                value={value}
                checked={filter === value}
                onChange={() => setFilter(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>
      <div className={styles.scroller} data-ui="room-scroller">
        {loading ? <p className={styles.status}>{ROOMS_COPY.loading}</p> : null}
        {empty ? (
          <p className={styles.status}>
            {query.trim()
              ? ROOMS_COPY.emptySearch
              : FILTERS.find((option) => option.value === filter)?.empty}
          </p>
        ) : null}
        <ul
          ref={list}
          className={cx(styles.list, virtual && styles.virtualList)}
          data-ui="room-list"
          data-virtualized={virtual || undefined}
          aria-keyshortcuts="ArrowUp ArrowDown Home End"
          onFocusCapture={onRowFocus}
          onKeyDown={onRowKeyDown}
          style={
            virtual ? { height: `${virtualizer.getTotalSize()}px` } : undefined
          }
        >
          {virtual
            ? items.map((item) => {
                const id = ids[item.index];
                if (!id) return null;
                return (
                  <RoomItem
                    key={id}
                    stores={stores}
                    id={id}
                    active={id === activeRoomId}
                    now={now}
                    index={item.index}
                    start={item.start}
                    list={list}
                    measureElement={virtualizer.measureElement}
                  />
                );
              })
            : ids.map((id) => (
                <RoomItem
                  key={id}
                  stores={stores}
                  id={id}
                  active={id === activeRoomId}
                  now={now}
                  list={list}
                  measureElement={virtualizer.measureElement}
                />
              ))}
        </ul>
        <div className={styles.filler} />
      </div>
      {connecting ? (
        <div className={styles.foot}>
          <div className={styles.footInner}>
            <Cat motion="walk" />
          </div>
        </div>
      ) : null}
    </nav>
  );
}
