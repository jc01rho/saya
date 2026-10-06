import { adapterMark, cx } from "../ui";
import { KAKAO_ICON, ProviderMark } from "../ui/ProviderMark";
import type { AdapterTab } from "./adapterTabs";
import styles from "./ListTabs.module.css";
import {
  ADAPTERS_HASH,
  ALL_HASH,
  adapterListHash,
  type ListMode,
  ROOMS_HASH,
  SETTINGS_HASH,
} from "./routes";

const COPY = {
  group: "메신저",
  all: "전체",
  kakao: "카카오",
  adapters: "연결",
  settings: "설정",
} as const;

/** The rail's sections as a row of pills, for the width where the rail is not drawn. */
export function ListTabs({
  mode,
  adapters,
  kakaoVisible = true,
}: {
  mode: ListMode;
  adapters: AdapterTab[];
  kakaoVisible?: boolean;
}) {
  const items = [
    {
      key: "all",
      icon: undefined,
      mark: undefined,
      label: COPY.all,
      href: ALL_HASH,
      current: mode.kind === "all",
    },
    ...(kakaoVisible
      ? [
          {
            key: "kakao",
            icon: KAKAO_ICON,
            mark: "K",
            label: COPY.kakao,
            href: ROOMS_HASH,
            current: mode.kind === "kakao",
          },
        ]
      : []),
    ...adapters
      .filter((tab) => tab.connection.kind === "connected")
      .map((tab) => ({
        key: `adapter:${tab.id}`,
        icon: tab.icon === undefined ? undefined : tab.iconSrc,
        mark: adapterMark(tab.name),
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
          {item.mark ? (
            <ProviderMark
              className={styles.mark}
              src={item.icon}
              mark={item.mark}
            />
          ) : null}
          {item.label}
        </a>
      ))}
      <a className={styles.tab} href={ADAPTERS_HASH}>
        {COPY.adapters}
      </a>
      <a
        className={styles.tab}
        href={SETTINGS_HASH}
        data-ui="list-tabs-settings"
      >
        {COPY.settings}
      </a>
    </nav>
  );
}
