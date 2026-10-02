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
  // The same tests as readImages() and imageVars() in src/features/theme/apply.ts.
  const srcOk = (src) =>
    typeof src === "string" &&
    src.length <= 100000 &&
    /^data:image\/(?:png|webp|jpeg|gif);base64,[a-z0-9+/]+={0,2}$/i.test(src);
  const pictures = (images) => {
    if (!images || typeof images !== "object") return null;
    const { wall, mascot } = images;
    if (
      wall !== undefined &&
      !(
        wall &&
        srcOk(wall.src) &&
        (wall.fit === "cover" || wall.fit === "tile") &&
        typeof wall.opacity === "number" &&
        wall.opacity >= 0 &&
        wall.opacity <= 0.4
      )
    )
      return null;
    if (mascot !== undefined && !(mascot && srcOk(mascot.src))) return null;
    return wall || mascot ? { wall, mascot } : null;
  };
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
    const images = pictures(stored.images);
    if (images?.wall) {
      const { src, fit, opacity } = images.wall;
      root.style.setProperty("--theme-wall-image", `url("${src}")`);
      root.style.setProperty(
        "--theme-wall-size",
        fit === "tile" ? "240px" : "cover",
      );
      root.style.setProperty(
        "--theme-wall-repeat",
        fit === "tile" ? "repeat" : "no-repeat",
      );
      root.style.setProperty(
        "--theme-wall-wash",
        `color-mix(in srgb, var(--field-wall) ${Math.round((1 - opacity) * 100)}%, transparent)`,
      );
    }
    if (images?.mascot) {
      root.style.setProperty("--theme-mascot", `url("${images.mascot.src}")`);
      root.dataset.themeMascot = "";
    }
    root.dataset.theme = "custom";
  } else {
    root.dataset.theme = system();
  }
})();
