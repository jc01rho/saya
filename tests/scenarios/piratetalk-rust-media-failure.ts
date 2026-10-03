import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-media-failure",
  async run({ page, url, core, screenshot }) {
    const control = process.env.SAYA_QA_CONTROL_URL;
    const token = process.env.SAYA_QA_CORE_TOKEN;
    if (core !== "rust" || !control || !token)
      throw new Error("Disposable control endpoint and token required");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1003`);
      await page
        .getByRole("button", { name: "파일 첨부", exact: true })
        .click();
      let sends = 0;
      const count = (request: import("playwright-core").Request) => {
        if (
          request.method() === "POST" &&
          new URL(request.url()).pathname.endsWith("/v1/send")
        )
          sends++;
      };
      page.on("request", count);
      try {
        const rejected = page.waitForResponse(
          (r) =>
            r.request().method() === "POST" &&
            new URL(r.url()).pathname.endsWith("/uploads"),
        );
        await page.locator('[data-ui="piratetalk-file-input"]').setInputFiles({
          name: "invalid.png",
          mimeType: "image/png",
          buffer: Buffer.from("not a PNG"),
        });
        expect((await rejected).ok()).toBe(false);
        await page
          .locator('[data-ui="piratetalk-media"] [role="alert"]')
          .waitFor();
        expect(sends).toBe(0);
        expect(
          await page.locator('[data-ui="piratetalk-media-send"]').isDisabled(),
        ).toBe(true);
        await screenshot(`rust-upload-rejected-${width}`);
        const staged = page.waitForResponse(
          (r) =>
            r.request().method() === "POST" &&
            new URL(r.url()).pathname.endsWith("/uploads"),
        );
        await page.locator('[data-ui="piratetalk-file-input"]').setInputFiles({
          name: "uncertain.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Synthetic uncertain media"),
        });
        expect((await staged).ok()).toBe(true);
        const armed = await fetch(`${control}/control`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            op: "arm",
            action: "send_media",
            outcome: "missing",
          }),
        });
        expect(armed.ok).toBe(true);
        const sent = page.waitForResponse(
          (r) =>
            r.request().method() === "POST" &&
            new URL(r.url()).pathname.endsWith("/v1/send"),
          { timeout: 40000 },
        );
        await page.locator('[data-ui="piratetalk-media-send"]').click();
        expect((await (await sent).json()).outcome).toBe("unconfirmed");
        await page
          .locator('[data-ui="composer-pending"][data-state="uncertain"]')
          .waitFor();
        expect(
          await page.locator('[data-ui="piratetalk-media-send"]').isDisabled(),
        ).toBe(true);
        expect(sends).toBe(1);
        await screenshot(`rust-media-unconfirmed-${width}`);
      } finally {
        page.off("request", count);
      }
    }
  },
};
