import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useState,
} from "react";
import type { ClientStores } from "../../core/stores";
import { cx } from "../../ui";
import styles from "../digest/DigestEntry.module.css";
import type { HistorySource } from "../history/source";
import { readFailureCopy, useRead } from "../reads";
import { useSlice } from "../rooms";

/** The strings the always-loaded entry needs; everything else lives in the sheet's chunk. */
const ENTRY_COPY = {
  open: "결산",
  unavailable: "결산 화면을 불러오지 못했습니다. 다시 눌러 시도하세요.",
  untitled: "대화",
} as const;

/**
 * The sheet, its stylesheet and the painter load on the first press, never
 * with the shell. The read and the room title happen here, in the shell's
 * own modules: a lazy chunk that imported `../reads` or `../rooms` would make
 * the bundler split those shared modules into startup chunks of their own.
 */
const loadSheet = () => import("./RecapSheet");

class SheetBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface RecapEntryProps {
  stores: ClientStores;
  history: HistorySource;
  /** The room the route names, as the wire string. */
  roomId: string;
  className?: string | undefined;
}

/**
 * The room header's way into 결산: one quiet control beside 발췌, and the
 * sheet only while it is open. A chunk that fails to load is said so beside
 * the control and the next press tries again.
 */
export function RecapEntry({
  stores,
  history,
  roomId,
  className,
}: RecapEntryProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [Sheet, setSheet] = useState(() => lazy(loadSheet));
  const run = useCallback(() => history.read(roomId), [history, roomId]);
  const [state, retry] = useRead(open ? roomId : null, run);
  const roomSlice = useSlice(stores, `room.${roomId}`);
  const title =
    roomSlice?.room.title ??
    (state.phase === "ready" ? state.data.room.title : null) ??
    ENTRY_COPY.untitled;
  const failureCode =
    state.phase === "failed" ? readFailureCopy(state.failure).code : null;

  const openSheet = () => {
    if (failed) {
      setSheet(lazy(loadSheet));
      setFailed(false);
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={cx(styles.open, className)}
        data-ui="recap-open"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={ENTRY_COPY.open}
        onClick={openSheet}
      >
        <span className="sr-only">{ENTRY_COPY.open}</span>
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <path d="M3 15V8M7.5 15V3M12 15v-5M16.5 15V6" />
        </svg>
      </button>
      {failed ? (
        <span
          className={styles.unavailable}
          role="status"
          data-ui="recap-unavailable"
        >
          {ENTRY_COPY.unavailable}
        </span>
      ) : null}
      {open ? (
        <SheetBoundary
          onError={() => {
            setFailed(true);
            setOpen(false);
          }}
        >
          <Suspense fallback={null}>
            <Sheet
              roomId={roomId}
              title={title}
              state={state}
              failureCode={failureCode}
              onRetry={retry}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </SheetBoundary>
      ) : null}
    </>
  );
}
