import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import {
  adapterProxies,
  adaptersPlugin,
  adapterUpstreams,
} from "./server/adapters";
import { unfurlPlugin } from "./server/plugin";

export default defineConfig(({ mode }) => {
  // These server-only variables must never use Vite's browser-exposed prefix.
  const env = loadEnv(mode, process.cwd(), "SAYA_");
  const token = env.SAYA_CORE_TOKEN;
  const adapters = adapterUpstreams(env);

  return {
    // The unfurl endpoint lives on /unfurl, deliberately outside /api: it is a
    // facility of the proxy, never part of the contract the cores answer.
    plugins: [
      react(),
      unfurlPlugin(),
      adaptersPlugin(adapters),
      {
        name: "core-write-boundary",
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            const path = request.url?.split("?")[0];
            if (
              !path?.startsWith("/api/") ||
              !["POST", "PUT", "PATCH", "DELETE"].includes(request.method ?? "")
            )
              return next();
            const origin = request.headers.origin;
            const expected = `${server.config.server.https ? "https" : "http"}://${request.headers.host}`;
            const contentType = request.headers["content-type"] ?? "";
            const json = /^application\/json(?:\s*;.*)?$/i.test(contentType);
            const upload =
              request.method === "POST" &&
              path === "/api/extensions/piratetalk/v1/uploads" &&
              /^multipart\/form-data\s*;\s*boundary=(?:[A-Za-z0-9'()+_,./:=?-]{1,70}|"[A-Za-z0-9'()+_,./:=? -]{1,70}")\s*$/i.test(
                contentType,
              );
            if (
              origin !== expected ||
              request.headers["sec-fetch-site"] !== "same-origin" ||
              (!json && !upload)
            ) {
              response.statusCode = 403;
              response.end();
              return;
            }
            next();
          });
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: env.SAYA_CORE_URL || "http://127.0.0.1:8765",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?=\/|\?|$)/, ""),
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          configure(proxy) {
            proxy.on("proxyReq", (request) => {
              request.removeHeader("authorization");
              if (token) request.setHeader("authorization", `Bearer ${token}`);
            });
          },
        },
        // Messenger adapters (tsuba), one upstream each; the token is added here.
        ...adapterProxies(adapters),
      },
    },
  };
});
