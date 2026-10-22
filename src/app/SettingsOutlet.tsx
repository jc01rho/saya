import { version as APP_VERSION } from "../../package.json";
import { CONTRACT_VERSION as ADAPTER_CONTRACT_VERSION } from "../contract/tsuba/version";
import { CONTRACT_VERSION as KAKAO_CONTRACT_VERSION } from "../contract/version";
import { AdaptersPane, type KakaoStatus } from "../features/adapters";
import { AgentToolsCard, type AgentToolsState } from "../features/agent";
import type { StoredTheme } from "../features/theme/apply";
import { ThemeCards } from "../features/theme/ThemeSheet";
import { Card, CardGrid, cx } from "../ui";
import styles from "./App.module.css";
import { Back } from "./Back";
import {
  ROOMS_HASH,
  SETTINGS_TABS,
  type SettingsTab,
  settingsHash,
} from "./routes";
import tabs from "./SettingsOutlet.module.css";

const COPY = {
  title: "설정",
  back: "목록으로",
  tabs: "설정 항목",
  tab: {
    theme: "테마",
    messages: "메시지",
    agent: "에이전트 도구",
    connection: "연결",
    about: "프로그램 정보",
  },
  subtitle: {
    theme: "테마와 테마 모음",
    messages: "카카오톡 메시지 표시",
    agent: "실험 기능",
    connection: "메신저 연결",
    about: "버전과 계약",
  },
  about: {
    title: "さや (saya)",
    app: "saya",
    kakao: "카카오톡 계약 (openapi.json)",
    adapter: "어댑터 계약 (tsuba)",
    star: "⭐ GitHub Star",
  },
} as const satisfies {
  tab: Record<SettingsTab, string>;
  subtitle: Record<SettingsTab, string>;
} & Record<string, unknown>;

/** 프로그램 정보: what this build is and which contracts it was generated from. */
function AboutCard() {
  const rows = [
    [COPY.about.app, APP_VERSION],
    [COPY.about.kakao, KAKAO_CONTRACT_VERSION],
    [COPY.about.adapter, ADAPTER_CONTRACT_VERSION],
  ] as const;
  return (
    <Card title={COPY.about.title} ui="about-card">
      <dl className={tabs.facts}>
        {rows.map(([label, value]) => (
          <div key={label} className={tabs.fact}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={tabs.stars}>
        <a
          className={tabs.starLink}
          href="https://github.com/sanguneo/saya"
          target="_blank"
          rel="noopener noreferrer"
        >
          {COPY.about.star}
        </a>
      </div>
    </Card>
  );
}

/**
 * 설정: a header like a room's, a row of tabs (테마, 에이전트 도구, 연결,
 * 프로그램 정보), and the chosen tab's cards under them. Each tab is its own
 * hash route, so a link can open 연결 directly.
 */
export default function SettingsOutlet({
  tab,
  agent,
  onTheme,
  kakao,
  onKakaoRetry,
  showCovered,
  onShowCovered,
}: {
  tab: SettingsTab;
  agent: AgentToolsState;
  onTheme: (stored: StoredTheme) => void;
  /** The KakaoTalk core's state, for its card in 연결. */
  kakao: KakaoStatus;
  onKakaoRetry: () => void;
  showCovered: boolean;
  onShowCovered: (enabled: boolean) => void;
}) {
  return (
    <>
      <div className={styles.top}>
        <header className={styles.threadHead}>
          <Back href={ROOMS_HASH} label={COPY.back} />
          <div className={styles.identity}>
            <h1 className={styles.title}>{COPY.title}</h1>
            <p className={styles.subtitle}>{COPY.subtitle[tab]}</p>
          </div>
        </header>
        <nav
          className={tabs.tabs}
          aria-label={COPY.tabs}
          data-ui="settings-tabs"
        >
          {SETTINGS_TABS.map((name) => (
            <a
              key={name}
              className={cx(tabs.tab, name === tab && tabs.current)}
              href={settingsHash(name)}
              aria-current={name === tab ? "page" : undefined}
              data-ui={`settings-tab-${name}`}
            >
              {COPY.tab[name]}
            </a>
          ))}
        </nav>
      </div>
      {tab === "connection" ? (
        <AdaptersPane kakao={kakao} onKakaoRetry={onKakaoRetry} />
      ) : (
        <CardGrid ui="settings-pane">
          {tab === "theme" ? (
            <ThemeCards onChange={onTheme} />
          ) : tab === "messages" ? (
            <Card title="카카오톡 메시지" ui="covered-card">
              <label className={tabs.preference}>
                <span>
                  <span className={tabs.preferenceName}>
                    세이프봇이 가린 메시지 보기
                  </span>
                  <span className={tabs.preferenceHint}>
                    기본값은 꺼짐입니다. 켜면 가려진 본문을 표시하고, 세이프봇이
                    가렸다는 표시는 유지합니다. 새 메시지는 대화 창을 다시 읽어
                    표시합니다.
                  </span>
                </span>
                <input
                  className={tabs.preferenceToggle}
                  data-ui="covered-toggle"
                  type="checkbox"
                  role="switch"
                  aria-checked={showCovered}
                  checked={showCovered}
                  onChange={(event) =>
                    onShowCovered(event.currentTarget.checked)
                  }
                />
              </label>
            </Card>
          ) : tab === "agent" ? (
            <AgentToolsCard state={agent} />
          ) : (
            <AboutCard />
          )}
        </CardGrid>
      )}
    </>
  );
}
