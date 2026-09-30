import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useState,
} from "react";
import entry from "../digest/DigestEntry.module.css";
import type { AttachmentsTransport } from "./AttachmentsSheet";

const ENTRY_COPY = {
  open: "모아보기",
  unavailable: "모아보기 화면을 불러오지 못했습니다. 다시 눌러 시도하세요.",
} as const;

/** The sheet loads on the first press, never with the shell. */
const loadSheet = () => import("./AttachmentsSheet");

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

export function AttachmentsEntry({
  http,
  roomId,
}: {
  http: AttachmentsTransport;
  roomId: string;
}) {
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
        className={entry.open}
        data-ui="attachments-open"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSheet}
      >
        {ENTRY_COPY.open}
      </button>
      {failed ? (
        <span className={entry.unavailable} role="status">
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
            <Sheet http={http} roomId={roomId} onClose={() => setOpen(false)} />
          </Suspense>
        </SheetBoundary>
      ) : null}
    </>
  );
}
