import { cx } from "../ui";
import styles from "./App.module.css";

/** The way back from a wide view or a room; `always` shows it at every width. */
export function Back({
  href,
  label,
  always,
}: {
  href: string;
  label: string;
  always?: boolean;
}) {
  return (
    <a className={cx(styles.back, always && styles.always)} href={href}>
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15 5l-7 7 7 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
