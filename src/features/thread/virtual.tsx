import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import {
  type MutableRefObject,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { indexThreadOrder, ThreadScroll } from "./scroll";
import styles from "./ThreadPane.module.css";

/** Up to this many turns the wall is plain semantic DOM, as the design asks. */
const SEMANTIC_LIMIT = 200;
const EMPTY_INDEX: ReadonlyMap<string, number> = new Map();
const VIRTUAL_COPY = {
  evicted:
    "읽던 메시지가 표시 범위를 벗어났습니다. 남아 있는 대화 위치를 유지합니다.",
} as const;

/** A render pass that has a viewport. Server markup keeps every turn. */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * The thread's row list: semantic markup up to 200 turns, a measured virtual
 * window beyond it, and one scroll owner (ThreadScroll) for both. Rows keep
 * their message id as the key, so recycling never renumbers a conversation.
 */
export function VirtualThreadTurns({
  order,
  renderRow,
  initializing = false,
  scrollRef,
}: {
  order: readonly string[];
  renderRow: (id: string) => ReactNode;
  /** Stream/cache rows may precede the room's first complete context window. */
  initializing?: boolean;
  /** The wall's scroll owner, for controls outside the list that move the wall. */
  scrollRef?: MutableRefObject<ThreadScroll | null> | undefined;
}) {
  const list = useRef<HTMLOListElement>(null);
  const controller = useRef<ThreadScroll | null>(null);
  const [prepared, setPrepared] = useState<{
    ids: readonly string[];
    indexes: ReadonlyMap<string, number>;
  }>({ ids: [], indexes: EMPTY_INDEX });
  const [evicted, setEvicted] = useState(false);
  const [margin, setMargin] = useState(0);
  const client = useSyncExternalStore(subscribeNever, onClient, onServer);
  // A semantic window is small enough to index inside one frame; only a larger
  // one is handed to the cooperative indexer.
  const semantic = order.length <= SEMANTIC_LIMIT;
  const semanticIndexes = useMemo(
    () =>
      semantic
        ? new Map(order.map((id, index) => [id, index] as const))
        : EMPTY_INDEX,
    [order, semantic],
  );
  // Crossing into the virtual window waits for its index. Until then the wall
  // keeps showing the window it already has, so no reader loses their place to
  // an empty list, and the anchor survives the crossing.
  const held = useRef<{
    ids: readonly string[];
    indexes: ReadonlyMap<string, number>;
  }>({ ids: [], indexes: EMPTY_INDEX });
  const rendered = semantic
    ? { ids: order, indexes: semanticIndexes }
    : prepared.ids.length > 0
      ? prepared
      : held.current;
  const ids = client ? rendered.ids : order;
  const virtual = client && rendered.ids.length > SEMANTIC_LIMIT;
  const stale = rendered.ids !== order;
  const state = useRef({ rendered, virtual, stale, initializing });
  state.current = { rendered, virtual, stale, initializing };
  const virtualizer = useVirtualizer<HTMLElement, HTMLLIElement>({
    count: rendered.ids.length,
    enabled: virtual,
    getScrollElement: () => list.current?.parentElement ?? null,
    getItemKey: (index) => rendered.ids[index] ?? `missing-${index}`,
    estimateSize: () => 140,
    overscan: 6,
    // The same 2px the semantic list keeps between turns (r4).
    gap: 2,
    scrollMargin: margin,
    measureElement: (element) => {
      controller.current?.request();
      return element.getBoundingClientRect().height;
    },
    onChange: () => controller.current?.request(),
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      // The reading anchor stays mounted, so its own box can be measured even
      // when the user has read far away from it.
      const anchor = controller.current?.anchor;
      const index = anchor ? rendered.indexes.get(anchor.id) : undefined;
      if (index !== undefined && !indexes.includes(index)) {
        indexes.push(index);
      }
      return indexes.sort((a, b) => a - b);
    },
  });
  // Measurement must never apply the same delta as ThreadScroll.
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = () => false;

  useEffect(() => {
    if (semantic) return;
    const abort = new AbortController();
    // Yields every 64 records or ~4ms: a 1000-row window never blocks a frame.
    void indexThreadOrder(order, abort.signal).then((indexes) => {
      if (!abort.signal.aborted) setPrepared({ ids: order, indexes });
    });
    return () => abort.abort();
  }, [order, semantic]);

  useLayoutEffect(() => {
    const element = list.current;
    const wall = element?.parentElement;
    if (!element || !wall) return;
    const scroll = new ThreadScroll(
      wall,
      element,
      () => ({
        virtualizer,
        indexes: state.current.rendered.indexes,
        virtual: state.current.virtual,
        stale: state.current.stale,
        initializing: state.current.initializing,
      }),
      () => setEvicted(true),
    );
    controller.current = scroll;
    if (scrollRef) scrollRef.current = scroll;
    const geometry = () => {
      // Heights are invalidated per row, not globally: every mounted row is
      // re-measured by its own ResizeObserver on a width, theme or font change,
      // and a row outside the window is re-measured when it mounts again.
      // Resetting the whole cache would collapse the scrolled space and throw
      // the reading position away, which is the one thing this owner protects.
      setMargin(
        element.getBoundingClientRect().top -
          wall.getBoundingClientRect().top +
          wall.scrollTop,
      );
      scroll.request();
    };
    const resize = new ResizeObserver(geometry);
    resize.observe(wall);
    resize.observe(element);
    // A font swap changes every line box; the mounted rows report it through
    // the same per-row measurement, and the anchor is corrected once for it.
    document.fonts.addEventListener("loadingdone", geometry);
    geometry();
    return () => {
      controller.current = null;
      if (scrollRef?.current === scroll) scrollRef.current = null;
      scroll.dispose();
      resize.disconnect();
      document.fonts.removeEventListener("loadingdone", geometry);
    };
  }, [virtualizer, scrollRef]);

  useLayoutEffect(() => {
    held.current = rendered;
    // Every committed order, measurement and viewport revision uses the same owner.
    controller.current?.request();
  });

  const items = virtual ? virtualizer.getVirtualItems() : [];
  return (
    <>
      {evicted ? (
        <p
          role="status"
          data-ui="thread-anchor-evicted"
          className={styles.note}
        >
          {VIRTUAL_COPY.evicted}
        </p>
      ) : null}
      <ol
        ref={list}
        className={styles.turns}
        data-ui="thread-turns"
        data-virtualized={virtual || undefined}
        data-order-count={ids.length}
        style={
          virtual
            ? {
                display: "block",
                position: "relative",
                height: virtualizer.getTotalSize(),
                overflowAnchor: "none",
              }
            : undefined
        }
      >
        {virtual
          ? items.map((item) => {
              const id = rendered.ids[item.index];
              if (id === undefined) return null;
              return (
                <li
                  key={id}
                  ref={virtualizer.measureElement}
                  data-index={item.index}
                  data-message-id={id}
                  className={styles.turn}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${item.start - margin}px)`,
                  }}
                >
                  {renderRow(id)}
                </li>
              );
            })
          : ids.map((id) => (
              <li key={id} data-message-id={id} className={styles.turn}>
                {renderRow(id)}
              </li>
            ))}
      </ol>
    </>
  );
}
