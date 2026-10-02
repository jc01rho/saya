import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdapterTab } from "../../src/app/adapterTabs";
import { ListTabs } from "../../src/app/ListTabs";
import { Rail } from "../../src/app/Rail";
import { BoundedCache } from "../../src/core/cache";
import { iconUrl } from "../../src/transport/adapters";
import { adapterMark } from "../../src/ui/mark";
import { ProviderMark } from "../../src/ui/ProviderMark";

const tab = (icon?: string): AdapterTab => ({
  id: "discord-user",
  name: "Synthetic",
  icon,
  iconSrc: iconUrl("discord-user", icon),
  unread: null,
  connection: {
    kind: "connected",
    capabilities: {
      ok: true,
      contract: { version: "0.2.5" },
      adapter: { name: "synthetic", version: "0.0.0" },
      provider: {
        id: "arbitrary",
        name: "Synthetic",
        ...(icon ? { icon } : {}),
      },
      account: { kind: "user" },
      revision: "0123456789abcdef",
      features: {},
    },
  },
});

test("icon URLs are same-origin and encode the opaque version; absent means no request", () => {
  expect(iconUrl("synthetic", undefined)).toBeUndefined();
  expect(iconUrl("synthetic", "a&b=#/?")).toBe(
    "/adapters/synthetic/icon?v=a%26b%3D%23%2F%3F",
  );
});

test("marks use names, including formerly special-cased providers", () => {
  expect(adapterMark("Discord")).toBe("D");
  expect(adapterMark("Synthetic")).toBe("S");
  expect(adapterMark("")).toBe("?");
  const html = renderToStaticMarkup(
    <ProviderMark mark={adapterMark("Synthetic")} />,
  );
  expect(html).not.toContain("<img");
  expect(html).toContain(">S<");
});

test("rail and mobile pills draw artwork only for connected, declared icons", () => {
  for (const icon of [undefined, "version-1"]) {
    const props = {
      mode: { kind: "all" } as const,
      kakaoVisible: false,
      adapters: [tab(icon)],
    };
    for (const html of [
      renderToStaticMarkup(<ListTabs {...props} />),
      renderToStaticMarkup(
        <Rail {...props} stores={new BoundedCache().stores} />,
      ),
    ]) {
      expect(html.includes("<img")).toBe(icon !== undefined);
      if (icon)
        expect(html).toContain('src="/adapters/discord-user/icon?v=version-1"');
      else expect(html).toContain(">S<");
      expect(html).not.toContain(">Dp<");
    }
  }
  const disconnected = {
    ...tab("version-1"),
    connection: { kind: "unreachable" } as const,
  };
  const html = renderToStaticMarkup(
    <ListTabs
      mode={{ kind: "all" }}
      kakaoVisible={false}
      adapters={[disconnected]}
    />,
  );
  expect(html).not.toContain("/icon");
});
