import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { unfurlPlugin } from "./server/plugin";

export default defineConfig(({ mode }) => {
  // These server-only variables must never use Vite's browser-exposed prefix.
  const env = loadEnv(mode, process.cwd(), "SAYA_");
  const token = env.SAYA_CORE_TOKEN;

  return {
    // The unfurl endpoint lives on /unfurl, deliberately outside /api: it is a
    // facility of the proxy, never part of the contract the cores answer.
    plugins: [react(), unfurlPlugin()],
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: env.SAYA_CORE_URL || "http://127.0.0.1:8765",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?=\/|\?|$)/, ""),
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      },
    },
  };
});
