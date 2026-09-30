import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar, RoomAvatar } from "../../src/ui/Avatar";
import { syntheticPicture } from "../fixtures/data";

const pictures = [0, 1, 2, 3, 4].map(syntheticPicture);

describe("a person's square", () => {
  test("without a picture it is the monogram and nothing is fetched", () => {
    const html = renderToStaticMarkup(<Avatar name="가상참여자" size={34} />);
    expect(html).toContain(">가<");
    expect(html).not.toContain("<img");
  });

  test("with one, the picture is laid over the monogram, which stays", () => {
    const html = renderToStaticMarkup(
      <Avatar name="가상참여자" size={34} src={pictures[0]} />,
    );
    expect(html).toContain(">가<");
    expect(html).toContain("<img");
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("a room's icon", () => {
  test("one picture is a single square", () => {
    const html = renderToStaticMarkup(
      <RoomAvatar name="가상 관측소" size={48} images={pictures.slice(0, 1)} />,
    );
    expect(html).not.toContain('data-picture="grid"');
    expect(html.match(/<img/g)?.length).toBe(1);
  });

  test("two to four pictures are a grid, and a fifth is never drawn", () => {
    for (const count of [2, 3, 4, 5]) {
      const html = renderToStaticMarkup(
        <RoomAvatar
          name="가상 관측소"
          size={48}
          images={pictures.slice(0, count)}
        />,
      );
      const drawn = Math.min(count, 4);
      expect(html).toContain(`data-count="${drawn}"`);
      expect(html.match(/<img/g)?.length).toBe(drawn);
    }
  });

  test("no pictures is the room's monogram", () => {
    const html = renderToStaticMarkup(
      <RoomAvatar name="가상 관측소" size={48} images={[]} />,
    );
    expect(html).toContain(">가<");
    expect(html).not.toContain("<img");
  });
});
