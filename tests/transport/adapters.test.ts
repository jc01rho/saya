import { afterEach, describe, expect, test } from "bun:test";
import { fetchCapabilities, listAdapters } from "../../src/transport/adapters";

type FetchStub = typeof fetch;
const originalFetch = globalThis.fetch;

const capabilities = {
  ok: true,
  contract: { version: "0.1.0" },
  adapter: { name: "synthetic-adapter", version: "0.0.0" },
  provider: { id: "example", name: "Example" },
  account: { kind: "user" },
  revision: "0123456789abcdef",
  features: { "messages.send": { maxLength: 4096, receipt: "stored" } },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function html(status: number) {
  return new Response("<html><body>not this</body></html>", {
    status,
    headers: { "content-type": "text/html" },
  });
}

const requested: string[] = [];
function reply(answer: Response | Error) {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    requested.push(String(input));
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer);
  }) as unknown as FetchStub;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  requested.length = 0;
});

const signal = () => new AbortController().signal;

describe("an adapter's capabilities through the proxy", () => {
  test("a declaration in the contract's shape is connected", async () => {
    reply(json(capabilities));
    expect(await fetchCapabilities("example", signal())).toEqual({
      kind: "connected",
      capabilities: capabilities as never,
    });
    expect(requested).toEqual(["/adapters/example/capabilities"]);
  });

  test("an enum value this client does not know is still a declaration", async () => {
    reply(json({ ...capabilities, account: { kind: "future-kind" } }));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "connected",
    );
  });

  test("401 keeps its machine-readable code", async () => {
    reply(
      json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "ignored" } },
        401,
      ),
    );
    expect(await fetchCapabilities("example", signal())).toEqual({
      kind: "refused",
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  test("a proxy's 502 page or a network failure is unreachable", async () => {
    reply(html(502));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "unreachable",
    );
    reply(new TypeError("Failed to fetch"));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "unreachable",
    );
  });

  test("something that answers but is not the contract is a protocol failure", async () => {
    reply(html(200));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "protocol",
    );
    const { revision: _revision, ...missing } = capabilities;
    reply(json(missing));
    expect((await fetchCapabilities("example", signal())).kind).toBe(
      "protocol",
    );
  });

  test("an aborted request rejects instead of reporting a state", async () => {
    const controller = new AbortController();
    controller.abort();
    reply(new DOMException("aborted", "AbortError"));
    await expect(
      fetchCapabilities("example", controller.signal),
    ).rejects.toBeInstanceOf(DOMException);
  });
});

describe("the proxy's adapter index", () => {
  test("lists ids", async () => {
    reply(json({ adapters: [{ id: "telegram" }, { id: "chat-two" }] }));
    expect(await listAdapters(signal())).toEqual({
      kind: "listed",
      ids: ["telegram", "chat-two"],
    });
  });

  test("an SPA fallback page or a malformed index means no adapters are set up", async () => {
    reply(html(200));
    expect((await listAdapters(signal())).kind).toBe("unconfigured");
    reply(json({ adapters: [{ id: "../escape" }] }));
    expect((await listAdapters(signal())).kind).toBe("unconfigured");
  });

  test("no proxy at all is unreachable", async () => {
    reply(new TypeError("Failed to fetch"));
    expect((await listAdapters(signal())).kind).toBe("unreachable");
  });
});
