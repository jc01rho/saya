import type { Page } from "playwright-core";
import { bounded, deferred } from "./barriers";

/** The listener is armed synchronously; the caller triggers navigation/click afterwards. */
export function responseBarrier(
  page: Page,
  pathname: string,
  status = 200,
  timeoutMs = 10_000,
) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pathname &&
      response.status() === status,
    { timeout: timeoutMs },
  );
}

/** MutationObserver, not waitForFunction polling. Register before changing the DOM. */
export async function domBarrier(
  page: Page,
  selector: string,
  timeoutMs = 10_000,
) {
  const name = `qaSignal${crypto.randomUUID().replaceAll("-", "")}`;
  const signal = deferred<void>();
  await page.exposeFunction(name, () => signal.resolve());
  await page.evaluate(
    ({ selector, name }) => {
      const notify = () => {
        if (!document.querySelector(selector)) return false;
        const callback = Reflect.get(window, name) as () => void;
        callback();
        return true;
      };
      if (notify()) return;
      const observer = new MutationObserver(() => {
        if (notify()) observer.disconnect();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      Reflect.set(window, `${name}Cleanup`, () => observer.disconnect());
    },
    { selector, name },
  );
  return {
    wait: () =>
      bounded(signal.promise, `DOM ${selector}`, timeoutMs).finally(
        async () => {
          await page.evaluate((name) => {
            const cleanup = Reflect.get(window, `${name}Cleanup`) as
              | (() => void)
              | undefined;
            cleanup?.();
            Reflect.deleteProperty(window, `${name}Cleanup`);
          }, name);
        },
      ),
  };
}
