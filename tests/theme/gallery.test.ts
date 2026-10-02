import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { parseTheme } from "../../src/features/theme/schema";

const root = resolve(import.meta.dir, "../../docs/themes");
const files = Array.from(new Bun.Glob("**/*.json").scanSync({ cwd: root }));

test("the theme gallery is not empty", () => {
  expect(files.length).toBeGreaterThan(0);
});

test.each(files)("docs/themes/%s is a theme the app accepts", async (file) => {
  const result = parseTheme(await Bun.file(resolve(root, file)).text());
  expect(
    result.ok
      ? { warnings: result.warnings, ignored: result.ignored }
      : result.issues,
  ).toEqual({
    warnings: [],
    ignored: [],
  });
});
