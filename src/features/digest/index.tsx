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
import styles from "./DigestEntry.module.css";
import type { DigestTransport } from "./requests";

/** The two strings the always-loaded entry needs; everything else lives in the sheet's chunk. */
const ENTRY_COPY = {
  open: "발췌",
  unavailable: "발췌 화면을 불러오지 못했습니다. 다시 눌러 시도하세요.",
} as const;

/** The sheet and everything it needs load on the first press, never with the shell. */
const loadSheet = () => import("./DigestSheet");

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

export interface DigestEntryProps {
  stores: ClientStores;
  http: DigestTransport;
  /** The room the route names, as the wire string. */
  roomId: string;
  className?: string | undefined;
}

/**
 * The room header's way into the digest: one quiet control, and the sheet
 * only while it is open. A chunk that fails to load is said so beside the
 * control and the next press tries again.
 */
export function DigestEntry({
  stores,
  http,
  roomId,
  className,
}: DigestEntryProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [Sheet, setSheet] = useState(() => lazy(loadSheet));

  const openSheet = () => {
    if (failed) {
      // React keeps a rejected lazy result; a fresh one asks the network again.
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
        data-ui="digest-open"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSheet}
      >
        {ENTRY_COPY.open}
      </button>
      {failed ? (
        <span
          className={styles.unavailable}
          role="status"
          data-ui="digest-unavailable"
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
              http={http}
              roomId={roomId}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </SheetBoundary>
      ) : null}
    </>
  );
}
