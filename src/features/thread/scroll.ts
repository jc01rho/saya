import type { Virtualizer } from "@tanstack/react-virtual";

export interface ReadingAnchor {
  id: string;
  offset: number;
}

/** Cooperatively prepare a window; IDs are opaque keys, never numeric offsets. */
export async function indexThreadOrder(
  ids: readonly string[],
  signal: AbortSignal,
): Promise<Map<string, number>> {
  const indexes = new Map<string, number>();
  let started = performance.now();
  for (let index = 0; index < ids.length; index++) {
    if (signal.aborted) return indexes;
    const id = ids[index];
    if (id !== undefined) indexes.set(id, index);
    if ((index + 1) % 64 === 0 || performance.now() - started >= 4) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      started = performance.now();
    }
  }
  return indexes;
}

interface ScrollSource {
  virtualizer: Virtualizer<HTMLElement, HTMLLIElement>;
  indexes: ReadonlyMap<string, number>;
  virtual: boolean;
  /** True while the rendered window still describes a superseded order. */
  stale: boolean;
}

/** The ONLY correction owner. TanStack measures; native and TanStack anchoring are off. */
export class ThreadScroll {
  anchor: ReadingAnchor | null = null;
  /** Following the tail is armed by a user scroll only, never by this owner. */
  mode: "follow-tail" | "reading-anchor" = "reading-anchor";
  generation = 0;
  /** The one-time landing on the newest row when a room opens. */
  private landing = true;
  private lastIndexes: ReadonlyMap<string, number> | null = null;
  private frame = 0;
  private settledFrame = 0;
  /** The offset this owner last wrote; a scroll back to it is its own. */
  private ownTop: number | null = null;
  /** The last scroll offset this owner knows the wall was placed at. */
  private seenTop = 0;
  private userScrolling = false;
  /** A smooth glide this owner started toward the end; it is not corrected mid-flight. */
  private gliding = false;
  /** A row asked to be shown, placed once the settled window has indexed it. */
  private pending: ReadingAnchor | null = null;
  private neighbors: ReadingAnchor[] = [];
  private disposed = false;
  private revision = 0;

  constructor(
    private readonly wall: HTMLElement,
    private readonly list: HTMLOListElement,
    private readonly source: () => ScrollSource,
    private readonly onEvicted: () => void,
  ) {
    wall.style.overflowAnchor = "none";
    wall.addEventListener("wheel", this.intent, { passive: true });
    wall.addEventListener("touchmove", this.intent, { passive: true });
    wall.addEventListener("pointerdown", this.pointer);
    wall.addEventListener("keydown", this.keyboard);
    wall.addEventListener("scroll", this.scroll, { passive: true });
    wall.addEventListener("scrollend", this.scrollEnd);
  }

  private intent = () => {
    this.generation++;
    this.userScrolling = true;
    this.gliding = false;
    this.pending = null;
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.settledFrame);
    this.frame = 0;
  };
  private pointer = (event: PointerEvent) => {
    // Scrollbar dragging is a user scroll; selecting message text is not.
    if (event.target === this.wall) this.intent();
  };
  private keyboard = (event: KeyboardEvent) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    ) {
      this.intent();
    }
  };
  private scrollEnd = () => {
    this.userScrolling = false;
    if (this.gliding) {
      this.gliding = false;
      this.request();
    }
  };

  /**
   * Show one row a third of the way down the wall, or put a reading anchor
   * back where it was. The row becomes the reading anchor, so measurement and
   * widening hold it in place exactly as they hold a row the reader chose.
   */
  reveal(anchor: ReadingAnchor) {
    this.generation++;
    this.gliding = false;
    this.landing = false;
    this.mode = "reading-anchor";
    this.pending = anchor;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.request();
  }

  /** Where a revealed row lands: a third of the way down, above the dock. */
  revealOffset(): number {
    return Math.round(this.wall.clientHeight / 3);
  }

  /** A smooth glide to the newest row; arriving there arms follow-tail like a reader's own scroll. */
  glideToEnd() {
    this.generation++;
    this.pending = null;
    this.landing = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    const top = this.wall.scrollHeight - this.wall.clientHeight;
    if (Math.abs(this.wall.scrollTop - top) < 1) return;
    this.gliding = true;
    this.wall.scrollTo({ top, behavior: "smooth" });
  }
  private scroll = () => {
    // The browser can coalesce or repeat scroll notifications, so a correction
    // is recognised by the offset this owner last wrote, not by one pending
    // flag: a second event for the same position is still this owner's.
    if (
      !this.userScrolling &&
      this.ownTop !== null &&
      Math.abs(this.wall.scrollTop - this.ownTop) < 1
    ) {
      this.seenTop = this.wall.scrollTop;
      return;
    }
    const maximum = this.wall.scrollHeight - this.wall.clientHeight;
    // A shorter viewport or a shorter list pushes the wall back to its end:
    // that is the browser clamping, not a reader choosing a new position, so
    // the anchor still decides where this wall belongs.
    if (
      !this.userScrolling &&
      this.wall.scrollTop < this.seenTop &&
      this.wall.scrollTop >= maximum - 1
    ) {
      this.request();
      return;
    }
    this.seenTop = this.wall.scrollTop;
    this.ownTop = null;
    // Someone other than this owner moved the wall, so the wall is now where
    // the reader is and the one-time landing on the newest row is over.
    this.landing = false;
    const atTail =
      this.wall.scrollHeight - this.wall.clientHeight - this.wall.scrollTop <=
      48;
    // Only the user's own scroll arms follow-tail; a programmatic scroll,
    // including this owner's corrections, never turns it back on. The glide
    // to the end is the reader's own request, made through the button.
    this.mode =
      (this.userScrolling || this.gliding) && atTail
        ? "follow-tail"
        : "reading-anchor";
    this.capture();
    this.publishMode();
    this.request();
  };

  private publishMode() {
    this.wall.dataset.scrollMode = this.landing ? "landing" : this.mode;
    // The user-scroll generation every scheduled correction is fenced by.
    this.wall.dataset.scrollGeneration = String(this.generation);
  }

  /**
   * The reading anchor is the first row the viewport shows, with its offset in
   * it. During a user scroll the mounted window still describes the *previous*
   * scroll position, so a DOM-only reading would anchor on whatever happened to
   * be mounted and drift. The virtualizer's measurements describe every row,
   * mounted or not, in the same coordinate space the rows are laid out from,
   * so they are the source while virtualized.
   */
  capture(keepAnchor = false) {
    const previous = this.anchor;
    const { virtualizer, virtual } = this.source();
    const wallTop = this.wall.getBoundingClientRect().top;
    const scrollTop = this.wall.scrollTop;
    const listOffset =
      this.list.getBoundingClientRect().top - wallTop + scrollTop;
    const measurements = virtualizer.measurementsCache;
    if (virtual && measurements.length > 0) {
      const margin = virtualizer.options.scrollMargin;
      const bottom = scrollTop + this.wall.clientHeight;
      this.neighbors = measurements
        .filter(
          (item) =>
            listOffset + item.end - margin > scrollTop &&
            listOffset + item.start - margin < bottom,
        )
        .map((item) => ({
          id: String(item.key),
          offset: listOffset + item.start - margin - scrollTop,
        }));
    } else {
      const bottom = wallTop + this.wall.clientHeight;
      this.neighbors = [
        ...this.list.querySelectorAll<HTMLElement>("[data-message-id]"),
      ]
        .filter(
          (row) =>
            row.getBoundingClientRect().bottom > wallTop &&
            row.getBoundingClientRect().top < bottom,
        )
        .map((row) => ({
          id: row.dataset.messageId ?? "",
          offset: row.getBoundingClientRect().top - wallTop,
        }));
    }
    // Refreshing after a settled layout keeps the fallback offsets current, so
    // an evicted anchor hands the reading position to a neighbour where that
    // neighbour actually is, not where it stood several relayouts ago.
    this.anchor = keepAnchor ? previous : (this.neighbors[0] ?? this.anchor);
  }

  /** Layout/measurement callbacks coalesce here, fenced by the user's generation. */
  request = () => {
    cancelAnimationFrame(this.settledFrame);
    if (this.disposed || this.frame) return;
    const generation = this.generation;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (generation !== this.generation || this.disposed) return;
      this.restore();
    });
  };

  private restore() {
    const { virtualizer, indexes, virtual, stale } = this.source();
    // Mid-glide the browser owns the offset; correcting it would stop the glide.
    if (this.gliding) return;
    if (this.pending && !stale && indexes.has(this.pending.id)) {
      this.anchor = this.pending;
      this.neighbors = [];
      this.pending = null;
    }
    // A window that widens or trims under a reader who never scrolled ends the
    // landing: from here the reading position is held, not re-pinned to the tail.
    if (this.landing && this.lastIndexes !== indexes) {
      if (this.lastIndexes !== null && this.lastIndexes.size > 0) {
        this.landing = false;
      }
      this.lastIndexes = indexes;
    }
    // Only a settled window can prove a row is gone; a window still being
    // indexed is simply behind, and its absence is never an eviction.
    if (!stale && this.anchor && !indexes.has(this.anchor.id)) {
      this.anchor =
        this.neighbors.find((entry) => indexes.has(entry.id)) ?? null;
      this.onEvicted();
      // No surviving visible row: hold the current pixel range, never jump to tail.
      if (!this.anchor) this.capture();
    }
    const listTop =
      this.list.getBoundingClientRect().top -
      this.wall.getBoundingClientRect().top +
      this.wall.scrollTop;
    let target = this.wall.scrollTop;
    if (this.landing || this.mode === "follow-tail") {
      target = this.wall.scrollHeight - this.wall.clientHeight;
    } else if (this.anchor) {
      // The anchor row is pinned into the rendered range, so its own laid-out
      // box is the truth: it already reflects this frame's measurements, a font
      // swap, a reflowed 100k-character body and a changed viewport width. The
      // measurement cache is only consulted when the row is genuinely absent.
      const row = this.list.querySelector<HTMLElement>(
        `[data-message-id="${CSS.escape(this.anchor.id)}"]`,
      );
      const index = indexes.get(this.anchor.id);
      const item =
        index === undefined ? undefined : virtualizer.measurementsCache[index];
      if (row) {
        target +=
          row.getBoundingClientRect().top -
          this.wall.getBoundingClientRect().top -
          this.anchor.offset;
      } else if (virtual && item) {
        target =
          listTop +
          item.start -
          virtualizer.options.scrollMargin -
          this.anchor.offset;
      }
    }
    target = Math.max(
      0,
      Math.min(target, this.wall.scrollHeight - this.wall.clientHeight),
    );
    if (Math.abs(this.wall.scrollTop - target) > 0.5) {
      this.wall.scrollTop = target;
      this.ownTop = this.wall.scrollTop;
      this.seenTop = this.wall.scrollTop;
      this.request();
      return;
    }
    this.ownTop = this.wall.scrollTop;
    this.seenTop = this.wall.scrollTop;
    if (!this.anchor || this.landing || this.mode === "follow-tail") {
      this.capture();
    } // While an order is still being indexed, rows whose record already left the
    // window render as placeholders, so that layout is not a reading position.
    else if (!stale) this.capture(true);
    this.publishMode();
    // A ResizeObserver delivery after this layout can invalidate completion.
    // Publish only after a layout cycle without another measurement/correction.
    this.settledFrame = requestAnimationFrame(() => {
      this.wall.dataset.anchorRevision = String(++this.revision);
      this.wall.dispatchEvent(
        new CustomEvent("thread-anchor-restored", {
          detail: {
            generation: this.generation,
            anchor: this.anchor,
            mode: this.mode,
          },
        }),
      );
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.settledFrame);
    this.wall.removeEventListener("wheel", this.intent);
    this.wall.removeEventListener("touchmove", this.intent);
    this.wall.removeEventListener("pointerdown", this.pointer);
    this.wall.removeEventListener("keydown", this.keyboard);
    this.wall.removeEventListener("scroll", this.scroll);
    this.wall.removeEventListener("scrollend", this.scrollEnd);
  }
}
