import { afterEach, describe, expect, test } from "bun:test";
import {
  dispositionName,
  HttpClient,
  HttpProtocolError,
} from "../../src/transport/http";

type FetchStub = typeof fetch;
const originalFetch = globalThis.fetch;
const signal = () => new AbortController().signal;
const ROOM = "18491246151592761";
const MESSAGE = "28000000000000107";

function reply(response: Response) {
  const seen: string[] = [];
  globalThis.fetch = ((input: RequestInfo | URL) => {
    seen.push(String(input));
    return Promise.resolve(response);
  }) as unknown as FetchStub;
  return seen;
}

const envelope = (status: number, code: string) =>
  new Response(JSON.stringify({ ok: false, error: { code, message: "x" } }), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Content-Disposition names", () => {
  test("filename* wins and is percent-decoded as UTF-8", () => {
    expect(
      dispositionName(
        `attachment; filename="report.pdf"; filename*=UTF-8''%EA%B0%80%EC%83%81%20%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf`,
      ),
    ).toBe("가상 보고서.pdf");
  });

  test("the ASCII fallback stands alone, quoted or not", () => {
    expect(dispositionName(`attachment; filename="a b.txt"`)).toBe("a b.txt");
    expect(dispositionName("attachment; filename=plain.txt")).toBe("plain.txt");
  });

  test("a broken escape falls back; no header is no name", () => {
    expect(
      dispositionName(
        `attachment; filename="safe.bin"; filename*=UTF-8''%E0%A4`,
      ),
    ).toBe("safe.bin");
    expect(dispositionName(null)).toBeNull();
    expect(dispositionName("attachment")).toBeNull();
  });
});

describe("/file", () => {
  test("a 2xx is the file whatever its type, asked with open=true", async () => {
    const seen = reply(
      new Response('{"not":"an envelope"}', {
        status: 200,
        headers: {
          "content-type": "application/json",
          "content-disposition": `attachment; filename*=UTF-8''%EA%B0%80.json`,
          "x-kanao-source": "local",
        },
      }),
    );
    const outcome = await new HttpClient().file({
      roomId: ROOM,
      messageId: MESSAGE,
      signal: signal(),
    });
    expect(outcome.kind).toBe("success");
    if (outcome.kind !== "success") return;
    expect(await outcome.blob.text()).toBe('{"not":"an envelope"}');
    expect(outcome.name).toBe("가.json");
    expect(outcome.source).toBe("local");
    const url = new URL(seen[0] ?? "", "http://saya.test");
    expect(url.pathname).toBe("/api/file");
    // Ids above 2^53 travel as the strings they are.
    expect(Object.fromEntries(url.searchParams)).toEqual({
      roomId: ROOM,
      messageId: MESSAGE,
      open: "true",
    });
  });

  test("410 FILE_EXPIRED is a failure with its code, not a download", async () => {
    reply(envelope(410, "FILE_EXPIRED"));
    const outcome = await new HttpClient().file({
      roomId: ROOM,
      messageId: MESSAGE,
      signal: signal(),
    });
    expect(outcome).toEqual({
      kind: "failure",
      status: 410,
      error: { code: "FILE_EXPIRED", message: "x" },
    });
  });

  test("an unknown source header is not guessed", async () => {
    reply(
      new Response("bytes", {
        status: 200,
        headers: { "x-kanao-source": "?" },
      }),
    );
    const outcome = await new HttpClient().file({
      roomId: ROOM,
      messageId: MESSAGE,
      signal: signal(),
    });
    expect(outcome.kind === "success" && outcome.source).toBeNull();
  });

  test("a non-2xx that is not an envelope is a protocol failure", async () => {
    reply(new Response("<html>bad gateway</html>", { status: 502 }));
    await expect(
      new HttpClient().file({
        roomId: ROOM,
        messageId: MESSAGE,
        signal: signal(),
      }),
    ).rejects.toBeInstanceOf(HttpProtocolError);
  });

  test("an aborted request is discarded before it leaves", async () => {
    const seen = reply(new Response("bytes"));
    const controller = new AbortController();
    controller.abort();
    expect(
      await new HttpClient().file({
        roomId: ROOM,
        messageId: MESSAGE,
        signal: controller.signal,
      }),
    ).toEqual({ kind: "discarded" });
    expect(seen).toHaveLength(0);
  });
});

describe("the 0.15.0 JSON reads are validated like every other route", () => {
  const room = {
    id: ROOM,
    title: "가상 관측소 1",
    kind: "group",
    type: "MultiChat",
    memberCount: 3,
    unread: 0,
    lastMessageId: null,
    lastActivityAt: null,
    readable: true,
  };

  test("a notice answer without its notice member is refused", async () => {
    reply(Response.json({ ok: true, room }));
    await expect(
      new HttpClient().request({ path: "/notice", signal: signal() }),
    ).rejects.toBeInstanceOf(HttpProtocolError);
  });

  test("null is a valid notice: the room has none", async () => {
    reply(Response.json({ ok: true, room, notice: null }));
    const outcome = await new HttpClient().request({
      path: "/notice",
      signal: signal(),
    });
    expect(outcome.kind === "success" && outcome.data.notice).toBeNull();
  });

  test("an attachment of an unknown kind is refused", async () => {
    reply(
      Response.json({
        ok: true,
        room,
        count: 1,
        attachments: [
          {
            messageId: MESSAGE,
            kind: "sticker",
            senderId: "1",
            sender: "가상참여자-1",
            sentAt: null,
            url: "https://example.invalid/a",
          },
        ],
      }),
    );
    await expect(
      new HttpClient().request({ path: "/attachments", signal: signal() }),
    ).rejects.toBeInstanceOf(HttpProtocolError);
  });

  test("MESSAGE_NOT_FOUND from /revisions keeps its status and code", async () => {
    reply(envelope(404, "MESSAGE_NOT_FOUND"));
    expect(
      await new HttpClient().request({ path: "/revisions", signal: signal() }),
    ).toEqual({
      kind: "failure",
      status: 404,
      error: { code: "MESSAGE_NOT_FOUND", message: "x" },
    });
  });
});
