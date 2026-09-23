import type { Page } from "playwright-core";

export interface RoomsVirtualAudit {
  mounted: number;
  virtualized: boolean;
  ids: string[];
  activeId: string | null;
  activeHeight: number | null;
  activeDivider: string | null;
  focusedHref: string | null;
}

/** Reads the real semantic rows only; a virtual spacer never counts as a room. */
export function auditRoomsVirtual(page: Page): Promise<RoomsVirtualAudit> {
  return page.evaluate(() => {
    const list = document.querySelector<HTMLElement>('[data-ui="room-list"]');
    const rows = [
      ...document.querySelectorAll<HTMLElement>('[data-ui="room-row"]'),
    ];
    const active = rows.find((row) => row.dataset.active === "true") ?? null;
    const activeLink = active?.querySelector<HTMLAnchorElement>("a") ?? null;
    const focused = document.activeElement;
    return {
      mounted: rows.length,
      virtualized: list?.dataset.virtualized === "true",
      ids: rows.flatMap((row) => {
        const href = row.querySelector("a")?.getAttribute("href");
        return href ? [href] : [];
      }),
      activeId: activeLink?.getAttribute("href") ?? null,
      activeHeight: active?.getBoundingClientRect().height ?? null,
      activeDivider: active
        ? getComputedStyle(active).borderInlineEndColor
        : null,
      focusedHref:
        focused instanceof HTMLAnchorElement
          ? focused.getAttribute("href")
          : null,
    };
  });
}
