import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-model",
  async run({ page, bridge, url, screenshot, log }) {
    const room = bridge.data.rooms.find((candidate) => candidate.readable);
    if (!room) throw new Error("Missing readable synthetic room");
    const featureNames = [
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
    ];
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const mode of [
        "success",
        "model_unconfigured",
        "source_unavailable",
        "llm_unavailable",
        "unauthorized",
        "malformed",
      ] as const) {
        await page.goto("about:blank");
        let requests = 0;
        await page.route(
          "**/api/extensions/piratetalk/v1/**",
          async (route) => {
            const path = new URL(route.request().url()).pathname;
            if (path.endsWith("/capabilities")) {
              await route.fulfill({
                json: {
                  version: "1.0.0",
                  features: Object.fromEntries(
                    featureNames.map((name) => [
                      name,
                      { available: name === "summary" || name === "question" },
                    ]),
                  ),
                  models: ["gpt-6-astra"],
                  uploadPolicy: { maxBytes: null, maxFiles: 1, kinds: [] },
                },
              });
              return;
            }
            if (!path.endsWith("/summary") && !path.endsWith("/question")) {
              await route.continue();
              return;
            }
            requests++;
            const request = route.request().postDataJSON();
            expect(request.roomId).toBe(room.id);
            expect(request.from).toBe(0);
            expect(Number.isSafeInteger(request.to)).toBe(true);
            expect(request.model).toBe("gpt-6-astra");
            const common = {
              roomId: room.id,
              from: request.from,
              to: request.to,
              model: "gpt-6-astra",
              coverage: {
                source: "archive",
                complete: false,
                stale: false,
                reason: "archive_only",
              },
            };
            if (mode === "malformed") await route.fulfill({ json: {} });
            else if (mode !== "success")
              await route.fulfill({
                status:
                  mode === "unauthorized"
                    ? 401
                    : mode === "llm_unavailable"
                      ? 502
                      : 503,
                json: {
                  ok: false,
                  error: { code: mode, detail: "Synthetic model failure" },
                },
              });
            else
              await route.fulfill({
                json: path.endsWith("/summary")
                  ? {
                      ...common,
                      summary: "MODEL_SUMMARY_FIXTURE",
                      messageCount: 6001,
                      chunkCount: 31,
                    }
                  : {
                      ...common,
                      answer: "MODEL_ANSWER_FIXTURE",
                      windowCount: 6001,
                      matchCount: 6001,
                      citations: [
                        {
                          messageId: "9007199254740993",
                          userId: "9007199254740995",
                          text: "Synthetic evidence",
                          at: 1700000000,
                        },
                      ],
                    },
              });
          },
        );
        await page.goto(`${url}/#/room/${room.id}`);
        await page
          .getByRole("button", { name: "모델 기능", exact: true })
          .click();
        await page.locator('[data-ui="piratetalk-model-open"]').click();
        await page.locator('[data-ui="piratetalk-model-all"]').check();
        const response = page.waitForResponse((value) =>
          new URL(value.url()).pathname.endsWith("/summary"),
        );
        await page.locator('[data-ui="piratetalk-model-summary"]').click();
        await response;
        if (mode === "success") {
          await page.locator('[data-ui="piratetalk-model-result"]').waitFor();
          expect(
            await page
              .locator('[data-ui="piratetalk-model-result"]')
              .textContent(),
          ).toContain("MODEL_SUMMARY_FIXTURE");
          await page
            .locator('[data-ui="piratetalk-model-question"]')
            .fill("몇 개나 왔어?");
          const answered = page.waitForResponse((value) =>
            new URL(value.url()).pathname.endsWith("/question"),
          );
          await page.locator('[data-ui="piratetalk-model-ask"]').click();
          await answered;
          await page.locator('[data-ui="piratetalk-model-citation"]').waitFor();
          expect(
            await page
              .locator('[data-ui="piratetalk-model-citation"]')
              .getAttribute("data-message-id"),
          ).toBe("9007199254740993");
          expect(requests).toBe(2);
        } else {
          await page.locator('[data-ui="piratetalk-model-error"]').waitFor();
          expect(
            await page.locator('[data-ui="piratetalk-model-result"]').count(),
          ).toBe(0);
          expect(requests).toBe(1);
        }
        await screenshot(
          `${viewport.width}-model-${mode.replaceAll("_", "-")}`,
        );
        log("model-surface", { viewport, mode, requests });
        await page.unroute("**/api/extensions/piratetalk/v1/**");
      }
    }
  },
};
