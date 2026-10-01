import { cx } from "../ui";
import type { AdapterTab } from "./adapterTabs";
import styles from "./ListTabs.module.css";
import {
  ADAPTERS_HASH,
  ALL_HASH,
  adapterListHash,
  type ListMode,
  ROOMS_HASH,
} from "./routes";

const COPY = {
  group: "메신저",
  all: "전체",
  kakao: "카카오",
  adapters: "연결",
} as const;

/** The rail's sections as a row of pills, for the width where the rail is not drawn. */
export function ListTabs({
  mode,
  adapters,
}: {
  mode: ListMode;
  adapters: AdapterTab[];
}) {
  const items = [
    {
      key: "all",
      label: COPY.all,
      href: ALL_HASH,
      current: mode.kind === "all",
    },
    {
      key: "kakao",
      label: COPY.kakao,
      href: ROOMS_HASH,
      current: mode.kind === "kakao",
    },
    ...adapters.map((tab) => ({
      key: `adapter:${tab.id}`,
      label: tab.name,
      href: adapterListHash(tab.id),
      current: mode.kind === "adapter" && mode.adapterId === tab.id,
    })),
  ];
  return (
    <nav className={styles.tabs} aria-label={COPY.group} data-ui="list-tabs">
      {items.map((item) => (
        <a
          key={item.key}
          className={cx(styles.tab, item.current && styles.current)}
          href={item.href}
          aria-current={item.current || undefined}
        >
          {item.label}
        </a>
      ))}
      <a className={styles.tab} href={ADAPTERS_HASH}>
        {COPY.adapters}
      </a>
    </nav>
  );
}
