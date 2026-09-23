import { describe, expect, test } from "bun:test";
import { guard, isPrivateAddress } from "../../server/guard";

/**
 * The unfurl endpoint fetches an address chosen by whoever wrote the message.
 * These are the cases that decide whether that is a request-forgery primitive.
 */
describe("the address guard refuses everything that is not a public web page", () => {
  test("every private, loopback, link-local and reserved IPv4 range", () => {
    for (const address of [
      "0.0.0.0",
      "10.0.0.1",
      "127.0.0.1",
      "127.1.2.3",
      "100.64.0.1",
      "169.254.169.254", // the cloud metadata service
      "172.16.0.1",
      "172.31.255.254",
      "192.168.1.1",
      "192.0.2.1",
      "198.18.0.1",
      "224.0.0.1",
      "255.255.255.255",
    ])
      expect([address, isPrivateAddress(address)]).toEqual([address, true]);
  });

  test("ordinary public IPv4 is allowed", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1"])
      expect([address, isPrivateAddress(address)]).toEqual([address, false]);
  });

  test("IPv6 loopback, link-local, unique-local and the v4 back doors", () => {
    for (const address of [
      "::",
      "::1",
      "fe80::1",
      "fc00::1",
      "fd12:3456::1",
      "ff02::1",
      "::ffff:127.0.0.1", // v4-mapped loopback
      "::ffff:169.254.169.254",
      "2002:7f00:1::", // 6to4
      "64:ff9b::7f00:1", // NAT64
    ])
      expect([address, isPrivateAddress(address)]).toEqual([address, true]);
  });

  test("public IPv6 is allowed", () => {
    expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false);
  });

  test("a hostname that resolves to loopback is refused", async () => {
    const result = await guard("http://localhost/x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("private-address");
  });

  test("an IP literal in the URL is checked without a lookup", async () => {
    for (const raw of [
      "http://127.0.0.1/x",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/x",
      "http://[::ffff:10.0.0.1]/x",
    ]) {
      const result = await guard(raw);
      expect([raw, result.ok]).toEqual([raw, false]);
      if (!result.ok)
        expect([raw, result.reason]).toEqual([raw, "private-address"]);
    }
  });

  test("only http and https, and only the web ports", async () => {
    const cases: [string, string][] = [
      ["file:///etc/passwd", "scheme"],
      ["ftp://example.com/x", "scheme"],
      ["gopher://example.com/x", "scheme"],
      ["/relative/path", "not-absolute"],
      ["http://user:pass@example.com/", "userinfo"],
      ["http://127.0.0.1:8765/rooms", "port"],
      ["http://example.com:22/", "port"],
      ["http://example.com:6379/", "port"],
    ];
    for (const [raw, reason] of cases) {
      const result = await guard(raw);
      expect([raw, result.ok]).toEqual([raw, false]);
      if (!result.ok) expect([raw, result.reason]).toEqual([raw, reason]);
    }
  });

  test("a name that does not resolve is refused, not attempted", async () => {
    const result = await guard(
      "http://saya-unfurl-guard-should-not-resolve.invalid/",
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(["unresolvable", "private-address"]).toContain(result.reason);
  });
});
