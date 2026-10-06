import { useEffect, useState } from "react";
import {
  applyTheme,
  hasPlaces,
  readStoredTheme,
  type StoredTheme,
} from "./apply";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function themeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Draws the stored theme for as long as the app is mounted, and again whenever
 * the device switches while it follows the system. The choice lives in
 * localStorage and `public/theme-boot.js` draws it before the next first
 * paint; this keeps it drawn after that. Returns the setter 설정 calls with
 * what it stored.
 */
export function useAppliedTheme(): (stored: StoredTheme) => void {
  const [stored, setStored] = useState<StoredTheme>(() =>
    readStoredTheme(themeStorage()),
  );
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
  return setStored;
}
