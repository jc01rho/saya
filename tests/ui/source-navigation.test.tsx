import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdapterConnection, AdapterTab } from "../../src/app/adapterTabs";
import { ListTabs } from "../../src/app/ListTabs";
import { Rail } from "../../src/app/Rail";
import { BoundedCache } from "../../src/core/cache";
import Inbox from "../../src/features/inbox";

const connections: AdapterConnection[] = [
  { kind: "checking" },
  { kind: "unreachable" },
  { kind: "protocol" },
  { kind: "refused", status: 401, code: "UNAUTHORIZED" },
  { kind: "refused", status: 403, code: "FORBIDDEN" },
  { kind: "incompatible", version: "0.3.0" },
  {
    kind: "connected",
    capabilities: {
      ok: true,
      contract: { version: "0.2.4" },
      adapter: { name: "synthetic", version: "0.0.0" },
      provider: { id: "synthetic", name: "Synthetic" },
      account: { kind: "user" },
      revision: "0123456789abcdef",
      features: {},
    },
  },
];
const adapters: AdapterTab[] = connections.map((connection, i) => ({
  id: `synthetic-${i}`,
  name: `Synthetic ${i}`,
  unread: null,
  connection,
}));

test("rail and mobile tabs link only connected adapters and a usable core", () => {
  for (const kakaoVisible of [true, false]) {
    const props = { adapters, kakaoVisible, mode: { kind: "all" } as const };
    for (const html of [
      renderToStaticMarkup(<ListTabs {...props} />),
      renderToStaticMarkup(
        <Rail {...props} stores={new BoundedCache().stores} />,
      ),
    ]) {
      expect(html.includes('href="#/rooms"')).toBe(kakaoVisible);
      for (let i = 0; i < connections.length; i++)
        expect(html.includes(`href="#/list/synthetic-${i}"`)).toBe(
          connections[i]?.kind === "connected",
        );
      expect(html).toContain('href="#/all"');
      expect(html).toContain('href="#/settings"');
      expect(html).not.toContain('href="#/adapters"');
      expect(html.indexOf('href="#/all"')).toBeLessThan(
        html.indexOf('href="#/list/'),
      );
    }
  }
});

test("all list has no failure status or retry button for unavailable sources", () => {
  const html = renderToStaticMarkup(
    <Inbox
      stores={new BoundedCache().stores}
      mode={{ kind: "all" }}
      adapters={adapters.filter((tab) => tab.connection.kind !== "checking")}
      kakao={{ state: "unavailable", onRetry() {} }}
      active={null}
      heading="Synthetic"
    />,
  );
  // The optional character is a header action, not a source retry.
  expect(
    html.replace(/<button\b[^>]*data-ui="theme-badge"[^>]*><\/button>/g, ""),
  ).not.toContain("<button");
  expect(html).not.toContain("불러오지 못");
  for (let i = 0; i < connections.length - 1; i++)
    expect(html).not.toContain(`Synthetic ${i}`);
});
