import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { THEME_COPY } from "./copy";
import type { ThemeDefinition } from "./schema";
import {
  applyTheme,
  customChoice,
  deleteCustomTheme,
  loadChoice,
  loadCustomThemes,
  saveChoice,
  saveCustomTheme,
  type ThemeChoice,
} from "./store";
import styles from "./ThemeControl.module.css";

// The sheet, the maker and the prompt load on first open; the entry keeps only the button.
const ThemeSheet = lazy(() => import("./ThemeSheet"));

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * The theme button in the list head and the sheet it opens. The choice lives
 * in localStorage and `public/theme-boot.js` draws it again before the next
 * first paint.
 */
export function ThemeControl() {
  const [customs, setCustoms] = useState(() => loadCustomThemes(storage()));
  const [choice, setChoice] = useState<ThemeChoice>(() =>
    loadChoice(storage(), customs),
  );
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Draw the choice now and whenever the device switches while it follows the system.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const stored = saveChoice(storage(), choice, customs);
    const draw = () =>
      applyTheme(document.documentElement, stored, media.matches);
    draw();
    if (stored.choice !== "system") return;
    media.addEventListener("change", draw);
    return () => media.removeEventListener("change", draw);
  }, [choice, customs]);

  const close = useCallback(() => {
    setOpen(false);
    setStatus(null);
    button.current?.focus();
  }, []);

  const save = (theme: ThemeDefinition) => {
    const saved = saveCustomTheme(storage(), customs, theme);
    if (!saved.ok) {
      setStatus(
        saved.reason === "limit" ? THEME_COPY.limit : THEME_COPY.storage,
      );
      return;
    }
    setCustoms(saved.customs);
    setChoice(customChoice(theme));
    setStatus(THEME_COPY.saved(theme.name));
  };

  const remove = (name: string) => {
    setCustoms(deleteCustomTheme(storage(), customs, name));
    if (choice === `custom:${name}`) setChoice("system");
  };

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
        <span className="sr-only">{THEME_COPY.open}</span>
      </button>
      {open ? (
        <Suspense fallback={null}>
          <ThemeSheet
            choice={choice}
            customs={customs}
            status={status}
            onChoose={setChoice}
            onRemove={remove}
            onSave={save}
            onClose={close}
          />
        </Suspense>
      ) : null}
    </>
  );
}
