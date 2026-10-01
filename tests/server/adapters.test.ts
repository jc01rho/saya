import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import {
  ADAPTER_RESPONSE_HEADERS,
  AdapterConfigError,
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

describe("what comes back through the proxy", () => {
  test("every adapter answer is sandboxed and never sniffed, whatever the adapter sent", () => {
    const options = adapterProxies([
      { id: "telegram", url: "http://127.0.0.1:8790", token: TOKEN },
    ])["/adapters/telegram/"];
    const proxy = new EventEmitter();
    options?.configure?.(proxy as never, options);
    const response = {
      headers: {
        "content-type": "text/html",
        "content-security-policy": "default-src *",
      } as Record<string, string>,
    };
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
});
