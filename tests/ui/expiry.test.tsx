import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  carrierExpired,
  expiryOf,
  isExpired,
  statedExpiry,
} from "../../src/ui/expiry";
import { Photo } from "../../src/ui/Photo";
import { Video } from "../../src/ui/Video";

const NOW = new Date("2026-09-23T06:00:00Z");
const BEFORE = Math.floor(NOW.getTime() / 1000) - 60;
const AFTER = Math.floor(NOW.getTime() / 1000) + 60;
const signed = (expires: number) =>
  `https://talk.kakaocdn.test/x/i_1.jpg?credential=c&expires=${expires}&signature=s`;

describe("a media deadline is read from both places it can be written", () => {
  test("the expires parameter signed into the address is seconds, not millis", () => {
    expect(expiryOf(signed(AFTER))?.toISOString()).toBe(
      new Date(AFTER * 1000).toISOString(),
    );
  });

  test("a stated expiresAt is read too, and the earlier of the two wins", () => {
    const later = new Date((AFTER + 3600) * 1000).toISOString();
    const earlier = new Date((BEFORE - 3600) * 1000).toISOString();
    expect(expiryOf(signed(AFTER), later)?.getTime()).toBe(AFTER * 1000);
    expect(expiryOf(signed(AFTER), earlier)?.getTime()).toBe(
      (BEFORE - 3600) * 1000,
    );
  });

  test("an address with no deadline anywhere is never expired", () => {
    expect(expiryOf("https://example.test/a.jpg")).toBeNull();
    expect(isExpired("https://example.test/a.jpg", NOW)).toBe(false);
    expect(isExpired("not a url at all", NOW)).toBe(false);
  });

  test("garbage in either place is ignored rather than believed", () => {
    expect(expiryOf("https://e.test/a?expires=soon")).toBeNull();
    expect(expiryOf("https://e.test/a?expires=-5")).toBeNull();
    expect(expiryOf("https://e.test/a.jpg", "never")).toBeNull();
  });

  test("statedExpiry reads an unknown member without assuming its shape", () => {
    expect(statedExpiry({ expiresAt: "2026-01-01T00:00:00Z" })).toBe(
      "2026-01-01T00:00:00Z",
    );
    for (const value of [null, undefined, 42, { expiresAt: 42 }, "x", {}])
      expect(statedExpiry(value)).toBeUndefined();
  });

  test("carrierExpired uses both sources of one carrier", () => {
    expect(carrierExpired({ url: signed(AFTER) }, NOW)).toBe(false);
    expect(carrierExpired({ url: signed(BEFORE) }, NOW)).toBe(true);
    expect(
      carrierExpired(
        {
          url: "https://e.test/a.jpg",
          expiresAt: new Date(BEFORE * 1000).toISOString(),
        },
        NOW,
      ),
    ).toBe(true);
  });
});

describe("an expired address is never requested", () => {
  const photoOf = (url: string) => ({
    url,
    width: 100,
    height: 100,
    count: 1,
    images: [{ url, width: 100, height: 100 }],
  });

  test("an expired picture renders no img element at all", () => {
    const html = renderToStaticMarkup(
      <Photo photo={photoOf(signed(BEFORE))} now={NOW} />,
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("talk.kakaocdn.test");
  });

  test("a live picture still renders its address", () => {
    const html = renderToStaticMarkup(
      <Photo photo={photoOf(signed(AFTER))} now={NOW} />,
    );
    expect(html).toContain("<img");
    expect(html).toContain("talk.kakaocdn.test");
  });

  const videoOf = (url: string, expiresAt?: string) => ({
    url,
    width: 1280,
    height: 720,
    duration: 65,
    size: 1024,
    ...(expiresAt ? { expiresAt } : {}),
  });

  test("an expired video renders no video element and no address", () => {
    for (const video of [
      videoOf(signed(BEFORE)),
      videoOf(
        "https://talk.kakaocdn.test/v/1.mp4",
        new Date(BEFORE * 1000).toISOString(),
      ),
    ]) {
      const html = renderToStaticMarkup(<Video video={video} now={NOW} />);
      expect(html).not.toContain("<video");
      expect(html).not.toContain("talk.kakaocdn.test");
      expect(html).toContain('data-ui="video-expired"');
    }
  });

  test("a live video asks only for metadata, at a frame past the start", () => {
    const html = renderToStaticMarkup(
      <Video video={videoOf(signed(AFTER))} now={NOW} />,
    );
    expect(html).toContain('preload="metadata"');
    expect(html).toContain("#t=0.1");
    // The running time is shown from `duration`, which needs no request.
    expect(html).toContain(">1:05<");
  });

  test("a lazy video has no fetchable source before viewport observation", () => {
    const html = renderToStaticMarkup(
      <Video video={videoOf(signed(AFTER))} now={NOW} loading="lazy" />,
    );
    expect(html).toContain('data-ui="video"');
    expect(html).not.toContain("talk.kakaocdn.test");
  });
});
