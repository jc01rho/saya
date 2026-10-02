import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export const GALLERY_URL = "/themes/";

/** Every theme file `docs/themes/gallery.json` points at, as a path under `docs/themes/`. */
export function galleryFiles(themesDir: string): string[] {
  const list = JSON.parse(
    readFileSync(resolve(themesDir, "gallery.json"), "utf8"),
  ) as { themes: { path: string }[] }[];
  return list.flatMap((character) =>
    character.themes.map((theme) => theme.path),
  );
}

/**
 * Copies the files the gallery list names from `docs/themes/` into
 * `dist/themes/` as plain static assets, and serves the same paths in
 * development. Only listed files are served or copied; the card list itself is
 * bundled with the lazily loaded theme sheet.
 */
export function themeGalleryPlugin(): Plugin {
  let themesDir = "";
  return {
    name: "saya-theme-gallery",
    configResolved(config) {
      themesDir = resolve(config.root, "docs/themes");
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? "").split("?")[0] ?? "";
        if (!path.startsWith(GALLERY_URL)) return next();
        const file = decodeURIComponent(path.slice(GALLERY_URL.length));
        if (!galleryFiles(themesDir).includes(file)) return next();
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(readFileSync(resolve(themesDir, file)));
      });
    },
    generateBundle() {
      for (const file of galleryFiles(themesDir))
        this.emitFile({
          type: "asset",
          fileName: `themes/${file}`,
          source: readFileSync(resolve(themesDir, file)),
        });
    },
  };
}
