import { afterEach, describe, expect, test } from "bun:test";
import { connectionStateFor } from "../../src/features/connection";
import {
  HttpClient,
  HttpProtocolError,
  type JsonRoute,
} from "../../src/transport/http";

type FetchStub = typeof fetch;

const originalFetch = globalThis.fetch;
const controller = () => new AbortController();

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(reply: Response) {
  globalThis.fetch = (() => Promise.resolve(reply)) as unknown as FetchStub;
}

function requestHealth(client: HttpClient, signal: AbortSignal) {
  return client.request({ path: "/health", signal });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("HTTP envelope boundary", () => {
  test("covered text is opt-in on context and digest, never other routes", async () => {
    const urls: URL[] = [];
    globalThis.fetch = ((input: string | URL | Request) => {
      urls.push(new URL(String(input), "http://fixture.invalid"));
      return Promise.resolve(
        response(
          { ok: false, error: { code: "BUSY", message: "Synthetic" } },
          503,
        ),
      );
    }) as FetchStub;
    for (const enabled of [false, true]) {
      const client = new HttpClient(enabled);
      for (const path of ["/context", "/digest", "/rooms"] as const) {
        const query = new URLSearchParams({ roomId: "123", limit: "40" });
        await client.request({ path, query, signal: controller().signal });
        const url = urls.at(-1);
        expect(url?.searchParams.get("showCovered")).toBe(
          enabled && path !== "/rooms" ? "true" : null,
        );
        expect(url?.searchParams.get("roomId")).toBe("123");
        expect(query.has("showCovered")).toBe(false);
      }
    }
    await new HttpClient().request({
      path: "/context",
      signal: controller().signal,
    });
    expect(urls.at(-1)?.searchParams.has("showCovered")).toBe(false);
  });

  test("rejects an HTML response instead of JSON", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response("<html><body>proxy error</body></html>", {
          status: 502,
          headers: { "content-type": "text/html" },
        }),
      )) as unknown as FetchStub;
    const signal = controller();

    await expect(
      requestHealth(new HttpClient(), signal.signal),
    ).rejects.toBeInstanceOf(HttpProtocolError);
  });

  test("rejects a 200 success envelope without its required payload", async () => {
    stubFetch(response({ ok: true }));
    const signal = controller();

    await expect(
      new HttpClient().request({ path: "/rooms", signal: signal.signal }),
    ).rejects.toBeInstanceOf(HttpProtocolError);
  });

  test("keeps 401 authorization distinct from 503 host-not-ready", async () => {
    const client = new HttpClient();
    const unauthorized = controller();
    stubFetch(
      response(
        {
          ok: false,
          error: { code: "UNAUTHORIZED", message: "ignored by UI" },
        },
        401,
      ),
    );
    const unauthorizedResult = await requestHealth(client, unauthorized.signal);

    const unavailable = controller();
    stubFetch(
      response(
        {
          ok: false,
          error: { code: "KAKAO_NOT_RUNNING", message: "ignored by UI" },
        },
        503,
      ),
    );
    const unavailableResult = await requestHealth(client, unavailable.signal);

    expect(connectionStateFor(unauthorizedResult)).toEqual({
      kind: "unauthorized",
    });
    expect(connectionStateFor(unavailableResult)).toEqual({
      kind: "host-not-ready",
      code: "KAKAO_NOT_RUNNING",
    });
  });

  test("routes an invented error code through the default branch", async () => {
    stubFetch(
      response(
        {
          ok: false,
          error: { code: "FUTURE_CORE_ERROR", message: "ignored by UI" },
        },
        500,
      ),
    );
    const signal = controller();

    const result = await requestHealth(new HttpClient(), signal.signal);

    expect(connectionStateFor(result)).toEqual({
      kind: "default",
      code: "FUTURE_CORE_ERROR",
    });
  });

  test("does not apply a superseded response", async () => {
    let resolveFirst!: (value: Response) => void;
    const first = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    let calls = 0;
    globalThis.fetch = (() => {
      calls++;
      return calls === 1 ? first : Promise.resolve(response({ ok: true }));
    }) as unknown as FetchStub;
    const client = new HttpClient();
    const firstSignal = controller();
    const secondSignal = controller();

    const firstRequest = client.request({
      path: "/health" satisfies JsonRoute,
      signal: firstSignal.signal,
      generationKey: "health",
    });
    const secondResult = await client.request({
      path: "/health" satisfies JsonRoute,
      signal: secondSignal.signal,
      generationKey: "health",
    });
    resolveFirst(response({ ok: true }));

    expect(secondResult).toEqual({ kind: "success", data: { ok: true } });
    await expect(firstRequest).resolves.toEqual({ kind: "discarded" });
  });
});
