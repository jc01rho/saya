import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ClientStores } from "../../core/stores";
import { cx } from "../../ui";
import type { HistorySource } from "../history/source";
import { readFailureCopy, useRead } from "../reads";
import reads from "../reads/reads.module.css";
import { useSlice } from "../rooms";
import { RECAP_COPY } from "./copy";
import { downloadCanvas, paintRecap, paletteOf, recapFilename } from "./image";
import styles from "./Recap.module.css";
import {
  type Counted,
  PERIODS,
  type Period,
  type Recap,
  recapOf,
  SENDER_LIMIT,
} from "./stats";

function Chips({ items, ui }: { items: readonly Counted[]; ui: string }) {
  if (items.length === 0)
    return (
      <p className={styles.none} data-ui={ui}>
        {RECAP_COPY.none}
      </p>
    );
  return (
    <ul className={styles.chips} data-ui={ui}>
      {items.map((item) => (
        <li key={item.key} className={styles.chip}>
          <span className={styles.chipKey}>{item.key}</span>
          <span className={styles.chipCount}>{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

function People({ recap }: { recap: Recap }) {
  const rows = recap.senders.slice(0, SENDER_LIMIT);
  const max = rows[0]?.count ?? 1;
  if (rows.length === 0)
    return (
      <p className={styles.none} data-ui="recap-people">
        {RECAP_COPY.none}
      </p>
    );
  return (
    <ul className={styles.people} data-ui="recap-people">
      {rows.map((row) => (
        <li key={row.senderId} className={styles.person}>
          <span className={styles.personName}>
            {row.fromMe ? RECAP_COPY.me : row.sender}
          </span>
          <span className={styles.bar} aria-hidden="true">
            <span
              className={styles.barFill}
              style={{ "--share": row.count / max } as CSSProperties}
            />
          </span>
          <span className={styles.personCount}>
            {RECAP_COPY.count(row.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Heat({ recap }: { recap: Recap }) {
  const max = Math.max(1, ...recap.heatmap.flat());
  return (
    <div className={styles.heat} data-ui="recap-heatmap">
      {recap.heatmap.map((hours, day) => (
        <div key={RECAP_COPY.days[day]} style={{ display: "contents" }}>
          <span className={styles.heatDay} aria-hidden="true">
            {RECAP_COPY.days[day]}
          </span>
          <ul
            className={styles.heatRow}
            aria-label={`${RECAP_COPY.days[day]}요일`}
          >
            {hours
              .map((count, hour) => ({ hour, count }))
              .map((cell) => (
                <li
                  key={cell.hour}
                  className={styles.heatCell}
                  data-count={cell.count}
                  style={{ "--heat": cell.count / max } as CSSProperties}
                  title={RECAP_COPY.heatmapCell(day, cell.hour, cell.count)}
                >
                  <span className="sr-only">
                    {RECAP_COPY.heatmapCell(day, cell.hour, cell.count)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className={styles.heatHours} aria-hidden="true">
        {[0, 6, 12, 18].map((hour) => (
          <span key={hour}>{hour}시</span>
        ))}
      </p>
    </div>
  );
}

function RecapCard({ recap, title }: { recap: Recap; title: string }) {
  return (
    <article
      className={styles.card}
      data-ui="recap-card"
      data-period={recap.period}
    >
      <div>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardSub}>
          {RECAP_COPY.period[recap.period]} {RECAP_COPY.title} ·{" "}
          {RECAP_COPY.range(recap.range.from, recap.range.to)}
        </p>
      </div>
      <ul className={styles.numbers}>
        <li className={styles.number}>
          <span className={styles.numberValue} data-ui="recap-count">
            {RECAP_COPY.count(recap.count)}
          </span>
          <span className={styles.numberLabel}>{RECAP_COPY.messages}</span>
        </li>
        <li className={styles.number}>
          <span className={styles.numberValue}>
            {RECAP_COPY.people(recap.speakers)}
          </span>
          <span className={styles.numberLabel}>{RECAP_COPY.speakers}</span>
        </li>
        <li className={styles.number}>
          <span className={styles.numberValue}>
            {RECAP_COPY.count(recap.photos)}
          </span>
          <span className={styles.numberLabel}>{RECAP_COPY.photos}</span>
        </li>
      </ul>
      <p className={styles.dates} data-ui="recap-dates">
        {RECAP_COPY.first}{" "}
        {recap.first ? (
          <time dateTime={recap.first.toISOString()}>
            {RECAP_COPY.date(recap.first)}
          </time>
        ) : (
          RECAP_COPY.none
        )}
        {recap.last ? (
          <>
            {" · "}
            {RECAP_COPY.last}{" "}
            <time dateTime={recap.last.toISOString()}>
              {RECAP_COPY.date(recap.last)}
            </time>
          </>
        ) : null}
      </p>
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{RECAP_COPY.words}</h4>
        <Chips items={recap.words} ui="recap-words" />
      </section>
      <section className={cx(styles.section, styles.emoji)}>
        <h4 className={styles.sectionTitle}>{RECAP_COPY.emoji}</h4>
        <Chips items={recap.emoji} ui="recap-emoji" />
      </section>
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{RECAP_COPY.senders}</h4>
        <People recap={recap} />
      </section>
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{RECAP_COPY.heatmap}</h4>
        <Heat recap={recap} />
        {recap.busiest ? (
          <p className={styles.busiest} data-ui="recap-busiest">
            {RECAP_COPY.busiest(recap.busiest.day, recap.busiest.hour)}
          </p>
        ) : null}
      </section>
    </article>
  );
}

/**
 * 결산 of one room: the newest window the contract offers, counted on this
 * device for 올해 or 최근 30일 — who spoke, which words and emoji, which hours —
 * and saved as a picture only through the browser's own download.
 */
export default function RecapSheet({
  stores,
  history,
  roomId,
  onClose,
}: {
  stores: ClientStores;
  history: HistorySource;
  roomId: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const group = useId();
  const [now] = useState(() => new Date());
  const [period, setPeriod] = useState<Period>("year");
  const [saving, setSaving] = useState<"idle" | "busy" | "failed">("idle");
  const roomSlice = useSlice(stores, `room.${roomId}`);
  const run = useCallback(() => history.read(roomId), [history, roomId]);
  const [state, retry] = useRead(roomId, run);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  const answer =
    state.phase === "ready" && state.data.room.id === roomId
      ? state.data
      : null;
  const title =
    roomSlice?.room.title ?? answer?.room.title ?? RECAP_COPY.untitled;
  const recap = useMemo(
    () =>
      answer ? recapOf(answer.messages, answer.coverage, period, now) : null,
    [answer, period, now],
  );

  const save = async () => {
    if (!recap || !dialog.current) return;
    setSaving("busy");
    try {
      const canvas = dialog.current.ownerDocument.createElement("canvas");
      paintRecap(canvas, {
        recap,
        title,
        palette: paletteOf(dialog.current.ownerDocument.documentElement),
      });
      await downloadCanvas(canvas, recapFilename(title, recap));
      setSaving("idle");
    } catch {
      setSaving("failed");
    }
  };

  return (
    <dialog
      ref={dialog}
      className={reads.sheet}
      aria-labelledby={headingId}
      data-ui="recap-sheet"
      onClose={onClose}
    >
      <header className={reads.head}>
        <div className={reads.heading}>
          <h2 id={headingId} className={reads.title}>
            {RECAP_COPY.title}
          </h2>
          <p className={reads.muted}>{title}</p>
        </div>
        <button
          type="button"
          className={cx(reads.action, reads.close)}
          data-ui="recap-close"
          onClick={() => dialog.current?.close()}
        >
          {RECAP_COPY.close}
        </button>
      </header>
      <div
        className={reads.body}
        data-ui="recap-body"
        aria-busy={state.phase === "loading" || undefined}
      >
        <fieldset className={styles.periods}>
          <legend>{RECAP_COPY.periodLabel}</legend>
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              name={group}
              className={reads.action}
              aria-pressed={period === value}
              data-ui="recap-period"
              data-period={value}
              onClick={() => setPeriod(value)}
            >
              {RECAP_COPY.period[value]}
            </button>
          ))}
        </fieldset>
        {state.phase === "loading" ? (
          <p className={reads.muted} role="status" data-ui="recap-loading">
            <span data-ui="theme-loader" aria-hidden="true" />
            {RECAP_COPY.loading}
          </p>
        ) : null}
        {state.phase === "failed" ? (
          <div className={reads.notice} role="status" data-ui="recap-failed">
            <p>
              {RECAP_COPY.failed}
              {readFailureCopy(state.failure).code ? (
                <code> {readFailureCopy(state.failure).code}</code>
              ) : null}
            </p>
            <button type="button" className={reads.action} onClick={retry}>
              {RECAP_COPY.retry}
            </button>
          </div>
        ) : null}
        {answer && recap ? (
          <>
            <div className={styles.coverage} data-ui="recap-coverage">
              {recap.windowFrom ? (
                <span>
                  {RECAP_COPY.coverage(
                    answer.messages.length,
                    recap.windowFrom,
                  )}
                </span>
              ) : null}
              {recap.beyondWindow > 0 ? (
                <span data-ui="recap-beyond">
                  {RECAP_COPY.beyond(recap.beyondWindow)}
                </span>
              ) : null}
            </div>
            {recap.count === 0 ? (
              <p className={reads.empty} data-ui="recap-empty">
                {RECAP_COPY.empty}
              </p>
            ) : (
              <>
                <RecapCard recap={recap} title={title} />
                <div className={styles.save}>
                  <button
                    type="button"
                    className={reads.action}
                    data-ui="recap-save"
                    aria-disabled={saving === "busy" || undefined}
                    onClick={() => void save()}
                  >
                    {saving === "busy" ? RECAP_COPY.saving : RECAP_COPY.save}
                  </button>
                  <span className={styles.saveHint} role="status">
                    {saving === "failed"
                      ? RECAP_COPY.saveFailed
                      : RECAP_COPY.saveHint}
                  </span>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </dialog>
  );
}
