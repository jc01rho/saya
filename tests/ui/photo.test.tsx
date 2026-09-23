import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { components } from "../../src/contract/decoded";
import { Photo } from "../../src/ui/Photo";

type PhotoData = components["schemas"]["Photo"];

const image = (n: number) => ({
  url: `https://example.test/p${n}.jpg`,
  width: 800,
  height: 600,
});

function album(count: number): PhotoData {
  const images = Array.from({ length: count }, (_, i) => image(i));
  const [first] = images;
  return {
    url: first?.url ?? "",
    width: first?.width ?? 0,
    height: first?.height ?? 0,
    count,
    images,
  };
}

const markup = (photo: PhotoData) =>
  renderToStaticMarkup(<Photo photo={photo} />);
const tiles = (html: string) => html.match(/data-ui="photo"/g)?.length ?? 0;
const srcs = (html: string) =>
  [...html.matchAll(/<img[^>]*src="([^"]*)"/g)].map((m) => m[1]);

describe("a message's pictures are drawn from photo.images", () => {
  test("one picture is one tile at its own stored shape", () => {
    const html = markup(album(1));
    expect(tiles(html)).toBe(1);
    expect(srcs(html)).toEqual(["https://example.test/p0.jpg"]);
    expect(html).toContain("aspect-ratio:800 / 600");
  });

  test("every picture of a small album gets its own tile", () => {
    for (const count of [2, 3, 4]) {
      const html = markup(album(count));
      expect([count, tiles(html)]).toEqual([count, count]);
      expect([count, srcs(html).length]).toEqual([count, count]);
    }
  });

  test("beyond four, the fourth tile carries the remainder as +N", () => {
    const html = markup(album(9));
    expect(tiles(html)).toBe(4);
    expect(html).toContain(">+5<");
    // The hidden pictures are not rendered, only counted.
    expect(srcs(html)).toEqual([
      "https://example.test/p0.jpg",
      "https://example.test/p1.jpg",
      "https://example.test/p2.jpg",
      "https://example.test/p3.jpg",
    ]);
  });

  test("exactly four shows no +N", () => {
    expect(markup(album(4))).not.toContain(">+");
  });

  test("an empty images list falls back to the repeated first address", () => {
    const html = markup({
      url: "https://example.test/only.jpg",
      width: 100,
      height: 50,
      count: 1,
      images: [],
    });
    expect(tiles(html)).toBe(1);
    expect(srcs(html)).toEqual(["https://example.test/only.jpg"]);
  });

  test("a size the client did not store becomes a square, never a divide by zero", () => {
    const html = markup({
      url: "https://example.test/unsized.jpg",
      width: 0,
      height: 0,
      count: 1,
      images: [
        { url: "https://example.test/unsized.jpg", width: 0, height: 0 },
      ],
    });
    expect(html).toContain("aspect-ratio:1 / 1");
    // A zero size is omitted rather than written onto the element.
    expect(html).not.toContain('width="0"');
  });

  test("the lightbox is closed until a tile is pressed", () => {
    expect(markup(album(3))).not.toContain('data-ui="photo-lightbox"');
  });
});
