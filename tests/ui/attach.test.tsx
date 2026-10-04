import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ATTACH_COPY, AttachButton, pickable } from "../../src/features/attach";
import { StagedFile } from "../../src/features/attach/Staged";

const file = (bytes: number, name = "synthetic.png") =>
  new File([new Uint8Array(bytes)], name, { type: "image/png" });

const staged = (props: Partial<Parameters<typeof StagedFile>[0]> = {}) =>
  renderToStaticMarkup(
    <StagedFile
      file={file(3)}
      maxBytes={10}
      busy={false}
      onSend={() => {}}
      onCancel={() => {}}
      {...props}
    />,
  );

describe("attaching a file", () => {
  test("the clip is a labelled button over the browser's own picker", () => {
    const html = renderToStaticMarkup(<AttachButton onPick={() => {}} />);
    expect(html).toContain(`aria-label="${ATTACH_COPY.pick}"`);
    expect(html).toContain('type="file"');
  });

  test("the photo button asks the browser for pictures only", () => {
    const html = renderToStaticMarkup(<AttachButton photo onPick={() => {}} />);
    expect(html).toContain(`aria-label="${ATTACH_COPY.pickPhoto}"`);
    expect(html).toContain('accept="image/*"');
    expect(
      renderToStaticMarkup(<AttachButton onPick={() => {}} />),
    ).not.toContain("accept=");
  });

  test("a declared type list makes the picker offer exactly those", () => {
    const html = renderToStaticMarkup(
      <AttachButton
        photo
        accept={pickable(["image/jpeg", "image/png"]).accept}
        onPick={() => {}}
      />,
    );
    expect(html).toContain('accept="image/jpeg,image/png"');
  });

  test("pickable narrows to images, builds the accept list, and guards a file", () => {
    const images = pickable(["image/jpeg", "image/png", "image/gif"]);
    expect(images.imagesOnly).toBe(true);
    expect(images.accept).toBe("image/jpeg,image/png,image/gif");
    expect(images.accepts(file(3, "a.png"))).toBe(true);
    expect(
      images.accepts(
        new File([new Uint8Array(3)], "a.txt", { type: "text/plain" }),
      ),
    ).toBe(false);

    const mixed = pickable(["image/png", "video/mp4"]);
    expect(mixed.imagesOnly).toBe(false);
    expect(mixed.accept).toBe("image/png,video/mp4");

    const any = pickable(undefined);
    expect(any.imagesOnly).toBe(false);
    expect(any.accept).toBeUndefined();
    expect(
      any.accepts(new File([new Uint8Array(3)], "a.bin", { type: "" })),
    ).toBe(true);
  });

  test("a file that fits can be sent and says its name and size", () => {
    const html = staged();
    expect(html).toContain("synthetic.png");
    expect(html).toContain("3 B");
    expect(html).not.toContain('data-ui="attach-note"');
    expect(html).toMatch(/data-ui="attach-send"(?![^>]*disabled)/);
  });

  test("a file past the limit or empty says why and cannot be sent", () => {
    for (const [html, why] of [
      [staged({ file: file(11) }), ATTACH_COPY.tooLarge(10)],
      [staged({ file: file(0) }), ATTACH_COPY.empty],
    ] as const) {
      expect(html).toContain(why);
      expect(html).toMatch(
        /disabled=""[^>]*data-ui="attach-send"|data-ui="attach-send"[^>]*disabled=""/,
      );
    }
  });

  test("another reason given by the composer is said and holds the send", () => {
    const html = staged({ blocked: true, children: "설명이 너무 깁니다." });
    expect(html).toContain("설명이 너무 깁니다.");
    expect(html).toMatch(
      /disabled=""[^>]*data-ui="attach-send"|data-ui="attach-send"[^>]*disabled=""/,
    );
  });
});
