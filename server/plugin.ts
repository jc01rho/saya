import type { Plugin } from "vite";
import { handleUnfurl } from "./handler";

/**
 * Mounts the unfurl endpoint on Vite's development server, on `/unfurl` rather
 * than under `/api` so it can never be mistaken for, or collide with, the
 * contract the cores answer. Production serves the same handler from
 * `bun server/serve.ts` behind the real reverse proxy.
 */
export function unfurlPlugin(): Plugin {
  return {
    name: "saya-unfurl",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url ?? "";
        if (!path.startsWith("/unfurl")) return next();
        const proxied = new Request(new URL(path, "http://127.0.0.1"), {
          method: request.method ?? "GET",
          headers: new Headers(
            Object.entries(request.headers).flatMap(([key, value]) =>
              typeof value === "string"
                ? [[key, value] as [string, string]]
                : [],
            ),
          ),
        });
        handleUnfurl(proxied)
          .then(async (answer) => {
            if (!answer) return next();
            response.statusCode = answer.status;
            answer.headers.forEach((value, key) => {
              response.setHeader(key, value);
            });
            const body = answer.body
              ? new Uint8Array(await answer.arrayBuffer())
              : null;
            response.end(body ? Buffer.from(body) : undefined);
          })
          .catch(next);
      });
    },
  };
}
