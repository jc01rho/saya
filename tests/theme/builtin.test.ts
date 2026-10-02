import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { BUILTIN_THEMES } from "../../src/features/theme/builtin";
import { mix } from "../../src/features/theme/color";
import {
  contrastWarnings,
  parseTheme,
  TOKEN_SPECS,
} from "../../src/features/theme/schema";

const css = await Bun.file(
  resolve(import.meta.dir, "../../src/styles/tokens.css"),
).text();

/** The custom properties one selector's block declares, comments stripped. */
function block(selector: string): Map<string, string> {
  const body = new RegExp(
    `${selector.replace(/[[\]"]/g, "\\$&")}\\s*\\{([^}]*)\\}`,
  ).exec(css.replace(/\/\*[\s\S]*?\*\//g, ""))?.[1];
  if (!body) throw new Error(`No block for ${selector}`);
  return new Map(
    [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [
      m[1] as string,
      (m[2] as string).replace(/\s+/g, " ").trim(),
    ]),
  );
}

/** A declared value as a colour: hex as is, `color-mix(in srgb, var(a) N%, var(b))` evaluated. */
function evaluate(value: string, scope: Map<string, string>): string | null {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const m =
    /^color-mix\(in srgb, var\((--[\w-]+)\) (\d+)%, var\((--[\w-]+)\)\)$/.exec(
      value,
    );
  if (!m) return null;
  const [a, b] = [scope.get(m[1] as string), scope.get(m[3] as string)];
  const [x, y] = [a && evaluate(a, scope), b && evaluate(b, scope)];
  return x && y ? mix(x, y, Number(m[2]) / 100) : null;
}

const root = block(':root,\n[data-theme="light"]');
const scopes = {
  light: root,
  dark: new Map([...root, ...block('[data-theme="dark"]')]),
  kakao: new Map([...root, ...block('[data-theme="kakao"]')]),
};

describe("built-in themes", () => {
  for (const [id, theme] of Object.entries(BUILTIN_THEMES)) {
    test(`${id} passes the pasted-theme schema with no AA warning`, () => {
      expect(parseTheme(theme).ok).toBe(true);
      expect(contrastWarnings(theme)).toEqual([]);
    });

    test(`${id} matches what tokens.css draws`, () => {
      const scope = scopes[id as keyof typeof scopes];
      for (const spec of TOKEN_SPECS) {
        const value = theme.tokens[spec.key];
        if (value === undefined) continue;
        const declared = scope.get(spec.cssVar);
        const drawn =
          declared === undefined || declared === "initial"
            ? spec.cssFallback &&
              evaluate(
                scope.get(
                  TOKEN_SPECS.find((s) => s.key === spec.cssFallback)?.cssVar ??
                    "",
                ) ?? "",
                scope,
              )
            : evaluate(declared, scope);
        expect({ token: spec.key, drawn }).toEqual({
          token: spec.key,
          drawn: value,
        });
      }
    });
  }
});
