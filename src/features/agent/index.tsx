import {
  type ReactNode,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { Card } from "../../ui";
import styles from "./Agent.module.css";
import { AGENT_COPY } from "./copy";
import { modelContextOf, registerAgentTools } from "./registry";
import type { AgentSnapshot, AgentToolsState } from "./state";
import type { AgentTool } from "./tools";

export { AGENT_COPY } from "./copy";
export { modelContextOf, registerAgentTools } from "./registry";
export { agentSourceOf } from "./source";
export { AgentToolsState } from "./state";
export { createAgentTools } from "./tools";

const CLOCK = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** How long the mark stays after a call ends, so a fast read is still seen. */
const LINGER = 1500;

function useAgentSnapshot(state: AgentToolsState): AgentSnapshot {
  return useSyncExternalStore(
    state.subscribe,
    state.getSnapshot,
    state.getSnapshot,
  );
}

/**
 * Registers the tools while the experiment is on, and withdraws every one of
 * them the moment it is turned off, the room changes hands, or this tab goes
 * away. A browser without `document.modelContext` is left completely alone.
 */
export function useAgentTools(
  state: AgentToolsState,
  tools: () => readonly AgentTool[],
): AgentSnapshot {
  const snapshot = useAgentSnapshot(state);
  useEffect(() => {
    state.setSupported(modelContextOf(document) !== null);
  }, [state]);
  useEffect(() => {
    const context = modelContextOf(document);
    if (!snapshot.enabled || !context) return;
    // Owned before the first registration, so switching off never waits on it.
    const withdraw = new AbortController();
    // A registration the browser refuses withdraws the ones it already took.
    registerAgentTools(context, tools(), state.begin, withdraw.signal).catch(
      () => withdraw.abort(),
    );
    return () => withdraw.abort();
  }, [state, snapshot.enabled, tools]);
  return snapshot;
}

function CallLog({ snapshot }: { snapshot: AgentSnapshot }) {
  if (snapshot.calls.length === 0)
    return <p className={styles.empty}>{AGENT_COPY.logEmpty}</p>;
  return (
    <ul className={styles.log} data-ui="agent-log">
      {snapshot.calls.map((call) => (
        <li key={call.id} className={styles.call} data-tool={call.name}>
          <span className={styles.callName}>{call.name}</span>
          <span className={styles.time}>{CLOCK.format(call.at)}</span>
          <span className={styles.callState}>
            {call.ok === false ? AGENT_COPY.failed : AGENT_COPY.finished}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 설정's agent card: one experimental switch, off until somebody reads the
 * warning and says yes, and the record of what has been read since.
 */
export function AgentToolsCard({ state }: { state: AgentToolsState }) {
  const snapshot = useAgentSnapshot(state);
  const [confirming, setConfirming] = useState(false);
  const switchId = useId();
  return (
    <Card title={AGENT_COPY.title} ui="agent-card">
      <div className={styles.row}>
        <span className={styles.rowText}>
          <label className={styles.name} htmlFor={switchId}>
            {AGENT_COPY.label}
          </label>
          <span className={styles.hint}>
            {snapshot.supported ? AGENT_COPY.hint : AGENT_COPY.unsupported}
          </span>
        </span>
        <input
          id={switchId}
          className={styles.toggle}
          data-ui="agent-toggle"
          type="checkbox"
          role="switch"
          aria-checked={snapshot.enabled}
          checked={snapshot.enabled}
          disabled={!snapshot.supported}
          onChange={(event) => {
            if (event.currentTarget.checked) setConfirming(true);
            else {
              setConfirming(false);
              state.setEnabled(false);
            }
          }}
        />
      </div>
      {confirming && !snapshot.enabled ? (
        <div className={styles.warning} data-ui="agent-warning">
          <p className={styles.warningTitle}>{AGENT_COPY.warning}</p>
          <p className={styles.hint}>{AGENT_COPY.warningBody}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              data-ui="agent-confirm"
              onClick={() => {
                state.setEnabled(true);
                setConfirming(false);
              }}
            >
              {AGENT_COPY.confirm}
            </button>
            <button
              type="button"
              className={styles.quiet}
              data-ui="agent-cancel"
              onClick={() => setConfirming(false)}
            >
              {AGENT_COPY.cancel}
            </button>
          </div>
        </div>
      ) : null}
      <section aria-label={AGENT_COPY.logTitle}>
        <p className={styles.name}>{AGENT_COPY.logTitle}</p>
        <CallLog snapshot={snapshot} />
      </section>
    </Card>
  );
}

/** The mark in the corner while an agent is reading, naming what it reads. */
export function AgentActivity({ state }: { state: AgentToolsState }) {
  const snapshot = useAgentSnapshot(state);
  const [lingering, setLingering] = useState<string | null>(null);
  useEffect(() => {
    if (snapshot.running !== null) {
      setLingering(snapshot.running);
      return;
    }
    if (lingering === null) return;
    const timer = setTimeout(() => setLingering(null), LINGER);
    return () => clearTimeout(timer);
  }, [snapshot.running, lingering]);
  const name = snapshot.running ?? lingering;
  if (!snapshot.enabled || name === null) return null;
  return (
    <p
      className={styles.activity}
      role="status"
      data-ui="agent-activity"
      data-tool={name}
    >
      <span className={styles.dot} data-ui="agent-dot" aria-hidden="true" />
      <span data-ui="theme-loader" aria-hidden="true" />
      {AGENT_COPY.reading(AGENT_COPY.what[name] ?? AGENT_COPY.unknownTool)}
    </p>
  );
}

export type AgentEntryActions = ReactNode;
