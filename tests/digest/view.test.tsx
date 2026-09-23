import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BoundedCache } from "../../src/core/cache";
import { DIGEST_COPY, problemCopy } from "../../src/features/digest/copy";
import { DigestView } from "../../src/features/digest/DigestSheet";
import { DigestRequests } from "../../src/features/digest/requests";
import { THREAD_COPY } from "../../src/features/thread";
import { COPY } from "../../src/ui/copy";
import {
  digestOf,
  EPOCH,
  fakeTransport,
  NOTE,
  roomFor,
  sliceFor,
  success,
  syntheticRows,
  whenSettled,
} from "./synthetic";

const room = roomFor("18491246151592761", "가상 관측소 1");
/** Nothing on this surface may say a model summarised anything (DESIGN.md truth 15). */
const FORBIDDEN = /\bAI\b|요약|summar|모델|생성/i;
const noop = () => {};

function harness(roomId: string) {
  const fake = fakeTransport();
  const cache = new BoundedCache();
  cache.selectRoom(roomId);
  const requests = new DigestRequests(fake.transport);
  const html = () =>
    renderToStaticMarkup(
      <DigestView
        stores={cache.stores}
        requests={requests}
        roomId={roomId}
        now={new Date(EPOCH)}
        headingId="digest-heading"
        onClose={noop}
        onJump={noop}
      />,
    );
  return { ...fake, cache, requests, html };
}

/** The whole `<input>` tag for a field; attribute order is React's, not the JSX's. */
function inputTag(markup: string, name: string) {
  const match = new RegExp(`<input[^>]*name="${name}"[^>]*>`).exec(markup);
  if (!match) throw new Error(`input ${name} not rendered`);
  return match[0];
}

/** The sheet's own words: the markup without the bridge's note, which is quoted, not authored here. */
function ownWords(markup: string) {
  return markup.replace(/<p[^>]*data-ui="digest-note"[^>]*>[\s\S]*?<\/p>/, "");
}

describe("digest view", () => {
  test("the sheet's own words never claim a summary or a model; the bridge's note is shown verbatim", async () => {
    const shipped = [
      ...Object.values(DIGEST_COPY).flatMap((value) =>
        typeof value === "string" ? [value] : [],
      ),
      DIGEST_COPY.scope(400, "30m", 3),
      DIGEST_COPY.count(40),
      DIGEST_COPY.unloaded(40),
      problemCopy({ field: "span", reason: "shape" }),
      problemCopy({ field: "span", reason: "zero" }),
      problemCopy({ field: "limit", reason: "count" }),
      problemCopy({ field: "highlights", reason: "count" }),
    ];
    for (const text of shipped) expect(text).not.toMatch(FORBIDDEN);
    const { pending, requests, html } = harness(room.id);
    requests.open(room.id);
    const settled = whenSettled(requests, room.id);
    const rows = syntheticRows(room.id, 40);
    pending[0]?.resolve(
      success(
        digestOf(room, {
          span: "30m",
          considered: 40,
          slices: [sliceFor(rows, 3)],
        }),
      ),
    );
    await settled;
    const markup = html();
    expect(markup).toContain(`data-ui="digest-note">${NOTE}<`);
    expect(ownWords(markup)).not.toMatch(FORBIDDEN);
    expect(markup).toContain(DIGEST_COPY.scope(40, "30m", 1));
    expect(markup).toContain(room.title);
    // Highlights are real messages, drawn with the wall's own bubble.
    expect(markup.match(/data-ui="message"/g)?.length).toBe(3);
    expect(markup.match(/data-ui="digest-highlight"/g)?.length).toBe(3);
    expect(markup).toContain("가상참여자-1");
    expect(markup).toContain(`data-ui="digest-keywords"`);
    expect(markup).toContain(">가상<");
    expect(markup).not.toContain("Invalid Date");
  });

  test("an empty digest says nothing was picked, never that the conversation is missing", async () => {
    const { pending, requests, html } = harness(room.id);
    requests.open(room.id);
    // Unanswered is not empty.
    expect(html()).toContain(DIGEST_COPY.loading);
    expect(html()).not.toContain(DIGEST_COPY.empty);
    const settled = whenSettled(requests, room.id);
    pending[0]?.resolve(
      success(digestOf(room, { span: "30m", considered: 0, slices: [] })),
    );
    await settled;
    const markup = html();
    expect(markup).toContain('data-ui="digest-empty"');
    expect(markup).toContain(DIGEST_COPY.empty);
    expect(markup).toContain('data-ui="cat"');
    expect(markup).toContain(NOTE);
    expect(markup).not.toContain('data-ui="digest-slices"');
    expect(markup).not.toContain(DIGEST_COPY.loading);
    expect(markup).not.toContain("대화가 없습니다");
    expect(markup).not.toContain("존재하지 않");
  });

  test("a highlight the wall holds offers a jump; one outside the loaded window is said to be outside, and no request is invented for it", async () => {
    const all = syntheticRows(room.id, 440);
    const { pending, cache, requests, html } = harness(room.id);
    // The wall holds the newest 40 of 440; the digest looked at all 440.
    cache.putMessages(room.id, all.slice(-40));
    const outside = all[0];
    const inside = all.at(-1);
    if (!outside || !inside) throw new Error("unreachable");
    requests.open(room.id);
    const settled = whenSettled(requests, room.id);
    pending[0]?.resolve(
      success(
        digestOf(room, {
          span: "30m",
          considered: 440,
          slices: [sliceFor([outside, inside], 2)],
        }),
      ),
    );
    await settled;
    const markup = html();
    const item = (id: string) => {
      const match = new RegExp(
        `<li[^>]*data-ui="digest-highlight"[^>]*data-highlight-id="${id}"[^>]*>[\\s\\S]*?</li>`,
      ).exec(markup);
      if (!match) throw new Error(`highlight ${id} not rendered`);
      return match[0];
    };
    const away = item(outside.id);
    expect(away).toContain('data-loaded="false"');
    expect(away).toContain(DIGEST_COPY.unloaded(40));
    expect(away).not.toContain('data-ui="digest-jump"');
    const near = item(inside.id);
    expect(near).toContain('data-loaded="true"');
    expect(near).toContain(`data-ui="digest-jump">${DIGEST_COPY.jump}<`);
    expect(near).not.toContain('data-ui="digest-unloaded"');
    // The only request the digest ever made is its own; no window was asked for on the highlight's behalf.
    expect(pending.map((entry) => entry.request.path)).toEqual(["/digest"]);
  });

  test("refused parameters are named in place; bridge refusals keep their code and offer one retry", async () => {
    const { pending, requests, html } = harness(room.id);
    expect(
      requests.load(room.id, { span: "1w", limit: 400, highlights: 21 }),
    ).toBe(false);
    let markup = html();
    expect(markup).toContain('data-ui="digest-problems"');
    expect(markup).toContain(problemCopy({ field: "span", reason: "shape" }));
    expect(markup).toContain(
      problemCopy({ field: "highlights", reason: "count" }),
    );
    expect(markup).not.toContain(
      problemCopy({ field: "limit", reason: "count" }),
    );
    expect(inputTag(markup, "span")).toContain('aria-invalid="true"');
    expect(inputTag(markup, "highlights")).toContain('aria-invalid="true"');
    expect(inputTag(markup, "limit")).not.toContain("aria-invalid");
    expect(pending).toHaveLength(0);

    requests.open(room.id);
    let settled = whenSettled(requests, room.id);
    pending[0]?.resolve({
      kind: "failure",
      status: 400,
      error: { code: "INVALID_REQUEST", message: "synthetic" },
    });
    await settled;
    markup = html();
    expect(markup).not.toContain('data-ui="digest-problems"');
    expect(markup).toMatch(
      /data-ui="digest-notice"[^>]*data-code="INVALID_REQUEST"/,
    );
    expect(markup).toContain(DIGEST_COPY.refused);
    expect(markup).toContain(THREAD_COPY.retry);
    expect(markup).not.toContain('data-ui="digest-empty"');

    requests.retry(room.id);
    settled = whenSettled(requests, room.id);
    pending[1]?.resolve({
      kind: "failure",
      status: 503,
      error: { code: "KEY_UNAVAILABLE", message: "synthetic" },
    });
    await settled;
    markup = html();
    expect(markup).toContain('data-code="KEY_UNAVAILABLE"');
    expect(markup).toContain(COPY.unreadable);
    expect(markup).toContain(THREAD_COPY.unreadableHint);

    // An invented code takes the default branch and is shown, not swallowed.
    requests.retry(room.id);
    settled = whenSettled(requests, room.id);
    pending[2]?.resolve({
      kind: "failure",
      status: 500,
      error: { code: "SYNTHETIC_UNKNOWN_CODE", message: "synthetic" },
    });
    await settled;
    markup = html();
    expect(markup).toContain('data-code="SYNTHETIC_UNKNOWN_CODE"');
    expect(markup).toContain(DIGEST_COPY.failed);
  });

  test("the form shows the parameters the room last accepted, and the held digest stays while a fresh one is in flight", async () => {
    const { pending, requests, html } = harness(room.id);
    const rows = syntheticRows(room.id, 12);
    expect(
      requests.load(room.id, { span: "2h", limit: 12, highlights: 4 }),
    ).toBe(true);
    let settled = whenSettled(requests, room.id);
    pending[0]?.resolve(
      success(
        digestOf(room, {
          span: "2h",
          considered: 12,
          slices: [sliceFor(rows, 4)],
        }),
      ),
    );
    await settled;
    let markup = html();
    expect(inputTag(markup, "span")).toContain('value="2h"');
    expect(inputTag(markup, "limit")).toContain('value="12"');
    expect(inputTag(markup, "highlights")).toContain('value="4"');
    expect(markup.match(/data-ui="digest-highlight"/g)?.length).toBe(4);

    requests.open(room.id);
    markup = html();
    expect(markup).toContain(DIGEST_COPY.refreshing);
    expect(markup.match(/data-ui="digest-highlight"/g)?.length).toBe(4);
    settled = whenSettled(requests, room.id);
    pending[1]?.resolve(
      success(
        digestOf(room, {
          span: "2h",
          considered: 12,
          slices: [sliceFor(rows, 4)],
        }),
      ),
    );
    await settled;
    expect(html()).not.toContain(DIGEST_COPY.refreshing);
  });
});
