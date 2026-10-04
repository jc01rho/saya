import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import { hasPlaces, readStoredTheme } from "../features/theme/apply";
import { themeStorage } from "../features/theme/ThemeControl";
import { App } from "./App";

// A loading or connection screen can come before any list head mounts ThemeControl.
if (hasPlaces(readStoredTheme(themeStorage()).images))
  void import("../features/theme/places");

// Development showcase: /#/showcase renders every primitive in every state.
// Product hash routes live in App; this check is boot-time only.
const Showcase = lazy(() => import("../ui/showcase/Showcase"));
const showcase = window.location.hash.replace(/\?.*$/, "") === "#/showcase";

const root = document.getElementById("root");
if (!root) throw new Error("Missing app root");

createRoot(root).render(
  <StrictMode>
    {showcase ? (
      <Suspense fallback={null}>
        <Showcase />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
