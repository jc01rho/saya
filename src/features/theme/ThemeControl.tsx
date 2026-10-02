import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  applyTheme,
  hasPlaces,
  readStoredTheme,
  type StoredTheme,
} from "./apply";
import styles from "./ThemeControl.module.css";

// The sheet, the saved themes, the schema and the prompt load on first open;
// the entry keeps only this button and the code that draws the stored choice.
const ThemeSheet = lazy(() => import("./ThemeSheet"));

const OPEN_LABEL = "테마 바꾸기";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function themeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The theme button in the list head and the sheet it opens. The choice lives
 * in localStorage and `public/theme-boot.js` draws it again before the next
 * first paint.
 */
export function ThemeControl() {
  const [stored, setStored] = useState<StoredTheme>(() =>
    readStoredTheme(themeStorage()),
  );
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Draw the choice now and whenever the device switches while it follows the system.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const draw = () =>
      applyTheme(document.documentElement, stored, media.matches);
    draw();
    // The list's pattern, badge and mascot are styled apart from the entry stylesheet.
    if (hasPlaces(stored.images)) void import("./places");
    if (stored.choice !== "system") return;
    media.addEventListener("change", draw);
    return () => media.removeEventListener("change", draw);
  }, [stored]);

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={styles.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        data-ui="theme-open"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 3.75v16.5a8.25 8.25 0 0 0 0-16.5z" />
        </svg>
        <span className="sr-only">{OPEN_LABEL}</span>
      </button>
      {open ? (
        <Suspense fallback={null}>
          <ThemeSheet onChange={setStored} onClose={close} />
        </Suspense>
      ) : null}
    </>
  );
}
