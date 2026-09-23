import { type ReactNode, useEffect, useId } from "react";
import { Cat } from "../Cat";
import { CoverageLine } from "../CoverageLine";
import { cx } from "../cx";
import { MessageBubble } from "../MessageBubble";
import { RoomRow } from "../RoomRow";
import { SendDoor } from "../SendDoor";
import { UnreadBadge } from "../UnreadBadge";
import {
  COVERAGE,
  COVERAGE_BEHIND,
  MESSAGES,
  NOW,
  PENDING,
  ROOMS,
} from "./fixtures";
import styles from "./Showcase.module.css";

const SWATCHES = [
  "--field-wall",
  "--field-list",
  "--field-ground",
  "--bubble-other",
  "--bubble-self",
  "--ink",
  "--ink-muted",
  "--rule",
];

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.h2}>{title}</h2>
        <p className={styles.caption}>{caption}</p>
      </div>
      {children}
    </section>
  );
}

/** Renders the same specimen twice: light, then the warm dark theme. */
function Themed({ children }: { children: ReactNode }) {
  return (
    <div className={styles.pair}>
      <div className={styles.panel} data-theme="light">
        <p className={styles.panelLabel}>라이트</p>
        {children}
      </div>
      <div className={styles.panel} data-theme="dark">
        <p className={styles.panelLabel}>웜 다크</p>
        {children}
      </div>
    </div>
  );
}

function TextAction({ label }: { label: string }) {
  return (
    <button type="button" className={styles.action}>
      {label}
    </button>
  );
}

function RoomListSpecimen() {
  return (
    <nav className={styles.listFrame} aria-label="방 목록 진열">
      <ul className={styles.list}>
        {ROOMS.map(({ room, preview, active }) => (
          <RoomRow
            key={room.id}
            room={room}
            href={`#/rooms/${encodeURIComponent(room.id)}`}
            active={active ?? false}
            preview={preview}
            now={NOW}
            onSelect={(event) => event.preventDefault()}
          />
        ))}
      </ul>
    </nav>
  );
}

function Composer() {
  const id = useId();
  return (
    <form
      className={styles.composer}
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="sr-only" htmlFor={id}>
        메시지 입력
      </label>
      <input
        id={id}
        className={styles.input}
        data-ui="composer-input"
        placeholder="메시지 입력"
        autoComplete="off"
      />
      <SendDoor />
    </form>
  );
}

function ConversationSpecimen() {
  return (
    <div className={styles.conversation}>
      <section
        className={styles.wall}
        role="log"
        aria-live="off"
        aria-label="대화 벽 진열"
      >
        <CoverageLine kind="coverage" coverage={COVERAGE} shown={40} />
        {MESSAGES.map(({ message }) => (
          <MessageBubble key={message.id} message={message} now={NOW} />
        ))}
      </section>
      <hr className={styles.ledge} />
      <div className={styles.ground}>
        {PENDING.map(({ message, state, action }) => (
          <MessageBubble
            key={message.id}
            message={message}
            now={NOW}
            state={state}
            actions={action ? <TextAction label={action} /> : undefined}
          />
        ))}
        <p className={styles.note}>
          보내면 데스크톱 앱에 쓰고 있던 초안이 지워질 수 있습니다
        </p>
        <Composer />
      </div>
    </div>
  );
}

export default function Showcase() {
  useEffect(() => {
    document.documentElement.dataset.showcase = "ready";
    return () => document.documentElement.removeAttribute("data-showcase");
  }, []);

  return (
    <div className={styles.page} data-ui="showcase">
      <header className={styles.header}>
        <p className={styles.mark}>さや</p>
        <h1 className={styles.h1}>프리미티브 진열</h1>
        <p className={styles.caption}>
          DESIGN.md r2의 토큰과 primitive를 모든 상태로 한 화면에 모은 개발용
          화면입니다. 제품 화면이 아니며 모든 데이터는 가공한 것입니다. 노란색은
          보내기 문에만 있습니다.
        </p>
      </header>

      <Section
        title="필드와 잉크"
        caption="색은 토큰만 쓴다. 강조색과 배지색은 각각 보내기 문과 배지에서만 보인다."
      >
        <Themed>
          <ul className={styles.swatches}>
            {SWATCHES.map((token) => (
              <li key={token} className={styles.swatch}>
                <span
                  className={styles.swatchChip}
                  style={{ background: `var(${token})` }}
                />
                <code>{token}</code>
              </li>
            ))}
          </ul>
        </Themed>
      </Section>

      <Section
        title="타이포그래피"
        caption="Pretendard Variable, 없으면 시스템 고딕. 이탤릭 없음, 시간은 고정폭 숫자."
      >
        <Themed>
          <div className={styles.typeSamples}>
            <p className={styles.typeBody}>
              본문 16 / 1.7 / 400 — 긴 한국어 문장을 편안하게 읽을 수 있어야
              합니다. 줄 길이는 62ch를 넘지 않고, 단어는 끊기지 않습니다.
            </p>
            <p className={styles.typeTitle}>방 제목 15 / 1.4 / 500</p>
            <p className={cx(styles.typeTitle, styles.typeTitleActive)}>
              활성 방 제목 15 / 1.4 / 600
            </p>
            <p className={styles.typeMeta}>
              화자 · 시간 · 미리보기 · 범위 · 상태어 13 / 1.45 / 400
            </p>
            <p className={cx(styles.typeMeta, styles.tabular)}>
              09:12 · 11:08 · 23:59 · 1,000개
            </p>
            <div className={styles.badges}>
              <UnreadBadge count={1} />
              <UnreadBadge count={42} />
              <UnreadBadge count={99} />
              <UnreadBadge count={143} />
              <span className={styles.typeMeta}>
                배지 숫자 12 / 1 / 600 · 0은 그리지 않음 · 99 초과는 99+
              </span>
            </div>
          </div>
        </Themed>
      </Section>

      <Section
        title="방 목록 행"
        caption="제목과 시간, 관찰된 미리보기 또는 그 부재, 데스크톱의 안 읽음 수. 활성 행은 구분선을 실제로 끊는다."
      >
        <Themed>
          <RoomListSpecimen />
        </Themed>
        <ol className={styles.notes}>
          {ROOMS.map(({ room, note }) => (
            <li key={room.id}>{note}</li>
          ))}
        </ol>
      </Section>

      <Section
        title="대화 벽, 선반, 바닥"
        caption="읽어 온 것은 선반 위, 입력만 된 것은 선반 아래. 상태어와 위치가 함께 뜻을 나른다."
      >
        <Themed>
          <ConversationSpecimen />
        </Themed>
        <ol className={styles.notes}>
          {MESSAGES.map(({ message, note }) => (
            <li key={message.id}>{note}</li>
          ))}
          {PENDING.map(({ message, note }) => (
            <li key={message.id}>{note}</li>
          ))}
        </ol>
      </Section>

      <Section
        title="안내 줄"
        caption="범위, 한계, 끊김을 말로 적는다. 비어 있음은 대화가 없었다는 뜻이 아니다."
      >
        <Themed>
          <div className={styles.lines}>
            <CoverageLine
              kind="coverage"
              coverage={COVERAGE_BEHIND}
              shown={40}
            />
            <CoverageLine kind="ceiling" />
            <CoverageLine kind="gap">
              <TextAction label="지금 불러오기" />
            </CoverageLine>
          </div>
        </Themed>
      </Section>

      <Section
        title="보내기 문"
        caption="유일한 채색 면, 유일한 그림자, 언제나 직각. 시간이 문을 다시 열지 않는다."
      >
        <Themed>
          <div className={styles.doors}>
            <div className={styles.doorState}>
              <SendDoor />
              <span className={styles.typeMeta}>idle</span>
            </div>
            <div className={styles.doorState}>
              <SendDoor state="busy" />
              <span className={styles.typeMeta}>busy · 요청 진행 중</span>
            </div>
            <div className={styles.doorState}>
              <SendDoor state="disabled" />
              <span className={styles.typeMeta}>disabled · 새 시도 불가</span>
            </div>
          </div>
        </Themed>
      </Section>

      <Section
        title="고양이"
        caption="손으로 그린 벡터. 연결 중에만 걷고, 움직임 줄이기에서는 멈춰 앉는다."
      >
        <Themed>
          <div className={styles.track}>
            <Cat motion="walk" />
          </div>
          <div className={styles.cats}>
            <Cat />
            <Cat height={48} />
            <Cat height={96} />
          </div>
        </Themed>
      </Section>
    </div>
  );
}
