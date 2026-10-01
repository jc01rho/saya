import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { buildThemePrompt } from "../../src/features/theme/prompt";
import { parseTheme } from "../../src/features/theme/schema";

const doc = await Bun.file(
  resolve(import.meta.dir, "../../docs/THEMES.md"),
).text();

test("docs/THEMES.md carries the prompt the app copies", () => {
  const shipped =
    /<!-- theme-prompt:start -->\n````text\n([\s\S]*?)````\n<!-- theme-prompt:end -->/.exec(
      doc,
    )?.[1];
  expect(shipped).toBe(buildThemePrompt());
});

test("the prompt's example is a theme the app accepts", () => {
  const example = /\[예시[^\]]*\]\n([\s\S]*)$/.exec(buildThemePrompt())?.[1];
  const result = parseTheme(example ?? "");
  expect(result.ok && result.warnings).toEqual([]);
});
