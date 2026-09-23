import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ContextWindows } from "../../core/context";
import type { SendAttempt, SendDraft, SendLedger } from "../../core/send";
import type { ClientStores } from "../../core/stores";
import { Crossing, type CrossingCapture, cx, watchArrival } from "../../ui";
import { PendingList } from "../composer/pending";
import styles from "./ledge.module.css";
import { ThreadPane } from "./ThreadPane";

export const LEDGE_COPY = {
  /** Announced on a link: the read-back row's own word, then what the user did. */
  linked: "보냈습니다 · 확인한 기록과 연결했습니다",
  /** The linked row is not on screen; the reader decides whether to go there. */
  away: "확인한 기록이 화면 밖에 있습니다",
  reveal: "기록 위치로 이동",
  dismiss: "닫기",
} as const;

export interface LedgeProps {
  stores: ClientStores;
  windows: ContextWindows;
  /** The room the route names, as the wire string. */
  roomId: string;
  ledger: SendLedger;
  /** Hands a rejected or unknown attempt's draft back to the composer for a NEW preview and consent. */
  onNewAttempt?: ((draft: SendDraft) => void) | undefined;
  /** What stands pinned under the pending stack: the composer. */
  children?: ReactNode;
  className?: string | undefined;
}

type Root = RefObject<HTMLDivElement | null>;
type Flight = {
  capture: CrossingCapture | null;
  messageId: string;
  sequence: number;
};
type Announcement = { text: string; sequence: number; roomId: string };

function findWall(root: Root) {
  return (
    root.current?.querySelector<HTMLElement>('[data-ui="thread-wall"]') ?? null
  );
}

function findRow(wall: Element, messageId: string) {
  return wall.querySelector<HTMLElement>(
    `[data-message-id="${CSS.escape(messageId)}"] [data-ui="message"]`,
  );
}

/** MessageBubble is meta line, bubble, footer: the bubble is where a flight lands. */
function bubbleOf(row: HTMLElement | null): Element | null {
  return row?.children[1] ?? row;
}

/**
 * Everything below the ledge that belongs to one room: the pending list, the
 * crossing that answers the user's link and the out-of-view indicator. Keyed
 * by room in Ledge, so a room switch unmounts it and takes any flight, watcher
 * and notice with it.
 */
function PendingStack({
  ledger,
  roomId,
  onNewAttempt,
  onAnnounce,
  root,
}: {
  ledger: SendLedger;
  roomId: string;
  onNewAttempt: ((draft: SendDraft) => void) | undefined;
  onAnnounce: (text: string) => void;
  root: Root;
}) {
  const crossing = useRef<Crossing | null>(null);
  const sequence = useRef(0);
  const flown = useRef<Flight | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [away, setAway] = useState<string | null>(null);

  useEffect(() => {
    const instance = new Crossing();
    crossing.current = instance;
    return () => {
      crossing.current = null;
      instance.dispose();
    };
  }, []);

  // Read phase. PendingList calls this in the click, after the ledger recorded
  // the link and before React commits it, so the pending bubble is still there
  // to be measured and copied. The flight and the announcement land in the same
  // commit that removes the pending item: one real DOM change.
  const linked = (attempt: SendAttempt, messageId: string) => {
    const source = root.current?.querySelector<HTMLElement>(
      `[data-attempt-id="${CSS.escape(attempt.uuid)}"]`,
    );
    const bubble = source?.querySelector<HTMLElement>("p") ?? source ?? null;
    const capture =
      bubble && crossing.current ? crossing.current.capture(bubble) : null;
    setFlight({ capture, messageId, sequence: ++sequence.current });
    onAnnounce(LEDGE_COPY.linked);
  };

  // Write phase, after that commit: the destination is read where it now
  // stands, and at most one clone crosses. A destination the reader cannot see
  // gets a notice instead of a flight, and the wall is not scrolled for it.
  useLayoutEffect(() => {
    if (!flight || flown.current === flight) return;
    flown.current = flight;
    const wall = findWall(root);
    const outcome =
      wall && crossing.current
        ? crossing.current.fly(
            flight.capture,
            bubbleOf(findRow(wall, flight.messageId)),
            wall,
          )
        : "skipped";
    if (outcome === "offscreen" || outcome === "unmounted")
      setAway(flight.messageId);
  }, [flight, root]);

  useEffect(() => {
    if (!away) return;
    const wall = findWall(root);
    if (!wall) return;
    return watchArrival(
      wall,
      () => findRow(wall, away),
      () => setAway(null),
    );
  }, [away, root]);

  const reveal = () => {
    const wall = findWall(root);
    if (!wall || !away) return;
    const row = findRow(wall, away);
    // A row virtualized out of the DOM is newer than the send's baseline, so it lives at the tail.
    if (row) row.scrollIntoView({ block: "center" });
    else wall.scrollTop = wall.scrollHeight;
  };

  return (
    <>
      {away ? (
        <p
          className={styles.indicator}
          role="status"
          data-ui="crossing-indicator"
        >
          <span>{LEDGE_COPY.away}</span>
          <button
            type="button"
            className={styles.quiet}
            data-ui="crossing-reveal"
            onClick={reveal}
          >
            {LEDGE_COPY.reveal}
          </button>
          <button
            type="button"
            className={styles.quiet}
            data-ui="crossing-dismiss"
            onClick={() => setAway(null)}
          >
            {LEDGE_COPY.dismiss}
          </button>
        </p>
      ) : null}
      <PendingList
        ledger={ledger}
        roomId={roomId}
        onLinked={linked}
        {...(onNewAttempt ? { onNewAttempt } : {})}
      />
    </>
  );
}

/**
 * The conversation pane: the wall above, THE LEDGE, the ground below. What the
 * bridge has read back sits above the 1px rule; what has only been submitted
 * sits below it; nothing crosses until the user links it to a read-back row,
 * and then one visual clone crosses while the real DOM changes exactly once.
 * The ground is pinned; only its pending sub-stack scrolls, inside 40dvh; the
 * children (the composer) stay reachable.
 */
export function Ledge({
  stores,
  windows,
  roomId,
  ledger,
  onNewAttempt,
  children,
  className,
}: LedgeProps) {
  const root = useRef<HTMLDivElement>(null);
  const spoken = useRef(0);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const announce = (text: string) =>
    setAnnouncement({ text, sequence: ++spoken.current, roomId });
  // The announcement is about the read-back row, so it stands outside the
  // ground, and it belongs to the room it was made in.
  const live = (slot: 0 | 1) =>
    announcement &&
    announcement.roomId === roomId &&
    announcement.sequence % 2 === slot
      ? announcement.text
      : "";
  return (
    <div
      ref={root}
      className={cx(styles.conversation, className)}
      data-ui="ledge-conversation"
    >
      <ThreadPane stores={stores} windows={windows} roomId={roomId} />
      <hr className={styles.ledge} data-ui="ledge" />
      <div className={styles.ground} data-ui="ground">
        <PendingStack
          key={roomId}
          ledger={ledger}
          roomId={roomId}
          onNewAttempt={onNewAttempt}
          onAnnounce={announce}
          root={root}
        />
        <div className={styles.pinned} data-ui="ground-pinned">
          {children}
        </div>
      </div>
      {/* Two alternating live regions, so a second link with the same words is still a change to announce. */}
      <p className="sr-only" role="status" data-ui="crossing-announcement">
        {live(0)}
      </p>
      <p className="sr-only" role="status" data-ui="crossing-announcement">
        {live(1)}
      </p>
    </div>
  );
}
