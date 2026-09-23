/**
 * When a media address stops answering.
 *
 * The client's CDN signs every address and carries the deadline in the query
 * as `expires`, in Unix seconds. A video may also state one explicitly in
 * `expiresAt`. Both are read, and the earlier wins: a request after either is
 * one the host will refuse, so the screen must not make it at all.
 *
 * This is why it is a predicate and not an error handler. An expired address
 * is never put on an `src`, so the browser never asks for it.
 */
export function expiryOf(
  url: string,
  stated?: string | undefined,
): Date | null {
  const deadlines: number[] = [];

  try {
    const signed = new URL(url).searchParams.get("expires");
    if (signed) {
      const seconds = Number(signed);
      // Seconds, not milliseconds: a 13-digit value would be the year 45000.
      if (Number.isFinite(seconds) && seconds > 0)
        deadlines.push(seconds * 1000);
    }
  } catch {
    // An address we cannot parse carries no deadline we can read.
  }

  if (stated) {
    const explicit = new Date(stated).getTime();
    if (Number.isFinite(explicit)) deadlines.push(explicit);
  }

  if (!deadlines.length) return null;
  return new Date(Math.min(...deadlines));
}

/**
 * Reads an `expiresAt` the wire happened to include. Today the contract puts
 * one on `Video` only, but unknown members are accepted and kept, so a picture
 * that starts carrying one is honoured the day it appears rather than the day
 * the type is regenerated. A boundary read, so nothing is assumed of its shape.
 */
export function statedExpiry(carrier: unknown): string | undefined {
  if (!carrier || typeof carrier !== "object") return undefined;
  const value = (carrier as { expiresAt?: unknown }).expiresAt;
  return typeof value === "string" ? value : undefined;
}

/** True only when a deadline is known and has passed; unknown is never expired. */
export function isExpired(
  url: string,
  now: Date,
  stated?: string | undefined,
): boolean {
  const deadline = expiryOf(url, stated);
  return deadline !== null && deadline.getTime() <= now.getTime();
}

/**
 * Both sources at once, for a carrier that owns its address: the deadline
 * signed into the URL, and a stated `expiresAt` whether or not its type
 * declares one today.
 */
export function carrierExpired(
  carrier: { url: string; expiresAt?: string },
  now: Date,
): boolean {
  return isExpired(carrier.url, now, statedExpiry(carrier));
}
