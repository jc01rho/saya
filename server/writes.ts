import type { Plugin } from "vite";

/** The two routes a file is sent on; nowhere else takes a multipart body. */
export const UPLOAD_ROUTE = /^\/(?:api|adapters\/[a-z][a-z0-9-]*)\/upload$/;

/** Above the largest `maxBytes` a core or adapter declares (50 MB), as in the Caddyfile. */
export const UPLOAD_MAX_BYTES = 60 * 1024 * 1024;

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * What the development proxy does with a request before forwarding it: the
 * same body rule as `deploy/Caddyfile.example`. A write to the core or an
 * adapter is JSON, or multipart on an upload route and no larger than the
 * bound; anything else is refused before it is forwarded.
 */
export function writeVerdict(request: {
  method: string | undefined;
  url: string | undefined;
  contentType: string | undefined;
  contentLength: string | undefined;
}): "forward" | 403 | 413 {
  const path = (request.url ?? "").replace(/\?.*$/, "");
  if (!path.startsWith("/api/") && !path.startsWith("/adapters/"))
    return "forward";
  if (!WRITES.has((request.method ?? "GET").toUpperCase())) return "forward";
  const type = (request.contentType ?? "").split(";")[0]?.trim().toLowerCase();
  if (type === "application/json") return "forward";
  if (type !== "multipart/form-data" || !UPLOAD_ROUTE.test(path)) return 403;
  const length = Number(request.contentLength);
  return Number.isFinite(length) && length > UPLOAD_MAX_BYTES ? 413 : "forward";
}

export function writesPlugin(): Plugin {
  return {
    name: "saya-writes",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const verdict = writeVerdict({
          method: request.method,
          url: request.url,
          contentType: request.headers["content-type"],
          contentLength: request.headers["content-length"],
        });
        if (verdict === "forward") return next();
        response.statusCode = verdict;
        response.end();
      });
    },
  };
}
