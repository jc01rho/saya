import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import {
  ADAPTER_RESPONSE_HEADERS,
  AdapterConfigError,
  adapterCaddyfile,
  adapterIndex,
  adapterProxies,
  adapterUpstreams,
} from "../../server/adapters";

const TOKEN = "synthetic-adapter-token-0123456789";

describe("adapter upstreams from the proxy's environment", () => {
  test("none listed means no adapters", () => {
    expect(adapterUpstreams({})).toEqual([]);
    expect(adapterUpstreams({ SAYA_ADAPTERS: " , " })).toEqual([]);
  });

  test("each listed id takes its own address and token", () => {
    expect(
      adapterUpstreams({
        SAYA_ADAPTERS: "telegram, chat-two",
        SAYA_ADAPTER_TELEGRAM_URL: "https://adapter.example.invalid:8790",
        SAYA_ADAPTER_TELEGRAM_TOKEN: TOKEN,
        SAYA_ADAPTER_CHAT_TWO_URL: "http://127.0.0.1:8792",
        SAYA_ADAPTER_CHAT_TWO_TOKEN: `${TOKEN}-2`,
      }),
    ).toEqual([
      {
        id: "telegram",
        url: "https://adapter.example.invalid:8790",
        token: TOKEN,
      },
      { id: "chat-two", url: "http://127.0.0.1:8792", token: `${TOKEN}-2` },
    ]);
  });

  test("a listed adapter without its address or token is refused, not skipped", () => {
    expect(() =>
      adapterUpstreams({
        SAYA_ADAPTERS: "telegram",
        SAYA_ADAPTER_TELEGRAM_URL: "https://adapter.example.invalid:8790",
      }),
    ).toThrow(AdapterConfigError);
  });

  test("ids are the contract's provider-id shape, and listed once", () => {
    for (const ids of ["Telegram", "tele gram", "../x", "telegram,telegram"])
      expect(() =>
        adapterUpstreams({
          SAYA_ADAPTERS: ids,
          SAYA_ADAPTER_TELEGRAM_URL: "https://adapter.example.invalid",
          SAYA_ADAPTER_TELEGRAM_TOKEN: TOKEN,
        }),
      ).toThrow(AdapterConfigError);
  });
});

describe("what leaves the proxy", () => {
  const upstreams = [
    {
      id: "telegram",
      url: "https://adapter.example.invalid:8790",
      token: TOKEN,
    },
  ];

  test("the index names ids and nothing else", () => {
    const index = JSON.stringify(adapterIndex(upstreams));
    expect(JSON.parse(index)).toEqual({ adapters: [{ id: "telegram" }] });
    expect(index).not.toContain(TOKEN);
    expect(index).not.toContain("adapter.example.invalid");
  });

  test("each adapter's path is stripped and its token added on the way up", () => {
    const proxies = adapterProxies(upstreams);
    expect(Object.keys(proxies)).toEqual(["/adapters/telegram/"]);
    const options = proxies["/adapters/telegram/"];
    expect(options?.target).toBe("https://adapter.example.invalid:8790");
    expect(options?.changeOrigin).toBe(true);
    expect(options?.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
    expect(options?.rewrite?.("/adapters/telegram/capabilities?x=1")).toBe(
      "/capabilities?x=1",
    );
  });
});

describe("the production proxy's adapter routes", () => {
  const env = {
    SAYA_ADAPTERS: "telegram,chat-two",
    SAYA_ADAPTER_TELEGRAM_URL: "http://127.0.0.1:8790",
    SAYA_ADAPTER_TELEGRAM_TOKEN: TOKEN,
    SAYA_ADAPTER_CHAT_TWO_URL: "https://adapter.example.invalid/chat-two/",
    SAYA_ADAPTER_CHAT_TWO_TOKEN: `${TOKEN}-2`,
  };
  const caddy = adapterCaddyfile(adapterUpstreams(env));
  const block = (id: string) =>
    caddy.slice(caddy.indexOf(`@adapter_${id} path`)).split("\n\n")[0] ?? "";

  test("the index names every listed id and the file holds no token", () => {
    expect(caddy).toContain(
      'respond `{"adapters":[{"id":"telegram"},{"id":"chat-two"}]}` 200',
    );
    expect(caddy).not.toContain(TOKEN);
    expect(adapterCaddyfile([])).toContain('respond `{"adapters":[]}` 200');
  });

  test("each adapter is stripped, sandboxed and given its own token placeholder", () => {
    expect(block("telegram")).toBe(
      [
        "@adapter_telegram path /adapters/telegram/*",
        "header @adapter_telegram {",
        '    ?Cache-Control "no-store"',
        `    >content-security-policy "default-src 'none'; sandbox"`,
        '    >x-content-type-options "nosniff"',
        "}",
        "handle @adapter_telegram {",
        "    uri strip_prefix /adapters/telegram",
        "    reverse_proxy http://127.0.0.1:8790 {",
        '        header_up Authorization "Bearer {env.SAYA_ADAPTER_TELEGRAM_TOKEN}"',
        "        flush_interval -1",
        "    }",
        "}",
      ].join("\n"),
    );
  });

  test("an https address under a path keeps its path as a rewrite and routes on its host name", () => {
    const chat = block("chat_two");
    expect(chat).toContain(
      "    uri strip_prefix /adapters/chat-two\n    rewrite * /chat-two{uri}\n",
    );
    expect(chat).toContain("reverse_proxy https://adapter.example.invalid {");
    expect(chat).toContain("header_up Host {upstream_hostport}");
    expect(chat).toContain("{env.SAYA_ADAPTER_CHAT_TWO_TOKEN}");
  });

  test("an address Caddy cannot take as an upstream is refused", () => {
    for (const url of [
      "not a url",
      "ftp://adapter.example.invalid",
      "https://user:pw@adapter.example.invalid",
      "https://adapter.example.invalid/?x=1",
    ])
      expect(() =>
        adapterCaddyfile(
          adapterUpstreams({ ...env, SAYA_ADAPTER_TELEGRAM_URL: url }),
        ),
      ).toThrow(AdapterConfigError);
  });
});

describe("what comes back through the proxy", () => {
  test("every adapter answer is sandboxed and never sniffed, whatever the adapter sent", () => {
    const options = adapterProxies([
      { id: "telegram", url: "http://127.0.0.1:8790", token: TOKEN },
    ])["/adapters/telegram/"];
    const proxy = new EventEmitter();
    options?.configure?.(proxy as never, options);
    const response = Object.assign(new EventEmitter(), {
      headers: {
        "content-type": "text/html",
        "content-security-policy": "default-src *",
      } as Record<string, string>,
    });
    proxy.emit("proxyRes", response, {}, {});
    expect(response.headers).toEqual({
      "content-type": "text/html",
      ...ADAPTER_RESPONSE_HEADERS,
    });
    expect(ADAPTER_RESPONSE_HEADERS).toEqual({
      "content-security-policy": "default-src 'none'; sandbox",
      "x-content-type-options": "nosniff",
    });
  });

  test("an adapter that dies mid-answer ends the browser's answer too; one that finishes does not", () => {
    const options = adapterProxies([
      { id: "telegram", url: "http://127.0.0.1:8790", token: TOKEN },
    ])["/adapters/telegram/"];
    const proxy = new EventEmitter();
    options?.configure?.(proxy as never, options);
    const answer = (complete: boolean) => {
      const upstream = Object.assign(new EventEmitter(), {
        headers: {} as Record<string, string>,
        complete,
      });
      let destroyed = false;
      proxy.emit(
        "proxyRes",
        upstream,
        {},
        {
          destroy() {
            destroyed = true;
          },
        },
      );
      upstream.emit("close");
      return destroyed;
    };
    expect(answer(false)).toBe(true);
    expect(answer(true)).toBe(false);
  });
});
