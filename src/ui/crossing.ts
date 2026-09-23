import styles from "./crossing.module.css";
import { cx } from "./cx";

/**
 * The crossing: the one movement with meaning. A pending bubble below the ledge
 * visually becomes the observed row above it once the user has linked them.
 * The two live in different scroll containers, so no node is moved between
 * them; a single visual clone flies in a root overlay while the real DOM has
 * already changed exactly once (the pending item is gone). Motion never owns
 * meaning: under reduced motion, with the destination out of view, or when a
 * room switch interrupts the flight, the state is the same and only the flight
 * is missing.
 */

export interface FlightVector {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
}

/** The translate and scale that carry the start box onto the destination box. */
export function flightVector(
  before: DOMRectReadOnly,
  after: DOMRectReadOnly,
): FlightVector {
  return {
    dx: after.left - before.left,
    dy: after.top - before.top,
    sx: before.width > 0 ? after.width / before.width : 1,
    sy: before.height > 0 ? after.height / before.height : 1,
  };
}

/**
 * A destination is reachable when its vertical middle is inside the viewport
 * that scrolls it: a flight must land on something the reader can see, not on
 * a sliver or on a row below the fold.
 */
export function isWithin(
  rect: DOMRectReadOnly,
  viewport: DOMRectReadOnly,
): boolean {
  const middle = rect.top + rect.height / 2;
  return (
    middle >= viewport.top &&
    middle <= viewport.bottom &&
    rect.right > viewport.left &&
    rect.left < viewport.right
  );
}

export type CrossingOutcome =
  /** One clone is in the air; it removes itself on animationend or cancel. */
  | "flew"
  /** prefers-reduced-motion: the state changed, nothing moved. */
  | "reduced-motion"
  /** The destination is mounted but outside the viewport; no fake flight. */
  | "offscreen"
  /** The destination row is not in the DOM (virtualized away or evicted). */
  | "unmounted"
  /** Nothing was captured before the change, so there is nothing to fly. */
  | "skipped";

export interface CrossingCapture {
  before: DOMRectReadOnly;
  clone: HTMLElement;
  /** The theme the source was drawn in, so the clone's tokens resolve the same way at the root. */
  theme: string | null;
}

const STRIPPED = ["id", "role", "tabindex", "style"];
/** The design's --dur-cross when the tokens are not in the document yet. */
const FALLBACK_DURATION = 300;

/** "300ms" or ".3s" as the tokens declare it, in milliseconds. */
function milliseconds(text: string): number {
  const value = parseFloat(text);
  return text.trim().endsWith("ms") ? value : value * 1000;
}

/** A visual copy only: no ids, no data hooks, no roles, nothing focusable or interactive. */
function sanitize(root: HTMLElement) {
  for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
    for (const { name } of [...element.attributes]) {
      if (
        STRIPPED.includes(name) ||
        name.startsWith("aria-") ||
        name.startsWith("data-")
      )
        element.removeAttribute(name);
    }
    if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    )
      element.disabled = true;
    if (element instanceof HTMLAnchorElement) element.removeAttribute("href");
  }
}

export class Crossing {
  private overlay: HTMLElement | null = null;
  private clone: HTMLElement | null = null;
  private animation: Animation | null = null;

  constructor(private readonly host: HTMLElement = document.body) {}

  static reducedMotion(): boolean {
    return (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /** True while a clone is in the air. */
  get active(): boolean {
    return this.clone !== null;
  }

  /**
   * Read phase, in the same task as the user's action and before the one real
   * DOM change: the source's box and a visual copy of it. Nothing is written.
   */
  capture(source: HTMLElement): CrossingCapture {
    const before = source.getBoundingClientRect();
    const clone = source.cloneNode(true) as HTMLElement;
    sanitize(clone);
    return {
      before,
      clone,
      theme: source.closest<HTMLElement>("[data-theme]")?.dataset.theme ?? null,
    };
  }

  /**
   * Write phase, after the real change has been committed. The destination and
   * its viewport are read together, then the clone is placed and released in
   * one write. At most one clone exists: a flight still in the air yields.
   */
  fly(
    capture: CrossingCapture | null,
    destination: Element | null,
    viewport: Element,
  ): CrossingOutcome {
    if (!destination) return "unmounted";
    // One read batch: both boxes and the motion tokens, from a layout that is already clean.
    const after = destination.getBoundingClientRect();
    const view = viewport.getBoundingClientRect();
    const tokens = getComputedStyle(viewport);
    const duration = milliseconds(tokens.getPropertyValue("--dur-cross"));
    const easing = tokens.getPropertyValue("--ease").trim();
    if (!isWithin(after, view)) return "offscreen";
    if (Crossing.reducedMotion()) return "reduced-motion";
    if (!capture) return "skipped";
    this.cancel();
    const { before, clone } = capture;
    const vector = flightVector(before, after);
    const overlay = this.ensureOverlay(capture.theme);
    clone.className = cx(clone.className, styles.clone);
    clone.dataset.ui = "crossing-clone";
    clone.style.top = `${before.top}px`;
    clone.style.left = `${before.left}px`;
    clone.style.width = `${before.width}px`;
    clone.style.height = `${before.height}px`;
    this.clone = clone;
    overlay.append(clone);
    // Transform and opacity only, so the compositor carries every frame and no
    // layout is written while the clone flies. The Web Animations API is used
    // rather than a CSS animation so the keyframes are not tied to a stylesheet
    // name a bundler may rewrite; the duration and easing are still the tokens.
    const animation = clone.animate(
      [
        { transform: "translate(0px, 0px) scale(1, 1)", opacity: 1 },
        {
          transform: `translate(${vector.dx}px, ${vector.dy}px) scale(${vector.sx}, ${vector.sy})`,
          opacity: 0,
        },
      ],
      {
        duration: Number.isFinite(duration) ? duration : FALLBACK_DURATION,
        easing: easing || "ease",
        fill: "both",
      },
    );
    const done = () => {
      if (this.animation === animation) this.cancel();
    };
    animation.onfinish = done;
    animation.oncancel = done;
    this.animation = animation;
    return "flew";
  }

  /** Ends a flight now: the clone, its animation and its handlers go; the state it decorated stays. */
  cancel(): void {
    const animation = this.animation;
    this.animation = null;
    if (animation) {
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
    }
    this.clone?.remove();
    this.clone = null;
  }

  /** For unmount and room changes: nothing of this crossing remains in the document. */
  dispose(): void {
    this.cancel();
    this.overlay?.remove();
    this.overlay = null;
  }

  private ensureOverlay(theme: string | null): HTMLElement {
    if (!this.overlay) {
      const overlay = document.createElement("div");
      overlay.className = cx(styles.overlay);
      overlay.dataset.ui = "crossing-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("inert", "");
      this.host.append(overlay);
      this.overlay = overlay;
    }
    if (theme) this.overlay.dataset.theme = theme;
    else delete this.overlay.dataset.theme;
    return this.overlay;
  }
}

/**
 * While a linked row is out of view, watch for it to come into the wall's
 * viewport, whether by the reader's own scroll or by the row mounting later in
 * a virtualized window. The wall is never scrolled from here.
 */
export function watchArrival(
  wall: Element,
  find: () => Element | null,
  onArrival: () => void,
): () => void {
  let observed: Element | null = null;
  let intersection: IntersectionObserver | null = null;
  const stop = () => {
    mutations.disconnect();
    intersection?.disconnect();
    intersection = null;
    observed = null;
  };
  const observe = () => {
    const row = find();
    if (row === observed) return;
    intersection?.disconnect();
    observed = row;
    if (!row) return;
    intersection = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          stop();
          onArrival();
        }
      },
      { root: wall, threshold: 0.5 },
    );
    intersection.observe(row);
  };
  const mutations = new MutationObserver(observe);
  mutations.observe(wall, { childList: true, subtree: true });
  observe();
  return stop;
}
