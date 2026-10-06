import { AgentToolsCard, type AgentToolsState } from "../features/agent";
import type { StoredTheme } from "../features/theme/apply";
import { ThemeCards } from "../features/theme/ThemeSheet";
import { CardGrid } from "../ui";
import styles from "./App.module.css";
import { Back } from "./Back";
import { ROOMS_HASH } from "./routes";

const COPY = {
  title: "설정",
  subtitle: "테마와 실험 기능",
  back: "목록으로",
} as const;

/** 설정: a header like 연결's, over the theme and experiment cards in one grid. */
export default function SettingsOutlet({
  agent,
  onTheme,
}: {
  agent: AgentToolsState;
  onTheme: (stored: StoredTheme) => void;
}) {
  return (
    <>
      <header className={styles.threadHead}>
        <Back href={ROOMS_HASH} label={COPY.back} />
        <div className={styles.identity}>
          <h1 className={styles.title}>{COPY.title}</h1>
          <p className={styles.subtitle}>{COPY.subtitle}</p>
        </div>
      </header>
      <CardGrid ui="settings-pane">
        <ThemeCards
          onChange={onTheme}
          beforeGallery={<AgentToolsCard state={agent} />}
        />
      </CardGrid>
    </>
  );
}
