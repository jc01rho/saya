import type { MouseEvent } from "react";
import { COPY } from "./copy";
import { cx } from "./cx";
import styles from "./SendDoor.module.css";

export type SendDoorState = "idle" | "busy" | "disabled";

export interface SendDoorProps {
  /** busy while a request is in flight; disabled when the ledger refuses new attempts. */
  state?: SendDoorState;
  type?: "submit" | "button";
  label?: string;
  onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
}

/**
 * The send door: the only saturated surface, the only shadow, square always.
 * Time never re-enables it; only a fresh explicit user attempt does.
 */
export function SendDoor({
  state = "idle",
  type = "submit",
  label = COPY.send,
  onClick,
}: SendDoorProps) {
  const inert = state !== "idle";
  return (
    <button
      type={type}
      className={cx(styles.door, inert && styles.inert)}
      data-ui="send-door"
      data-state={state}
      disabled={inert}
      aria-busy={state === "busy" || undefined}
      onClick={onClick}
    >
      <span className={styles.label}>{label}</span>
    </button>
  );
}
