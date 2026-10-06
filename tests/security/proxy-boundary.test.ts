import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? filesUnder(path) : [path];
    }),
  );
  return nested.flat();
}

async function builtContents() {
  const files = await filesUnder(resolve(root, "dist"));
  return Promise.all(files.map((file) => readFile(file, "utf8")));
}

function exampleValues(source: string) {
  return source
    .split(/\r?\n/)
    .filter(
      (line) =>
        line.startsWith("SAYA_CORE_") || line.startsWith("SAYA_ADAPTER_"),
    )
    .map((line) => line.slice(line.indexOf("=") + 1))
    .filter(Boolean);
}

describe("same-origin proxy boundary", () => {
  test("the static bundle contains neither server variable names nor example values", async () => {
    const bundle = (await builtContents()).join("\n");
    const envExample = await readFile(resolve(root, ".env.example"), "utf8");

    expect(bundle).not.toContain("SAYA_CORE_TOKEN");
    expect(bundle).not.toContain("SAYA_ADAPTER_");
    for (const value of exampleValues(envExample))
      expect(bundle).not.toContain(value);
  });

  test("the Caddy contract blocks unsafe cross-origin writes before proxying", async () => {
    const caddyfile = await readFile(
      resolve(root, "deploy/Caddyfile.example"),
      "utf8",
    );

    expect(caddyfile).toContain("@blocked_write {");
    expect(caddyfile).toContain("method POST PUT PATCH DELETE");
    expect(caddyfile).toContain("header Origin http://127.0.0.1:8080");
    expect(caddyfile).toContain("header Sec-Fetch-Site same-origin");
    expect(caddyfile).toContain("header Content-Type application/json*");
    // Multipart is let through only for the two upload routes, same-origin.
    const multipart = caddyfile.indexOf(
      "header Content-Type multipart/form-data*",
    );
    const uploadPath = caddyfile.indexOf(
      "path_regexp upload_write ^/(?:api|adapters/[a-z][a-z0-9-]*)/upload$",
    );
    expect(uploadPath).toBeGreaterThan(-1);
    expect(multipart).toBeGreaterThan(uploadPath);
    expect(multipart).toBeLessThan(
      caddyfile.indexOf("respond @blocked_write 403"),
    );
    expect(caddyfile).toContain("max_size 60MiB");
    expect(caddyfile.indexOf("request_body @upload_body")).toBeLessThan(
      caddyfile.indexOf("reverse_proxy {env.SAYA_CORE_URL}"),
    );
    expect(caddyfile).toContain("respond @blocked_write 403");
    expect(caddyfile.indexOf("respond @blocked_write 403")).toBeLessThan(
      caddyfile.indexOf("reverse_proxy {env.SAYA_CORE_URL}"),
    );
    expect(caddyfile).toContain(
      'header_up Authorization "Bearer {env.SAYA_CORE_TOKEN}"',
    );
    expect(caddyfile).toContain("uri strip_prefix /api");
    // Adapters are generated (tests/server/adapters.test.ts checks their token
    // and sandbox) and imported after the write filter, before the SPA fallback.
    const adapters = caddyfile.indexOf("\n    import adapters.caddy\n");
    expect(adapters).toBeGreaterThan(
      caddyfile.indexOf("respond @blocked_write 403"),
    );
    expect(adapters).toBeLessThan(
      caddyfile.indexOf("try_files {path} /index.html"),
    );
    expect(caddyfile).toContain("flush_interval -1");
    expect(caddyfile).toContain('Cache-Control "no-store"');
    expect(caddyfile).toContain("output discard");
    expect(caddyfile).toContain("default-src 'self'");
    expect(caddyfile).not.toContain("unsafe-inline");
    expect(caddyfile).not.toContain("unsafe-eval");
  });
});
