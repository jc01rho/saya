import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { HistorySource } from "../history/source";
import { useRead } from "../reads";
import { dayKey, pickYearAgo } from "./pick";
import { browserStorage, isClosed, loadClosed, rememberClosed } from "./store";

/** The card and its stylesheet load only for a room that has a day to show. */
const Card = lazy(() => import("./YearAgoCard"));

/** A card chunk that fails to load draws nothing: it is a keepsake, not the conversation. */
class QuietBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * 작년 오늘: what this room held on the same day a year ago, above the wall,
 * when the room's newest window reaches that far. Nothing is drawn while the
 * window is read, when it holds nothing from that day, when it is refused, or
 * after the card was closed on this calendar day in this browser.
 */
export function YearAgo({
  history,
  roomId,
}: {
  history: HistorySource;
  roomId: string;
}) {
  const [now] = useState(() => new Date());
  const run = useCallback(() => history.read(roomId), [history, roomId]);
  const [state] = useRead(roomId, run);
  const found = useMemo(
    () =>
      state.phase === "ready" && state.data.room.id === roomId
        ? pickYearAgo(state.data.messages, now)
        : null,
    [state, roomId, now],
  );
  const today = dayKey(now);
  const [closed, setClosed] = useState(() => loadClosed(browserStorage()));
  if (!found || isClosed(closed, roomId, today)) return null;
  return (
    <QuietBoundary>
      <Suspense fallback={null}>
        <Card
          key={roomId}
          found={found}
          now={now}
          onClose={() =>
            setClosed(rememberClosed(browserStorage(), closed, roomId, today))
          }
        />
      </Suspense>
    </QuietBoundary>
  );
}
