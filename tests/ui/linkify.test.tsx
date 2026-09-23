import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { linkify } from "../../src/ui/linkify";

const markup = (text: string) => renderToStaticMarkup(<p>{linkify(text)}</p>);
const hrefs = (text: string) =>
  [...markup(text).matchAll(/href="([^"]*)"/g)].map((match) => match[1]);

describe("message bodies become links without contacting anything", () => {
  test("a bare address becomes one link that shows the address itself", () => {
    const html = markup("보세요 https://example.com/a/b 여기");
    expect(hrefs("보세요 https://example.com/a/b 여기")).toEqual([
      "https://example.com/a/b",
    ]);
    expect(html).toContain(">https://example.com/a/b</a>");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  test("sentence punctuation after an address is text, not part of it", () => {
    expect(hrefs("여기 https://example.com/a.")).toEqual([
      "https://example.com/a",
    ]);
    expect(hrefs("(https://example.com/a)")).toEqual(["https://example.com/a"]);
    expect(hrefs("https://ko.wikipedia.org/wiki/x_(y)")).toEqual([
      "https://ko.wikipedia.org/wiki/x_(y)",
    ]);
  });

  test("several addresses in one body each become their own link", () => {
    expect(hrefs("a https://one.example b https://two.example c")).toEqual([
      "https://one.example",
      "https://two.example",
    ]);
  });

  test("only http and https are ever linked", () => {
    for (const body of [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "file:///etc/passwd",
      "ftp://example.com/x",
      "주소 아님 example.com",
    ])
      expect(hrefs(body)).toEqual([]);
  });

  test("a body with no address renders as the text it was", () => {
    const body = "링크 없는 평범한 <문장> & 기호";
    expect(hrefs(body)).toEqual([]);
    expect(markup(body)).toBe(
      renderToStaticMarkup(<p>링크 없는 평범한 &lt;문장&gt; &amp; 기호</p>),
    );
  });

  test("the surrounding text, including its whitespace, survives intact", () => {
    const body = "앞\n  https://example.com/x  뒤";
    const html = markup(body);
    expect(html).toContain("앞\n  ");
    expect(html).toContain("  뒤");
  });
});
