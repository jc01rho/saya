import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useState,
} from "react";
import type { ClientStores } from "../../core/stores";
import { cx } from "../../ui";
import styles from "../digest/DigestEntry.module.css";
import type { HistorySource } from "../history/source";

/** The two strings the always-loaded entry needs; everything else lives in the sheet's chunk. */
const ENTRY_COPY = {
  open: "결산",
  unavailable: "결산 화면을 불러오지 못했습니다. 다시 눌러 시도하세요.",
} as const;

/** The sheet, its stylesheet and the painter load on the first press, never with the shell. */
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
              stores={stores}
              history={history}
              roomId={roomId}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </SheetBoundary>
      ) : null}
    </>
  );
}
