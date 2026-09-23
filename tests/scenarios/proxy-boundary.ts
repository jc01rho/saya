import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "proxy-boundary",
  async run({ bridge, page, url, log }) {
    await page.goto(`${url}/__qa/blank`, { waitUntil: "load" });

    const result = await page.evaluate(async (crossOrigin) => {
      try {
        await fetch(`${crossOrigin}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: "1", text: "synthetic" }),
        });
        return "write-completed";
      } catch {
        return "blocked";
      }
    }, bridge.url);

    if (result !== "blocked")
      throw new Error("A cross-origin browser write was not blocked");
    if (bridge.requests.some((request) => request.method === "POST"))
      throw new Error("The cross-origin browser reached the write endpoint");
    log("cross-origin-write-blocked", { target: bridge.url });
  },
};
