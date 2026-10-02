// saya: draws the saved theme before the first paint, so a reload never
// flashes the default colours. It is a separate file because the deployment's
// CSP is script-src 'self'. Mirrors applyTheme() in
// src/features/theme/store.ts; tests/theme/boot.test.ts keeps the two equal.
(() => {
  const root = document.documentElement;
  const system = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  let stored = null;
  try {
    stored = JSON.parse(window.localStorage.getItem("saya.theme") || "null");
  } catch {
    stored = null;
  }
  const choice = stored && typeof stored === "object" ? stored.choice : null;
  if (choice === "light" || choice === "dark" || choice === "kakao") {
    root.dataset.theme = choice;
  } else if (
    typeof choice === "string" &&
    choice.startsWith("custom:") &&
    choice.length > 7 &&
    stored.vars &&
    typeof stored.vars === "object"
  ) {
    root.style.setProperty(
      "color-scheme",
      stored.mode === "dark" ? "dark" : "light",
    );
    for (const [name, value] of Object.entries(stored.vars))
      if (name.startsWith("--")) root.style.setProperty(name, String(value));
    root.dataset.theme = "custom";
  } else {
    root.dataset.theme = system();
  }
})();
