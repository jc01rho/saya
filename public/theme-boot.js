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
  const layerOk = (layer) =>
    layer === undefined ||
    Boolean(
      layer &&
        srcOk(layer.src) &&
        (layer.fit === "cover" || layer.fit === "tile") &&
        typeof layer.opacity === "number" &&
        layer.opacity >= 0 &&
        layer.opacity <= 0.4,
    );
  const stickerOk = (sticker) =>
    sticker === undefined || Boolean(sticker && srcOk(sticker.src));
  const loaderOk = (loader) =>
    loader === undefined ||
    Boolean(
      loader &&
        srcOk(loader.src) &&
        (loader.motion === "dance" || loader.motion === "none"),
    );
  const pictures = (images) => {
    if (!images || typeof images !== "object") return null;
    const { wall, list, mascot, badge, loader } = images;
    if (
      ![wall, list].every(layerOk) ||
      ![mascot, badge].every(stickerOk) ||
      !loaderOk(loader)
    )
      return null;
    const chars = [wall, list, mascot, badge, loader].reduce(
      (sum, picture) => sum + (picture ? picture.src.length : 0),
      0,
    );
    return chars > 0 && chars <= 200000
      ? { wall, list, mascot, badge, loader }
      : null;
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
    for (const slot of ["wall", "list"]) {
      const layer = images?.[slot];
      if (!layer) continue;
      const { src, fit, opacity } = layer;
      root.style.setProperty(`--theme-${slot}-image`, `url("${src}")`);
      root.style.setProperty(
        `--theme-${slot}-size`,
        fit === "tile" ? "240px" : "cover",
      );
      root.style.setProperty(
        `--theme-${slot}-repeat`,
        fit === "tile" ? "repeat" : "no-repeat",
      );
      root.style.setProperty(
        `--theme-${slot}-wash`,
        `color-mix(in srgb, var(--field-${slot}) ${Math.round((1 - opacity) * 100)}%, transparent)`,
      );
    }
    for (const slot of ["mascot", "badge"]) {
      const sticker = images?.[slot];
      if (sticker)
        root.style.setProperty(`--theme-${slot}`, `url("${sticker.src}")`);
    }
    if (images?.list) root.dataset.themeList = "";
    if (images?.mascot) root.dataset.themeMascot = "";
    if (images?.badge) root.dataset.themeBadge = "";
    if (images?.loader) {
      root.style.setProperty("--theme-loader", `url("${images.loader.src}")`);
      root.dataset.themeLoader = images.loader.motion;
    }
    root.dataset.theme = "custom";
  } else {
    root.dataset.theme = system();
  }
})();
