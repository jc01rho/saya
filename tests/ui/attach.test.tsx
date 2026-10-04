import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ATTACH_COPY, AttachButton } from "../../src/features/attach";
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
