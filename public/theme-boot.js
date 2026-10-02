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
  // The same test as isVars() in src/features/theme/apply.ts.
  const varsOk = (vars) =>
    Boolean(vars) &&
    typeof vars === "object" &&
    Object.entries(vars).every(
      ([name, value]) =>
        /^--[a-z0-9-]+$/.test(name) &&
        typeof value === "string" &&
        /^[#a-z0-9\s(),.%-]+$/i.test(value) &&
        !/url\s*\(/i.test(value),
    );
  if (choice === "light" || choice === "dark" || choice === "kakao") {
    root.dataset.theme = choice;
  } else if (
    typeof choice === "string" &&
    choice.startsWith("custom:") &&
    choice.length > 7 &&
    varsOk(stored.vars)
  ) {
    root.style.setProperty(
      "color-scheme",
      stored.mode === "dark" ? "dark" : "light",
    );
    for (const [name, value] of Object.entries(stored.vars))
      root.style.setProperty(name, value);
    root.dataset.theme = "custom";
  } else {
    root.dataset.theme = system();
  }
})();
