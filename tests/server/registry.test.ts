import { afterEach, describe, expect, test } from "bun:test";
import { handleHub } from "../../server/hub";
import {
  allowedUpstream,
  Registry,
  registerHandler,
  TTL_SECONDS,
} from "../../server/registry";

const SAYA = "synthetic-register-token-0123456789abcdef";
const UPSTREAM = "synthetic-upstream-token-0123456789";

function clock() {
  let now = 1_000_000;
  return {
    now: () => now,
    advance: (seconds: number) => (now += seconds * 1000),
  };
}

function register(
  handler: (request: Request) => Promise<Response>,
  body: unknown,
  { method = "POST", token = SAYA } = {},
) {
  return handler(
    new Request("http://127.0.0.1:8798/register", {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}

const servers: { stop: (force?: boolean) => unknown }[] = [];
afterEach(() => {
  for (const server of servers.splice(0)) server.stop(true);
});

describe("who may be registered", () => {
  test("only loopback and tailnet addresses", () => {
    for (const url of [
      "http://127.0.0.1:8790",
      "http://localhost:8790",
      "http://[::1]:8790",
      "https://win.example.ts.net:8765",
      "http://100.64.0.1:8790",
      "http://100.127.255.254",
      "http://[fd7a:115c:a1e0::1]:8790",
    ])
      expect(allowedUpstream(new URL(url))).toBe(true);
    for (const url of [
      "https://example.com",
      "http://10.0.0.1",
      "http://192.168.0.5:8765",
      "http://100.128.0.1",
      "http://169.254.169.254",
      "https://ts.net.example.com",
    ])
      expect(allowedUpstream(new URL(url))).toBe(false);
  });

  test("the register route wants saya's token and a well-formed announcement", async () => {
    const registry = new Registry();
    const handler = registerHandler(registry, SAYA);
    const good = {
      kind: "adapter",
      id: "telegram",
      url: "http://127.0.0.1:8790",
      token: UPSTREAM,
    };

    expect((await register(handler, good, { token: "wrong" })).status).toBe(
      401,
    );
    expect(
      (
        await handler(
          new Request("http://127.0.0.1:8798/register", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(401);
    for (const bad of [
      { ...good, kind: "core" },
      { ...good, id: "Telegram" },
      { ...good, id: "../x" },
      { ...good, url: "ftp://127.0.0.1" },
      { ...good, url: "http://user:pw@127.0.0.1:8790" },
      { ...good, url: "http://127.0.0.1:8790/?x=1" },
      { ...good, token: "" },
      { ...good, token: "a\r\nx-injected: 1" },
    ])
      expect((await register(handler, bad)).status).toBe(400);
    const outside = await register(handler, {
      ...good,
      url: "https://example.com",
    });
    expect(outside.status).toBe(403);
    expect(registry.live()).toEqual([]);

    const accepted = await register(handler, good);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({ interval: 30, ttl: 90 });
    expect(registry.adapter("telegram")?.url).toBe("http://127.0.0.1:8790");
  });

  test("a heartbeat keeps a registration; silence or a goodbye ends it", async () => {
    const time = clock();
    const registry = new Registry(time.now);
    const handler = registerHandler(registry, SAYA);
    const telegram = {
      kind: "adapter",
      id: "telegram",
      url: "http://127.0.0.1:8790",
      token: UPSTREAM,
    };
    await register(handler, telegram);
    time.advance(TTL_SECONDS - 1);
    await register(handler, telegram);
    time.advance(TTL_SECONDS - 1);
    expect(registry.adapter("telegram")).toBeDefined();
    time.advance(1);
    expect(registry.adapter("telegram")).toBeUndefined();

    await register(handler, telegram);
    await register(
      handler,
      { kind: "adapter", id: "telegram" },
      { method: "DELETE" },
    );
    expect(registry.adapter("telegram")).toBeUndefined();
  });

  test("adapters are listed by id; the KakaoTalk core is the one that came up last", () => {
    const time = clock();
    const registry = new Registry(time.now);
    for (const id of ["telegram", "chatplus", "slack"])
      registry.register({
        kind: "adapter",
        id,
        url: "http://127.0.0.1:1",
        token: UPSTREAM,
      });
    expect(registry.adapters().map(({ id }) => id)).toEqual([
      "chatplus",
      "slack",
      "telegram",
    ]);

    registry.register({
      kind: "kakao",
      id: "kanao",
      url: "https://pc.example.ts.net:8765",
      token: UPSTREAM,
    });
    time.advance(5);
    registry.register({
      kind: "kakao",
      id: "kamado",
      url: "https://mac.example.ts.net:8765",
      token: UPSTREAM,
    });
    time.advance(5);
    // A heartbeat from the older core does not make it the newer one.
    registry.register({
      kind: "kakao",
      id: "kanao",
      url: "https://pc.example.ts.net:8765",
      token: UPSTREAM,
    });
    expect(registry.kakao()?.id).toBe("kamado");
  });
});

describe("the site's /api and /adapters through the registry", () => {
  function upstream(fetch: (request: Request) => Response | Promise<Response>) {
    const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch });
    servers.push(server);
    return `http://127.0.0.1:${server.port}`;
  }
  const site = (path: string, init?: RequestInit) =>
    new Request(`http://127.0.0.1:8797${path}`, init);

  test("the index names live adapter ids and nothing else", async () => {
    const registry = new Registry();
    registry.register({
      kind: "adapter",
      id: "slack",
      url: "http://127.0.0.1:8793",
      token: UPSTREAM,
    });
    registry.register({
      kind: "kakao",
      id: "kanao",
      url: "http://127.0.0.1:8765",
      token: UPSTREAM,
    });
    const answer = await handleHub(site("/adapters"), registry);
    const text = await answer?.text();
    expect(JSON.parse(text ?? "")).toEqual({ adapters: [{ id: "slack" }] });
    expect(text).not.toContain(UPSTREAM);
    expect(text).not.toContain("8793");
    expect(
      (await handleHub(site("/adapters", { method: "POST" }), registry))
        ?.status,
    ).toBe(405);
    expect(await handleHub(site("/assets/app.js"), registry)).toBeNull();
  });

  test("an adapter is reached stripped of its prefix, with its own token and not the browser's", async () => {
    const seen: {
      path: string;
      auth: string | null;
      cookie: string | null;
      body: string;
    }[] = [];
    const url = upstream(async (request) => {
      const u = new URL(request.url);
      seen.push({
        path: u.pathname + u.search,
        auth: request.headers.get("authorization"),
        cookie: request.headers.get("cookie"),
        body: await request.text(),
      });
      return new Response("<script>x</script>", {
        headers: {
          "content-type": "text/html",
          "content-security-policy": "default-src *",
        },
      });
    });
    const registry = new Registry();
    registry.register({
      kind: "adapter",
      id: "chat-two",
      url,
      token: UPSTREAM,
    });
    const answer = await handleHub(
      site("/adapters/chat-two/send?x=1", {
        method: "POST",
        headers: {
          authorization: "Bearer from-the-browser",
          cookie: "a=b",
          "content-type": "application/json",
        },
        body: '{"text":"hi"}',
      }),
      registry,
    );
    expect(seen).toEqual([
      {
        path: "/send?x=1",
        auth: `Bearer ${UPSTREAM}`,
        cookie: null,
        body: '{"text":"hi"}',
      },
    ]);
    expect(answer?.headers.get("content-security-policy")).toBe(
      "default-src 'none'; sandbox",
    );
    expect(answer?.headers.get("x-content-type-options")).toBe("nosniff");
    expect(answer?.headers.get("cache-control")).toBe("no-store");
    expect(
      (await handleHub(site("/adapters/nobody/rooms"), registry))?.status,
    ).toBe(404);
  });

  test("an adapter under a path keeps it, and its own cache header survives", async () => {
    let path = "";
    const url = upstream((request) => {
      path = new URL(request.url).pathname;
      return new Response("bytes", {
        headers: { "cache-control": "private, max-age=86400" },
      });
    });
    const registry = new Registry();
    registry.register({
      kind: "adapter",
      id: "slack",
      url: `${url}/slack`,
      token: UPSTREAM,
    });
    const answer = await handleHub(site("/adapters/slack/media"), registry);
    expect(path).toBe("/slack/media");
    expect(answer?.headers.get("cache-control")).toBe("private, max-age=86400");
  });

  test("/api goes to the registered core, and is 503 with none", async () => {
    let path = "";
    const url = upstream((request) => {
      path = new URL(request.url).pathname;
      return Response.json({ ok: true });
    });
    const registry = new Registry();
    expect((await handleHub(site("/api/health"), registry))?.status).toBe(503);
    registry.register({ kind: "kakao", id: "kanao", url, token: UPSTREAM });
    const answer = await handleHub(site("/api/health"), registry);
    expect(path).toBe("/health");
    expect(answer?.status).toBe(200);
    expect(answer?.headers.get("cache-control")).toBe("no-store");
    expect(answer?.headers.get("content-security-policy")).toBeNull();
  });

  test("a stream arrives event by event, before the upstream has finished", async () => {
    let finish = () => {};
    const done = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const url = upstream(() => {
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
            await done;
            controller.close();
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    });
    const registry = new Registry();
    registry.register({
      kind: "adapter",
      id: "telegram",
      url,
      token: UPSTREAM,
    });
    const answer = await handleHub(site("/adapters/telegram/stream"), registry);
    const reader = answer?.body?.getReader();
    const first = await Promise.race([
      reader?.read(),
      Bun.sleep(5000).then(() => "timeout" as const),
    ]);
    finish();
    expect(first).not.toBe("timeout");
    expect(
      new TextDecoder().decode((first as { value: Uint8Array }).value),
    ).toContain("event: ready");
    await reader?.cancel();
  });

  test("an upstream that does not answer is 502", async () => {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response(),
    });
    const url = `http://127.0.0.1:${server.port}`;
    server.stop(true);
    const registry = new Registry();
    registry.register({
      kind: "adapter",
      id: "telegram",
      url,
      token: UPSTREAM,
    });
    expect(
      (await handleHub(site("/adapters/telegram/rooms"), registry))?.status,
    ).toBe(502);
  });
});
