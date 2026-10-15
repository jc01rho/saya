import { RECAP_COPY } from "./copy";
import type { Recap } from "./stats";

export type Palette = {
  wall: string;
  ink: string;
  muted: string;
  fill: string;
  accent: string;
  bubble: string;
  rule: string;
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Malgun Gothic", "Noto Sans KR", sans-serif';

/**
 * The theme's colours as the canvas can take them. A custom property may hold
 * `color-mix(...)`; the computed colour of an element painted with it is a
 * plain `rgb(...)` the canvas understands.
 */
export function paletteOf(root: HTMLElement): Palette {
  const probe = root.ownerDocument.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  root.append(probe);
  const resolve = (name: string, fallback: string) => {
    probe.style.color = `var(${name}, ${fallback})`;
    return getComputedStyle(probe).color || fallback;
  };
  const palette = {
    wall: resolve("--field-wall", "#ffffff"),
    ink: resolve("--ink", "#111111"),
    muted: resolve("--ink-muted", "#666666"),
    fill: resolve("--fill-wall", "#eeeeee"),
    accent: resolve("--accent-send", "#f9e000"),
    bubble: resolve("--bubble-self", "#f9e000"),
    rule: resolve("--rule", "#cccccc"),
  };
  probe.remove();
  return palette;
}

export type Painting = {
  recap: Recap;
  title: string;
  palette: Palette;
};

const WIDTH = 1080;
const PAD = 64;
const SCALE = 2;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function ellipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  max: number,
): string {
  if (ctx.measureText(text).width <= max) return text;
  const chars = [...text];
  while (chars.length > 0 && ctx.measureText(`${chars.join("")}…`).width > max)
    chars.pop();
  return `${chars.join("")}…`;
}

/** Draws the card at a fixed width; the height is whatever the sections need. */
export function paintRecap(
  canvas: HTMLCanvasElement,
  { recap, title, palette }: Painting,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");
  const inner = WIDTH - PAD * 2;
  const sections: ((y: number, draw: boolean) => number)[] = [];
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    weight: number,
    colour: string,
    align: CanvasTextAlign = "left",
  ) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = colour;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, x, y);
  };

  sections.push((y, draw) => {
    if (draw) {
      ctx.font = `800 44px ${FONT}`;
      text(ellipsis(ctx, title, inner), PAD, y + 44, 44, 800, palette.ink);
      text(
        `${RECAP_COPY.period[recap.period]} ${RECAP_COPY.title} · ${RECAP_COPY.range(recap.range.from, recap.range.to)}`,
        PAD,
        y + 92,
        26,
        500,
        palette.muted,
      );
    }
    return 128;
  });

  sections.push((y, draw) => {
    const numbers: [string, string][] = [
      [RECAP_COPY.count(recap.count), RECAP_COPY.messages],
      [RECAP_COPY.people(recap.speakers), RECAP_COPY.speakers],
      [RECAP_COPY.count(recap.photos), RECAP_COPY.photos],
    ];
    if (draw) {
      const each = inner / numbers.length;
      numbers.forEach(([value, label], index) => {
        const x = PAD + each * index;
        ctx.fillStyle = palette.fill;
        roundRect(ctx, x, y, each - 16, 128, 24);
        text(value, x + 28, y + 70, 48, 800, palette.ink);
        text(label, x + 28, y + 104, 24, 600, palette.muted);
      });
    }
    return 160;
  });

  sections.push((y, draw) => {
    if (draw) {
      const first = recap.first
        ? `${RECAP_COPY.first} ${RECAP_COPY.date(recap.first)}`
        : `${RECAP_COPY.first} ${RECAP_COPY.none}`;
      const last = recap.last
        ? ` · ${RECAP_COPY.last} ${RECAP_COPY.date(recap.last)}`
        : "";
      text(first + last, PAD, y + 28, 26, 600, palette.ink);
    }
    return 56;
  });

  const heading = (label: string, y: number, draw: boolean) => {
    if (draw) text(label, PAD, y + 30, 28, 800, palette.ink);
    return 52;
  };

  sections.push((y, draw) => {
    let used = heading(RECAP_COPY.words, y, draw);
    ctx.font = `700 26px ${FONT}`;
    let x = PAD;
    let line = y + used;
    const chipH = 52;
    if (recap.words.length === 0) {
      if (draw) text(RECAP_COPY.none, PAD, line + 34, 26, 500, palette.muted);
      return used + chipH + 24;
    }
    for (const word of recap.words) {
      const label = `${word.key} ${word.count}`;
      ctx.font = `700 26px ${FONT}`;
      const w = ctx.measureText(label).width + 40;
      if (x + w > PAD + inner) {
        x = PAD;
        line += chipH + 12;
      }
      if (draw) {
        ctx.fillStyle = palette.bubble;
        roundRect(ctx, x, line, w, chipH, 26);
        ctx.font = `700 26px ${FONT}`;
        text(label, x + 20, line + 35, 26, 700, palette.ink);
      }
      x += w + 12;
    }
    used = line + chipH - y + 24;
    return used;
  });

  sections.push((y, draw) => {
    const used = heading(RECAP_COPY.emoji, y, draw);
    if (recap.emoji.length === 0) {
      if (draw)
        text(RECAP_COPY.none, PAD, y + used + 34, 26, 500, palette.muted);
      return used + 72;
    }
    if (draw) {
      let x = PAD;
      for (const item of recap.emoji) {
        text(item.key, x, y + used + 52, 52, 400, palette.ink);
        text(String(item.count), x + 68, y + used + 50, 26, 700, palette.muted);
        x += 150;
      }
    }
    return used + 84;
  });

  sections.push((y, draw) => {
    const used = heading(RECAP_COPY.senders, y, draw);
    const rows = recap.senders.slice(0, 6);
    const max = rows[0]?.count ?? 1;
    const rowH = 44;
    if (draw) {
      rows.forEach((row, index) => {
        const top = y + used + index * rowH;
        const name = row.fromMe ? RECAP_COPY.me : row.sender;
        ctx.font = `600 24px ${FONT}`;
        text(ellipsis(ctx, name, 200), PAD, top + 28, 24, 600, palette.ink);
        const barX = PAD + 220;
        const barW = inner - 220 - 90;
        ctx.fillStyle = palette.fill;
        roundRect(ctx, barX, top + 8, barW, 24, 12);
        ctx.fillStyle = palette.accent;
        roundRect(
          ctx,
          barX,
          top + 8,
          Math.max(24, (barW * row.count) / max),
          24,
          12,
        );
        text(
          RECAP_COPY.count(row.count),
          PAD + inner,
          top + 28,
          24,
          700,
          palette.muted,
          "right",
        );
      });
      if (rows.length === 0)
        text(RECAP_COPY.none, PAD, y + used + 34, 26, 500, palette.muted);
    }
    return used + Math.max(rows.length, 1) * rowH + 16;
  });

  sections.push((y, draw) => {
    const used = heading(RECAP_COPY.heatmap, y, draw);
    const labelW = 48;
    const cell = (inner - labelW) / 24;
    const max = Math.max(1, ...recap.heatmap.flat());
    if (draw) {
      recap.heatmap.forEach((hours, day) => {
        const top = y + used + day * cell;
        text(
          RECAP_COPY.days[day] ?? "",
          PAD,
          top + cell * 0.7,
          22,
          600,
          palette.muted,
        );
        hours.forEach((count, hour) => {
          const x = PAD + labelW + hour * cell;
          ctx.fillStyle = palette.fill;
          roundRect(ctx, x + 2, top + 2, cell - 4, cell - 4, 6);
          if (count > 0) {
            ctx.globalAlpha = 0.25 + 0.75 * (count / max);
            ctx.fillStyle = palette.accent;
            roundRect(ctx, x + 2, top + 2, cell - 4, cell - 4, 6);
            ctx.globalAlpha = 1;
          }
        });
      });
      for (const hour of [0, 6, 12, 18]) {
        text(
          `${hour}시`,
          PAD + labelW + hour * cell + 2,
          y + used + 7 * cell + 26,
          20,
          600,
          palette.muted,
        );
      }
      if (recap.busiest)
        text(
          RECAP_COPY.busiest(recap.busiest.day, recap.busiest.hour),
          PAD,
          y + used + 7 * cell + 64,
          24,
          600,
          palette.ink,
        );
    }
    return used + 7 * cell + 84;
  });

  sections.push((y, draw) => {
    if (draw) text(RECAP_COPY.footer, PAD, y + 24, 20, 500, palette.muted);
    return 40;
  });

  let height = PAD;
  for (const section of sections) height += section(height, false);
  height += PAD;

  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, WIDTH, height);
  let y = PAD;
  for (const section of sections) y += section(y, true);
}

/** Hands the painted card to the browser's download, the same as saving any picture; nothing leaves the device. */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("toBlob returned null"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = canvas.ownerDocument.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      resolve();
    }, "image/png");
  });
}

export function recapFilename(title: string, recap: Recap): string {
  const safe =
    title
      .replace(/[\\/:*?"<>|\s]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || RECAP_COPY.untitled;
  const day = recap.range.to;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `saya-${RECAP_COPY.title}-${safe}-${recap.period}-${day.getFullYear()}${pad(day.getMonth() + 1)}${pad(day.getDate())}.png`;
}
