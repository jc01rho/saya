import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useState,
} from "react";
import { cx } from "../../ui";
import styles from "./Attachments.module.css";
import type { AttachmentsTransport } from "./AttachmentsSheet";

const ENTRY_COPY = {
  open: "모아보기",
  unavailable: "모아보기 화면을 불러오지 못했습니다. 다시 눌러 시도하세요.",
} as const;

/** The panel loads on the first press, never with the shell. */
const loadPanel = () => import("./AttachmentsSheet");

class PanelBoundary extends Component<
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

/**
 * The header's icon that opens the room's side panel. The panel itself is
 * drawn by `AttachmentsPanel` beside the conversation, so the two are joined
 * by `aria-controls` rather than by nesting.
 */
export function AttachmentsToggle({
  open,
  controls,
  onToggle,
  className,
}: {
  open: boolean;
  controls: string;
  onToggle: () => void;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      className={className}
      data-ui="attachments-open"
      aria-expanded={open}
      aria-controls={controls}
      title={ENTRY_COPY.open}
      onClick={onToggle}
    >
      <span className="sr-only">{ENTRY_COPY.open}</span>
      <svg viewBox="0 0 18 18" aria-hidden="true">
        <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.6" />
        <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.6" />
        <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.6" />
        <path d="M10 12.75h5.5" />
      </svg>
    </button>
  );
}

/**
 * The side panel's slot. A chunk that fails to load is said here, and the next
 * press of the toggle asks the network again.
 */
export function AttachmentsPanel({
  id,
  http,
  roomId,
  onClose,
  className,
}: {
  id: string;
  http: AttachmentsTransport;
  roomId: string;
  onClose: () => void;
  className?: string | undefined;
}) {
  const [Panel, setPanel] = useState(() => lazy(loadPanel));
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <aside id={id} className={cx(styles.slot, className)}>
        <p className={styles.unavailable} role="status">
          {ENTRY_COPY.unavailable}
        </p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            // React keeps a rejected lazy result; a fresh one asks again.
            setPanel(lazy(loadPanel));
            setFailed(false);
          }}
        >
          {ENTRY_COPY.open}
        </button>
      </aside>
    );
  return (
    <PanelBoundary onError={() => setFailed(true)}>
      <Suspense
        fallback={<aside id={id} className={cx(styles.slot, className)} />}
      >
        <Panel
          key={roomId}
          id={id}
          http={http}
          roomId={roomId}
          onClose={onClose}
          className={className}
        />
      </Suspense>
    </PanelBoundary>
  );
}
