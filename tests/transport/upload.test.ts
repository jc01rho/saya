import { afterEach, describe, expect, test } from "bun:test";
import { coreUploadLimit } from "../../src/features/attach/core";
import {
  PROXY_TOO_LARGE as ADAPTER_TOO_LARGE,
  uploadFile,
} from "../../src/transport/adapters";
import {
  HttpClient,
  HttpProtocolError,
  PROXY_TOO_LARGE,
} from "../../src/transport/http";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

type Seen = { url: string; init: RequestInit | undefined };

function stub(answer: () => Response) {
  const seen: Seen[] = [];
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    seen.push({ url: String(url), init });
    return answer();
  }) as unknown as typeof fetch;
  return seen;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const file = () =>
  new File([new Uint8Array([1, 2, 3])], "synthetic.png", { type: "image/png" });
const signal = () => new AbortController().signal;

describe("core upload", () => {
  test("posts the room, the file and openRoom as a form and validates the answer", async () => {
    const seen = stub(() =>
      json({
        ok: true,
        submitted: true,
        room: "가상 방",
        roomId: "1",
        name: "synthetic.png",
        size: 3,
      }),
    );
    const outcome = await new HttpClient().upload({
      room: "1",
      file: file(),
      signal: signal(),
    });
    expect(outcome).toMatchObject({
      kind: "success",
      data: { submitted: true },
    });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.url).toBe("/api/upload");
    expect(seen[0]?.init?.method).toBe("POST");
    const form = seen[0]?.init?.body as FormData;
    expect(form.get("room")).toBe("1");
    expect(form.get("openRoom")).toBe("true");
    expect((form.get("file") as File).name).toBe("synthetic.png");
    // The browser writes the boundary; a hand-set JSON type would break the form.
    expect(seen[0]?.init?.headers).toBeUndefined();
  });

  test("a refusal keeps its code, the proxy's 413 is a refusal, and a foreign 200 is a protocol failure", async () => {
    stub(() =>
      json({ ok: false, error: { code: "AMBIGUOUS_CHAT", message: "x" } }, 409),
    );
    expect(
      await new HttpClient().upload({
        room: "1",
        file: file(),
        signal: signal(),
      }),
    ).toMatchObject({
      kind: "failure",
      status: 409,
      error: { code: "AMBIGUOUS_CHAT" },
    });

    stub(() => new Response("Request Entity Too Large", { status: 413 }));
    expect(
      await new HttpClient().upload({
        room: "1",
        file: file(),
        signal: signal(),
      }),
    ).toMatchObject({
      kind: "failure",
      status: 413,
      error: { code: PROXY_TOO_LARGE },
    });

    stub(() => json({ ok: true, submitted: "yes" }));
    await expect(
      new HttpClient().upload({ room: "1", file: file(), signal: signal() }),
    ).rejects.toBeInstanceOf(HttpProtocolError);
  });

  test("the limit comes from /health, and a core that declares none is asked again", async () => {
    let features: unknown;
    const seen = stub(() =>
      json(features === undefined ? { ok: true } : { ok: true, features }),
    );
    const http = new HttpClient();
    expect(await coreUploadLimit(http)).toBeNull();
    features = { upload: { maxBytes: 1024 } };
    expect(await coreUploadLimit(http)).toBe(1024);
    expect(await coreUploadLimit(http)).toBe(1024);
    expect(seen.map(({ url }) => url)).toEqual(["/api/health", "/api/health"]);
  });
});

describe("adapter upload", () => {
  test("posts a form with the caption and reply only when given", async () => {
    const stored = {
      ok: true,
      message: {
        id: "9",
        roomId: "r",
        sender: "가상참여자-1",
        text: "",
        kind: "media",
        sentAt: "2037-04-07T09:00:00Z",
        fromMe: true,
      },
    };
    const seen = stub(() => json(stored));
    expect(
      await uploadFile("example", { roomId: "r", file: file() }, signal()),
    ).toMatchObject({ kind: "ok" });
    await uploadFile(
      "example",
      { roomId: "r", file: file(), caption: "설명", replyTo: "3" },
      signal(),
    );
    expect(seen.map(({ url }) => url)).toEqual([
      "/adapters/example/upload",
      "/adapters/example/upload",
    ]);
    const [plain, full] = seen.map(({ init }) => init?.body as FormData);
    expect([...(plain?.keys() ?? [])].sort()).toEqual(["file", "roomId"]);
    expect(full?.get("caption")).toBe("설명");
    expect(full?.get("replyTo")).toBe("3");
    expect(seen[0]?.init?.headers).toBeUndefined();
  });

  test("a refusal keeps its code and the proxy's 413 is a refusal", async () => {
    stub(() =>
      json({ ok: false, error: { code: "FORBIDDEN", message: "x" } }, 403),
    );
    expect(
      await uploadFile("example", { roomId: "r", file: file() }, signal()),
    ).toEqual({ kind: "refused", status: 403, code: "FORBIDDEN" });
    stub(() => new Response("Request Entity Too Large", { status: 413 }));
    expect(
      await uploadFile("example", { roomId: "r", file: file() }, signal()),
    ).toEqual({ kind: "refused", status: 413, code: ADAPTER_TOO_LARGE });
    stub(() => new Response("", { status: 502 }));
    expect(
      await uploadFile("example", { roomId: "r", file: file() }, signal()),
    ).toEqual({ kind: "unreachable" });
  });
});
