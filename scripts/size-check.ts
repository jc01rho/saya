import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const JS_BUDGET_GZIP_KIB = 180;
const CSS_BUDGET_GZIP_KIB = 24;

async function check() {
  const assetsDir = resolve(process.cwd(), "dist/assets");
  const files = await readdir(assetsDir);

  let entryJsGzip = 0;
  let entryCssGzip = 0;
  let entryJsFile = "";
  let entryCssFile = "";

  for (const file of files) {
    const full = resolve(assetsDir, file);
    const content = await readFile(full);
    const gz = gzipSync(content);
    const kib = gz.byteLength / 1024;

    if (file.startsWith("index-") && file.endsWith(".js")) {
      entryJsGzip = kib;
      entryJsFile = file;
    } else if (file.startsWith("index-") && file.endsWith(".css")) {
      entryCssGzip = kib;
      entryCssFile = file;
    }
  }

  console.log(
    `Entry JS (${entryJsFile}): ${entryJsGzip.toFixed(2)} KiB gzip (Budget: <= ${JS_BUDGET_GZIP_KIB} KiB)`,
  );
  console.log(
    `Entry CSS (${entryCssFile}): ${entryCssGzip.toFixed(2)} KiB gzip (Budget: <= ${CSS_BUDGET_GZIP_KIB} KiB)`,
  );

  let ok = true;
  if (entryJsGzip > JS_BUDGET_GZIP_KIB) {
    console.error(`FAIL: Entry JS exceeds budget of ${JS_BUDGET_GZIP_KIB} KiB`);
    ok = false;
  }
  if (entryCssGzip > CSS_BUDGET_GZIP_KIB) {
    console.error(
      `FAIL: Entry CSS exceeds budget of ${CSS_BUDGET_GZIP_KIB} KiB`,
    );
    ok = false;
  }

  if (!ok) process.exit(1);
  console.log("PASS: All bundles within performance size budgets.");
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
