import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { Page } from "playwright-core";
import { bounded } from "../harness/barriers";
import { ROOT } from "../harness/runner";

/**
 * Visual contract audit for the saya primitives (DESIGN.md r2 token table plus
 * the plan's warm dark tokens). Static checks read the shipped CSS; browser
 * checks read computed styles and screenshot pixels from the real page.
 */
export const LIGHT = {
  "--field-wall": "#CBDDE9",
  "--field-list": "#EFE7D9",
  "--field-ground": "#E3D7C0",
  "--ink": "#2A2724",
  "--ink-muted": "#4E5D69",
  "--rule": "#4E5D69",
  "--bubble-other": "#FAF6EE",
  "--bubble-self": "#F4EBDA",
  "--accent-send": "#F3B41B",
  "--accent-send-inset": "#C98E0E",
  "--badge-unread": "#BB3322",
  "--badge-unread-ink": "#FFFFFF",
} as const;

export const DARK = {
  "--field-wall": "#332622",
  "--field-list": "#291F1C",
  "--field-ground": "#241A17",
  "--bubble-other": "#493630",
  "--bubble-self": "#57402F",
  "--ink": "#F6EEE4",
  "--ink-muted": "#CDBDB0",
  "--rule": "#AD9380",
} as const;

export const SCALE = {
  "--space-4": "4px",
  "--space-8": "8px",
  "--space-12": "12px",
  "--space-16": "16px",
  "--space-24": "24px",
  "--space-32": "32px",
  "--space-48": "48px",
  "--space-64": "64px",
  "--radius-bubble": "8px",
  "--radius-badge": "999px",
  "--radius-door": "0px",
  "--rule-width": "1px",
  "--elevation-door": "0 2px 6px rgba(42, 39, 36, 0.18)",
  "--dur-cross": "300ms",
  "--dur-fade": "160ms",
  "--ease": "cubic-bezier(0.2, 0, 0.2, 1)",
} as const;

/** Measured pairs recorded in DESIGN.md; the shipped values must not fall below them. */
const RECORDED_LIGHT: [keyof typeof LIGHT, keyof typeof LIGHT, number][] = [
  ["--ink", "--field-wall", 10.65],
  ["--ink", "--field-list", 12.09],
  ["--ink", "--field-ground", 10.43],
  ["--ink", "--bubble-other", 13.78],
  ["--ink", "--bubble-self", 12.55],
  ["--ink-muted", "--field-wall", 4.87],
  ["--ink-muted", "--field-list", 5.53],
  ["--ink-muted", "--field-ground", 4.77],
  ["--rule", "--field-wall", 3],
  ["--rule", "--field-list", 3],
  ["--rule", "--field-ground", 3],
  ["--ink", "--accent-send", 8.03],
  ["--badge-unread-ink", "--badge-unread", 5.82],
];

export const ACCENT_RGB: [number, number, number] = [0xf3, 0xb4, 0x1b];
export const DOOR_SHADOW = "rgba(42, 39, 36, 0.18) 0px 2px 6px 0px";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/(^|[^\d.])\.(\d)/g, "$10.$2");

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** WCAG 2.1 contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
}

export function parseDeclarations(block: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) map.set(name, value.trim());
  }
  return map;
}

/** Returns the body of the first block opened by `selector`; token blocks never nest. */
export function extractBlock(css: string, selector: string): string {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const start = stripped.indexOf(selector);
  if (start < 0) return "";
  const open = stripped.indexOf("{", start);
  const close = stripped.indexOf("}", open);
  return stripped.slice(open + 1, close);
}

async function listFiles(directory: string, pattern: RegExp) {
  const out: string[] = [];
  const walk = async (current: string) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (pattern.test(entry.name)) out.push(path);
    }
  };
  await walk(directory);
  return out;
}

async function text(path: string) {
  return readFile(resolve(ROOT, path), "utf8");
}

export interface StaticAudit {
  failures: string[];
  report: Record<string, unknown>;
}

export async function auditStatic(): Promise<StaticAudit> {
  const failures: string[] = [];
  const report: Record<string, unknown> = {};
  const fail = (message: string) => failures.push(message);

  let tokens = "";
  try {
    tokens = await text("src/styles/tokens.css");
  } catch (error) {
    fail(`tokens.css unreadable: ${String(error)}`);
    return { failures, report };
  }
  const light = parseDeclarations(extractBlock(tokens, ":root"));
  const dark = parseDeclarations(extractBlock(tokens, '[data-theme="dark"]'));
  for (const [name, expected] of Object.entries({ ...LIGHT, ...SCALE })) {
    const actual = light.get(name);
    if (!actual) fail(`light token ${name} missing`);
    else if (normalize(actual) !== normalize(expected))
      fail(`light token ${name} is ${actual}, expected ${expected}`);
  }
  for (const [name, expected] of Object.entries(DARK)) {
    const actual = dark.get(name);
    if (!actual) fail(`dark token ${name} missing`);
    else if (normalize(actual) !== normalize(expected))
      fail(`dark token ${name} is ${actual}, expected ${expected}`);
  }
  for (const name of [
    "--accent-send",
    "--accent-send-inset",
    "--badge-unread",
    "--badge-unread-ink",
    "--door-ink",
  ])
    if (dark.has(name))
      fail(`dark theme must not redefine ${name}; accent and badge are fixed`);

  const lightContrast: Record<string, number> = {};
  for (const [fg, bg, minimum] of RECORDED_LIGHT) {
    const a = light.get(fg);
    const b = light.get(bg);
    if (!a || !b) continue;
    const ratio = contrast(a, b);
    lightContrast[`${fg} on ${bg}`] = Number(ratio.toFixed(2));
    if (ratio < minimum - 0.01)
      fail(
        `${fg} on ${bg} measures ${ratio.toFixed(2)}, below recorded ${minimum}`,
      );
  }
  const darkContrast: Record<string, number> = {};
  const darkSurfaces = [
    "--field-wall",
    "--field-list",
    "--field-ground",
    "--bubble-other",
    "--bubble-self",
  ];
  for (const [fg, floor, surfaces] of [
    ["--ink", 4.5, darkSurfaces],
    ["--ink-muted", 4.5, darkSurfaces],
    ["--rule", 3, ["--field-wall", "--field-list", "--field-ground"]],
  ] as [string, number, string[]][]) {
    for (const bg of surfaces) {
      const a = dark.get(fg);
      const b = dark.get(bg);
      if (!a || !b) continue;
      const ratio = contrast(a, b);
      darkContrast[`${fg} on ${bg}`] = Number(ratio.toFixed(2));
      if (ratio < floor)
        fail(
          `dark ${fg} on ${bg} measures ${ratio.toFixed(2)}, below ${floor}`,
        );
    }
  }
  const doorInk = light.get("--door-ink");
  const accent = light.get("--accent-send");
  if (!doorInk)
    fail("--door-ink missing: the door label is #2A2724 in both themes");
  else if (normalize(doorInk) !== normalize(LIGHT["--ink"]))
    fail(`--door-ink is ${doorInk}, expected ${LIGHT["--ink"]}`);
  if (doorInk && accent)
    darkContrast["--door-ink on --accent-send"] = Number(
      contrast(doorInk, accent).toFixed(2),
    );
  report.lightContrast = lightContrast;
  report.darkContrast = darkContrast;

  // Exactly one elevation, on the send door only; one accent, referenced only by the door.
  const cssFiles = [
    ...(await listFiles(resolve(ROOT, "src/styles"), /\.css$/)),
    ...(await listFiles(resolve(ROOT, "src/ui"), /\.css$/)),
  ];
  const codeFiles = await listFiles(resolve(ROOT, "src/ui"), /\.tsx?$/);
  const shadows: { file: string; value: string }[] = [];
  const accentLiteral: string[] = [];
  const accentUse: string[] = [];
  const rasterUse: string[] = [];
  const raster = /\.(png|jpe?g|webp|gif|avif)\b/i;
  for (const file of cssFiles) {
    const css = await readFile(file, "utf8");
    const short = relative(ROOT, file).replaceAll("\\", "/");
    for (const match of css.matchAll(/box-shadow\s*:\s*([^;]+);/g)) {
      const value = (match[1] ?? "").trim();
      if (value !== "none") shadows.push({ file: short, value });
    }
    if (/#f3b41b/i.test(css)) accentLiteral.push(short);
    if (/var\(--accent-send(-inset)?\)/.test(css)) accentUse.push(short);
    if (raster.test(css)) rasterUse.push(short);
  }
  for (const file of codeFiles) {
    const source = await readFile(file, "utf8");
    const short = relative(ROOT, file).replaceAll("\\", "/");
    if (/#f3b41b/i.test(source)) accentLiteral.push(short);
    if (raster.test(source)) rasterUse.push(short);
  }
  report.shadows = shadows;
  if (shadows.length !== 1)
    fail(
      `expected exactly one box-shadow declaration, found ${shadows.length}`,
    );
  const [shadow] = shadows;
  if (shadow) {
    if (!shadow.file.endsWith("src/ui/SendDoor.module.css"))
      fail(
        `the only elevation must be on the send door, found in ${shadow.file}`,
      );
    if (normalize(shadow.value) !== "var(--elevation-door)")
      fail(`door shadow must be var(--elevation-door), found ${shadow.value}`);
  }
  if (accentLiteral.join() !== "src/styles/tokens.css")
    fail(
      `#F3B41B literal must live only in tokens.css, found in ${accentLiteral.join(", ") || "nowhere"}`,
    );
  if (accentUse.join() !== "src/ui/SendDoor.module.css")
    fail(
      `--accent-send may be used only by SendDoor.module.css, found in ${accentUse.join(", ") || "nowhere"}`,
    );
  if (rasterUse.length)
    fail(`raster image references shipped: ${rasterUse.join(", ")}`);

  try {
    const door = await text("src/ui/SendDoor.module.css");
    const radii = [...door.matchAll(/border-radius\s*:\s*([^;]+);/g)].map((m) =>
      (m[1] ?? "").trim(),
    );
    if (!radii.length) fail("SendDoor.module.css declares no border-radius");
    if (radii.some((value) => normalize(value) !== "var(--radius-door)"))
      fail(
        `door radii must all be var(--radius-door), found ${radii.join(" | ")}`,
      );
  } catch (error) {
    fail(`SendDoor.module.css unreadable: ${String(error)}`);
  }

  // Fonts: vendored Pretendard subsets, font-display optional, no preload.
  try {
    const fonts = await text("src/styles/fonts.css");
    const faces = [...fonts.matchAll(/@font-face\s*{([^}]*)}/g)].map(
      (m) => m[1] ?? "",
    );
    if (!faces.length) fail("fonts.css has no @font-face blocks");
    const urls: string[] = [];
    for (const face of faces) {
      if (!/font-display\s*:\s*optional\s*;/.test(face))
        fail("a @font-face block is not font-display: optional");
      if (!/font-family\s*:\s*["']Pretendard Variable["']/.test(face))
        fail("a @font-face block is not Pretendard Variable");
      const url = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(face)?.[1];
      if (!url) fail("a @font-face block has no url()");
      else urls.push(url);
    }
    const vendored = (await readdir(resolve(ROOT, "public/fonts"))).filter(
      (file) => file.endsWith(".woff2"),
    );
    const referenced = new Set(
      urls.map((url) => url.replace(/^\/fonts\//, "")),
    );
    if (urls.some((url) => !url.startsWith("/fonts/")))
      fail("font urls must be served from /fonts/");
    if (referenced.size !== urls.length)
      fail("a font subset is referenced more than once");
    for (const file of vendored)
      if (!referenced.has(file))
        fail(`vendored font ${file} is not referenced`);
    for (const file of referenced)
      if (!vendored.includes(file))
        fail(`referenced font ${file} is not vendored`);
    report.fontFaces = faces.length;
    report.fontFiles = vendored.length;
    const html = await text("index.html");
    if (/rel=["']preload["']/i.test(html))
      fail("index.html preloads assets; font subsets must load on demand");
    const licence = await text("public/licenses/pretendard-OFL.txt");
    if (!/SIL OPEN FONT LICENSE/i.test(licence) || !/Pretendard/.test(licence))
      fail("pretendard-OFL.txt is not the Pretendard OFL text");
  } catch (error) {
    fail(`font vendoring incomplete: ${String(error)}`);
  }

  // The cat: an original vector, animated by transform only, still under reduced motion.
  try {
    const cat = await text("src/ui/Cat.tsx");
    if (!/<svg/.test(cat)) fail("Cat.tsx renders no inline SVG");
    if (/<image|xlink:href|data:image/i.test(cat))
      fail("Cat.tsx embeds an image; the mark must be hand-authored vector");
    const css = await text("src/ui/Cat.module.css");
    const keyframes = [
      ...css.matchAll(/@keyframes\s+[\w-]+\s*{((?:[^{}]*{[^}]*})+)\s*}/g),
    ];
    if (!keyframes.length) fail("Cat.module.css declares no @keyframes");
    for (const block of keyframes) {
      const properties = [...(block[1] ?? "").matchAll(/{([^}]*)}/g)]
        .flatMap((frame) => [...(frame[1] ?? "").matchAll(/([a-z-]+)\s*:/g)])
        .map((m) => m[1]);
      const foreign = properties.filter((p) => p !== "transform");
      if (foreign.length)
        fail(`cat keyframes animate ${foreign.join(", ")}; transform only`);
    }
    if (!/prefers-reduced-motion/.test(css))
      fail("Cat.module.css has no prefers-reduced-motion rule");
  } catch (error) {
    fail(`cat incomplete: ${String(error)}`);
  }

  return { failures, report };
}

export interface DoorAudit {
  doors: number;
  corners: string[];
  shadows: { state: string; shadow: string; width: number; height: number }[];
  stray: string[];
}

export function auditDoors(page: Page): Promise<DoorAudit> {
  return page.evaluate(() => {
    const doors = [
      ...document.querySelectorAll<HTMLElement>('[data-ui="send-door"]'),
    ];
    const corners = doors.map((door) => {
      const style = getComputedStyle(door);
      return [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ].join(" ");
    });
    const shadows = doors.map((door) => ({
      state: door.dataset.state ?? "",
      shadow: getComputedStyle(door).boxShadow,
      width: door.offsetWidth,
      height: door.offsetHeight,
    }));
    const stray: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      if (element.closest('[data-ui="send-door"]')) continue;
      const shadow = getComputedStyle(element).boxShadow;
      if (shadow !== "none")
        stray.push(
          `${element.tagName.toLowerCase()}${element.dataset.ui ? `[data-ui=${element.dataset.ui}]` : ""}: ${shadow}`,
        );
    }
    return { doors: doors.length, corners, shadows, stray };
  });
}

export interface AccentAudit {
  width: number;
  height: number;
  doors: number;
  inside: number;
  outside: number;
  samples: { x: number; y: number }[];
}

/** Decodes the screenshot in the page and locates every accent-coloured pixel. */
export function auditAccent(
  page: Page,
  png: Buffer,
  tolerance = 6,
): Promise<AccentAudit> {
  return page.evaluate(
    async ({ encoded, target, tolerance }) => {
      const blob = await (
        await fetch(`data:image/png;base64,${encoded}`)
      ).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No 2d context");
      context.drawImage(bitmap, 0, 0);
      const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
      const doors = [
        ...document.querySelectorAll<HTMLElement>('[data-ui="send-door"]'),
      ].map((door) => {
        const rect = door.getBoundingClientRect();
        return {
          left: rect.left + window.scrollX - 1,
          top: rect.top + window.scrollY - 1,
          right: rect.right + window.scrollX + 1,
          bottom: rect.bottom + window.scrollY + 1,
        };
      });
      let inside = 0;
      let outside = 0;
      const samples: { x: number; y: number }[] = [];
      const [tr, tg, tb] = target;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        if (
          Math.abs(r - tr) > tolerance ||
          Math.abs(g - tg) > tolerance ||
          Math.abs(b - tb) > tolerance
        )
          continue;
        const pixel = i / 4;
        const x = pixel % bitmap.width;
        const y = (pixel - x) / bitmap.width;
        if (
          doors.some(
            (door) =>
              x >= door.left &&
              x < door.right &&
              y >= door.top &&
              y < door.bottom,
          )
        )
          inside++;
        else {
          outside++;
          if (samples.length < 12) samples.push({ x, y });
        }
      }
      return {
        width: bitmap.width,
        height: bitmap.height,
        doors: doors.length,
        inside,
        outside,
        samples,
      };
    },
    { encoded: png.toString("base64"), target: ACCENT_RGB, tolerance },
  );
}

export interface MotionAudit {
  cats: number;
  legs: number;
  animatedLegs: number;
  walkingCats: number;
  sitVisible: number;
  walkVisible: number;
}

export function auditMotion(page: Page): Promise<MotionAudit> {
  return page.evaluate(() => {
    const cats = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-ui="cat"][data-motion="walk"]',
      ),
    ];
    const legs = cats.flatMap((cat) => [
      ...cat.querySelectorAll<SVGElement>('[data-cat-part="leg"]'),
    ]);
    const visible = (cat: HTMLElement, pose: string) => {
      const group = cat.querySelector(`[data-cat-pose="${pose}"]`);
      return group ? getComputedStyle(group).display !== "none" : false;
    };
    return {
      cats: cats.length,
      legs: legs.length,
      animatedLegs: legs.filter(
        (leg) => getComputedStyle(leg).animationName !== "none",
      ).length,
      walkingCats: cats.filter(
        (cat) => getComputedStyle(cat).animationName !== "none",
      ).length,
      sitVisible: cats.filter((cat) => visible(cat, "sit")).length,
      walkVisible: cats.filter((cat) => visible(cat, "walk")).length,
    };
  });
}

export function auditOverflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
  }));
}

export function measureRows(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-ui="room-row"]')].map(
      (row) => row.getBoundingClientRect().height,
    ),
  );
}

export function fontStatus(page: Page) {
  return bounded(
    page.evaluate(() =>
      document.fonts.ready.then(() => ({
        loaded: [...document.fonts].filter((face) => face.status === "loaded")
          .length,
        pretendard: document.fonts.check('16px "Pretendard Variable"'),
      })),
    ),
    "document.fonts.ready",
    10_000,
  );
}

/** Keyboard focus through the composer input onto the door, then read the ring. */
export async function focusDoor(page: Page) {
  await page.locator('[data-ui="composer-input"]').first().click();
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    const style = element ? getComputedStyle(element) : null;
    return {
      ui: element?.dataset.ui ?? null,
      focusVisible: element?.matches(":focus-visible") ?? false,
      outlineWidth: style?.outlineWidth ?? "",
      outlineStyle: style?.outlineStyle ?? "",
      outlineColor: style?.outlineColor ?? "",
      outlineOffset: style?.outlineOffset ?? "",
    };
  });
}
