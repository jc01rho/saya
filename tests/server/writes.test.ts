import { describe, expect, test } from "bun:test";
import { UPLOAD_MAX_BYTES, writeVerdict } from "../../server/writes";

const write = (
  url: string,
  contentType: string | undefined,
  contentLength?: number,
  method = "POST",
) =>
  writeVerdict({
    method,
    url,
    contentType,
    contentLength:
      contentLength === undefined ? undefined : String(contentLength),
  });

describe("the development proxy's write rule", () => {
  test("JSON writes and every read go through", () => {
    expect(write("/api/send", "application/json; charset=utf-8")).toBe(
      "forward",
    );
    expect(write("/adapters/telegram/react", "application/json")).toBe(
      "forward",
    );
    expect(write("/api/rooms", undefined, undefined, "GET")).toBe("forward");
    expect(write("/unfurl?url=x", "text/plain")).toBe("forward");
  });

  test("multipart goes through only on the two upload routes", () => {
    const form = "multipart/form-data; boundary=x";
    expect(write("/api/upload", form, 10)).toBe("forward");
    expect(write("/adapters/chat-two/upload", form, 10)).toBe("forward");
    expect(write("/api/send", form, 10)).toBe(403);
    expect(write("/adapters/telegram/send", form, 10)).toBe(403);
    expect(write("/adapters/Telegram/upload", form, 10)).toBe(403);
    expect(write("/api/upload/extra", form, 10)).toBe(403);
  });

  test("any other body type is refused", () => {
    expect(write("/api/send", "text/plain")).toBe(403);
    expect(write("/api/upload", undefined)).toBe(403);
  });

  test("a declared length past the bound is refused, at the bound it goes through", () => {
    const form = "multipart/form-data; boundary=x";
    expect(write("/api/upload", form, UPLOAD_MAX_BYTES)).toBe("forward");
    expect(write("/api/upload", form, UPLOAD_MAX_BYTES + 1)).toBe(413);
  });
});
