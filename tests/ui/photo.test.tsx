import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { components } from "../../src/contract/decoded";
import { MessageBubble } from "../../src/ui/MessageBubble";
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

const NOW = new Date("2026-09-23T06:00:00+00:00");
const markup = (photo: PhotoData) =>
  renderToStaticMarkup(<Photo photo={photo} now={NOW} />);
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

const EPOCH = "2026-09-23T06:00:00+00:00";
const now = new Date(EPOCH);

function photoMessage(text: string, count: number, kind: string) {
  return {
    id: "1",
    roomId: "2",
    senderId: "3",
    sender: "가상 참가자",
    text,
    kind,
    sentAt: EPOCH,
    fromMe: false,
    photo: album(count),
  };
}

const bubble = (message: ReturnType<typeof photoMessage>) =>
  renderToStaticMarkup(<MessageBubble message={message} now={now} />);

describe("a photo's placeholder words give way to the picture", () => {
  test("the body 사진 is not drawn beside the picture it stands for", () => {
    const html = bubble(photoMessage("사진", 1, "photo"));
    expect(html).toContain('data-ui="photo"');
    expect(html).not.toContain(">사진<");
  });

  test("사진 N장 goes when N is this message's own count", () => {
    expect(bubble(photoMessage("사진 2장", 2, "photo"))).not.toContain(
      "사진 2장",
    );
  });

  test("an unnamed kind is never printed beside a picture", () => {
    const html = bubble(photoMessage("사진", 1, "other:27"));
    expect(html).not.toContain("other:27");
    expect(html).not.toContain('data-ui="kind-label"');
  });

  test("a body someone actually typed survives", () => {
    for (const caption of ["사진 좀 보세요", "사진 3장 중에 골라줘", "여기"]) {
      const html = bubble(photoMessage(caption, 2, "photo"));
      expect([caption, html.includes(caption)]).toEqual([caption, true]);
    }
  });

  test("a video message shows its player, not 본문 없음", () => {
    const html = renderToStaticMarkup(
      <MessageBubble
        message={{
          id: "1",
          roomId: "2",
          senderId: "3",
          sender: "가상 참가자",
          text: "동영상",
          kind: "video",
          sentAt: EPOCH,
          fromMe: false,
          video: {
            url: "https://talk.kakaocdn.test/v/1.mp4",
            width: 1280,
            height: 720,
            duration: 12,
            size: 2048,
          },
        }}
        now={now}
      />,
    );
    expect(html).toContain('data-ui="video"');
    expect(html).not.toContain("본문 없음");
    expect(html).not.toContain(">동영상<");
  });

  test("without a picture the kind label still stands on its own", () => {
    const html = renderToStaticMarkup(
      <MessageBubble
        message={{
          id: "1",
          roomId: "2",
          senderId: "3",
          sender: "가상 참가자",
          text: "",
          kind: "video",
          sentAt: EPOCH,
          fromMe: false,
        }}
        now={now}
      />,
    );
    expect(html).toContain('data-ui="kind-label"');
    expect(html).toContain("동영상");
  });
});
