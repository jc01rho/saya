import type { Page } from "playwright-core";
import { createElement, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { components } from "../../src/contract/decoded";
import styles from "../../src/features/thread/ThreadPane.module.css";
import { VirtualThreadTurns } from "../../src/features/thread/virtual";
import { MessageBubble } from "../../src/ui/MessageBubble";

type Message = components["schemas"]["Message"];
export interface ThreadFixtureControl {
  replace: (rows: Message[]) => void;
  ground: (height: number) => void;
}

/** Test-only data driver. The actual production list, scroll owner and bubbles are unchanged. */
export function mountThreadAnchorFixture(initial: Message[]) {
  function Fixture() {
    const [{ rows, height, revision }, setState] = useState({
      rows: initial,
      height: 120,
      revision: 0,
    });
    useLayoutEffect(() => {
      Reflect.set(window, "threadFixture", {
        replace: (rows) =>
          setState((state) => ({
            ...state,
            rows,
            revision: state.revision + 1,
          })),
        ground: (height) =>
          setState((state) => ({
            ...state,
            height,
            revision: state.revision + 1,
          })),
      } satisfies ThreadFixtureControl);
    }, []);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return createElement(
      "main",
      {
        style: {
          height: "100dvh",
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) auto",
        },
      },
      createElement(
        "section",
        {
          className: styles.wall,
          "data-ui": "thread-wall",
          "data-fixture-revision": revision,
          role: "log",
          tabIndex: 0,
        },
        createElement(VirtualThreadTurns, {
          order: rows.map((row) => row.id),
          renderRow: (id: string) => {
            const message = byId.get(id);
            return message
              ? createElement(MessageBubble, {
                  message,
                  now: new Date("2037-04-07T09:00:00Z"),
                })
              : null;
          },
        }),
      ),
      createElement(
        "div",
        {
          "data-ui": "fixture-ground",
          style: {
            height,
            background: "var(--field-ground)",
            borderTop: "1px solid var(--rule)",
          },
        },
        "가상 작성 영역",
      ),
    );
  }
  createRoot(document.body).render(createElement(Fixture));
}

export function auditThread(page: Page, id?: string) {
  return page.evaluate((id) => {
    const wall = document.querySelector<HTMLElement>('[data-ui="thread-wall"]');
    if (!wall) throw new Error("Missing thread wall");
    const top = wall.getBoundingClientRect().top;
    const rows = [...wall.querySelectorAll<HTMLElement>("[data-message-id]")];
    const first = id
      ? rows.find((row) => row.dataset.messageId === id)
      : rows.find((row) => row.getBoundingClientRect().bottom > top);
    return {
      mounted: wall.querySelectorAll("article").length,
      virtualized: wall.querySelector('[data-virtualized="true"]') !== null,
      records: Number(
        wall.querySelector<HTMLElement>('[data-ui="thread-turns"]')?.dataset
          .orderCount ?? 0,
      ),
      disclosed:
        wall.querySelector('[data-ui="thread-anchor-evicted"]') !== null,
      anchor: first?.dataset.messageId ?? null,
      offset: first ? first.getBoundingClientRect().top - top : null,
      scrollTop: wall.scrollTop,
      mode: wall.dataset.scrollMode,
      generation: Number(wall.dataset.scrollGeneration ?? 0),
      restoration: Reflect.get(window, "lastAnchorRestoration") as
        | {
            generation: number;
            anchor: { id: string; offset: number } | null;
            mode: string;
          }
        | undefined,
      remaining: wall.scrollHeight - wall.clientHeight - wall.scrollTop,
    };
  }, id);
}

export interface RestoredBarrierOptions {
  /** Wait for the window that holds exactly this many records. */
  records?: number | undefined;
  /** Wait for a settle published in this scrolling mode. */
  mode?: string;
  /** Wait for a settle after the fixture's own next state change. */
  fixtureChange?: boolean;
  /** Wait for the document's fonts to finish loading first. */
  fontLoad?: boolean;
  /** Wait for a settle fenced by a newer user-scroll generation. */
  minGeneration?: number;
}

/** Subscribe before mutation, await the controller's committed-layout event, never a sleep. */
export async function restoredBarrier(
  page: Page,
  {
    records: count,
    mode,
    fixtureChange = false,
    fontLoad = false,
    minGeneration,
  }: RestoredBarrierOptions = {},
) {
  const key = `anchor${crypto.randomUUID().replaceAll("-", "")}`;
  await page.evaluate(
    ({ key, count, mode, fixtureChange, fontLoad, minGeneration }) => {
      const wall = document.querySelector<HTMLElement>(
        '[data-ui="thread-wall"]',
      );
      if (!wall) throw new Error("Missing wall");
      const revision = Number(wall.dataset.fixtureRevision);
      Reflect.set(
        window,
        key,
        new Promise<void>((resolve, reject) => {
          let fontReady = !fontLoad;
          if (fontLoad)
            document.fonts.addEventListener(
              "loadingdone",
              () => {
                fontReady = true;
              },
              { once: true },
            );
          const timeout = setTimeout(() => {
            wall.removeEventListener("thread-anchor-restored", done);
            reject(new Error("Anchor restoration event timed out"));
          }, 10_000);
          const done = (event: Event) => {
            if (!fontReady) return;
            const detail = (event as CustomEvent).detail as {
              generation: number;
            };
            if (
              minGeneration !== undefined &&
              detail.generation < minGeneration
            )
              return;
            if (
              fixtureChange &&
              Number(wall.dataset.fixtureRevision) <= revision
            )
              return;
            if (mode !== undefined && wall.dataset.scrollMode !== mode) return;
            if (
              count !== undefined &&
              wall.querySelector<HTMLElement>("ol")?.dataset.orderCount !==
                String(count)
            )
              return;
            Reflect.set(
              window,
              "lastAnchorRestoration",
              (event as CustomEvent).detail,
            );
            clearTimeout(timeout);
            wall.removeEventListener("thread-anchor-restored", done);
            resolve();
          };
          wall.addEventListener("thread-anchor-restored", done);
        }),
      );
    },
    { key, count, mode, fixtureChange, fontLoad, minGeneration },
  );
  return () =>
    page.evaluate(async (key) => {
      await Reflect.get(window, key);
      Reflect.deleteProperty(window, key);
    }, key);
}
