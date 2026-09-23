import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * The address guard for the unfurl endpoint.
 *
 * This endpoint fetches a URL that arrived in someone's chat message, which
 * makes it a request forgery primitive by construction: whoever wrote the
 * message chooses the address, and the fetch runs from inside the network that
 * hosts the proxy. Everything here exists to make that choice worthless.
 *
 * Nothing in this file may be imported by the client. It runs in the proxy.
 */

export type GuardFailure =
  | "not-absolute"
  | "scheme"
  | "userinfo"
  | "port"
  | "unresolvable"
  | "private-address";

export type GuardResult =
  | { ok: true; url: URL; addresses: readonly string[] }
  | { ok: false; reason: GuardFailure };

/** Only the two ports a public web page is served on; no port scanning. */
const PORTS = new Set(["", "80", "443"]);

function parts(address: string): number[] {
  return address.split(".").map((piece) => Number.parseInt(piece, 10));
}

/**
 * Every IPv4 range that is not a public internet host. Written out rather than
 * pulled from a dependency, because a wrong entry here is a hole.
 */
function isPrivateV4(address: string): boolean {
  const [a, b] = parts(address);
  if (a === undefined || b === undefined) return true;
  if (a === 0) return true; // this network
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51) return true; // TEST-NET-2
  if (a === 203 && b === 0) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast, reserved, broadcast
  return false;
}

function isPrivateV6(address: string): boolean {
  const value = address.toLowerCase().split("%")[0] ?? "";
  if (value === "::" || value === "::1") return true; // unspecified, loopback
  // An IPv4 address wearing an IPv6 hat is still that IPv4 address. Both
  // spellings must be caught: `URL` normalises `::ffff:10.0.0.1` to the hex
  // form `::ffff:a00:1`, so checking only the dotted one leaves a way in.
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(value);
  if (dotted?.[1]) return isPrivateV4(dotted[1]);
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(value);
  if (hex?.[1] && hex[2]) {
    const high = Number.parseInt(hex[1], 16);
    const low = Number.parseInt(hex[2], 16);
    return isPrivateV4(`${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`);
  }
  if (value.startsWith("fe80")) return true; // link-local
  if (/^f[cd]/.test(value)) return true; // unique local
  if (value.startsWith("ff")) return true; // multicast
  if (value.startsWith("2002:")) return true; // 6to4, reaches v4 space
  if (value.startsWith("64:ff9b")) return true; // NAT64, reaches v4 space
  return false;
}

export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateV4(address);
  if (family === 6) return isPrivateV6(address);
  return true;
}

/**
 * Validates one hop. Call it again for every redirect: a host that answered
 * publicly once can point somewhere else on the next request, and re-resolving
 * is the only thing that closes the window between the check and the fetch.
 */
export async function guard(raw: string): Promise<GuardResult> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "not-absolute" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    return { ok: false, reason: "scheme" };
  if (url.username || url.password) return { ok: false, reason: "userinfo" };
  if (!PORTS.has(url.port)) return { ok: false, reason: "port" };

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host))
    return isPrivateAddress(host)
      ? { ok: false, reason: "private-address" }
      : { ok: true, url, addresses: [host] };

  let resolved: { address: string }[];
  try {
    resolved = await lookup(host, { all: true });
  } catch {
    return { ok: false, reason: "unresolvable" };
  }
  if (!resolved.length) return { ok: false, reason: "unresolvable" };
  // One private answer condemns the name: a round-robin that sometimes returns
  // a public address must not be a way through.
  if (resolved.some((entry) => isPrivateAddress(entry.address)))
    return { ok: false, reason: "private-address" };
  return { ok: true, url, addresses: resolved.map((entry) => entry.address) };
}
