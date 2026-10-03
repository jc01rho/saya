import type { Page } from "playwright-core";

export async function enableHistorySearch(page: Page): Promise<void> {
  await page.route(
    "**/api/extensions/piratetalk/v1/capabilities",
    async (route) => {
      const features = Object.fromEntries(
        [
          "reply",
          "thread",
          "mentions",
          "media",
          "stickers",
          "reactions",
          "history",
          "search",
          "readLocal",
          "people",
          "summary",
          "question",
        ].map((name) => [
          name,
          {
            available: name === "history" || name === "search",
            ...(name === "history" || name === "search"
              ? {}
              : { reason: "not_implemented" }),
          },
        ]),
      );
      await route.fulfill({
        json: {
          version: "1.0.0",
          features,
          models: [],
          uploadPolicy: { maxBytes: null, maxFiles: 1, kinds: [] },
        },
      });
    },
  );
}
