import { expect } from "bun:test";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-rust-people-sections",
  async run({ page, url, core, screenshot, log }) {
    if (core !== "rust") throw new Error("Requires disposable Rust fixture");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("about:blank");
      await page.goto(`${url}/#/room/1001`);
      await page.getByRole("button", { name: "친구", exact: true }).click();
      const friends = page.locator('[data-ui="piratetalk-friends"]');
      for (const [section, label, expectedId] of [
        ["favorites", "즐겨찾기", "9007199254740995"],
        ["updated", "업데이트", "9007199254740995"],
        ["channels", "채널", "45"],
        ["birthday", "생일", "9007199254740995"],
        ["hidden", "숨김", "43"],
        ["blocked", "차단", "44"],
      ] as const) {
        const received = page.waitForResponse((r) => {
          const target = new URL(r.url());
          return (
            target.pathname.endsWith("/friends") &&
            target.searchParams.get("section") === section
          );
        });
        await friends.getByRole("button", { name: label, exact: true }).click();
        const response = await received;
        expect(response.ok()).toBe(true);
        const body = await response.json();
        expect(
          body.items.some(
            (item: { userId: string }) => item.userId === expectedId,
          ),
        ).toBe(true);
        const person = friends.locator(`[data-user-id="${expectedId}"]`);
        await person.waitFor({ state: "visible" });
        if (section === "birthday") {
          expect(body.items).toContainEqual(
            expect.objectContaining({ userId: expectedId, birthday: "10-03" }),
          );
          const birthday = person.getByText("10-03", { exact: true });
          await birthday.waitFor({ state: "visible" });
          await birthday.scrollIntoViewIfNeeded();
          expect(await birthday.isVisible()).toBe(true);
          log("rust-people-birthday-visible", {
            width,
            userId: expectedId,
            birthday: "10-03",
            evidenceSource: "actual-rust-calendar-fixture",
          });
        }
        await screenshot(`rust-people-${section}-${width}`);
      }
    }
  },
};
