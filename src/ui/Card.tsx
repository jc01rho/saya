import { type ReactNode, useId } from "react";
import styles from "./Card.module.css";
import { cx } from "./cx";

/** The scrolling grid a wide view (연결, 설정) lays its cards in. */
export function CardGrid({
  ui,
  children,
}: {
  ui: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.pane} data-ui={ui}>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}

/** One titled card in a {@link CardGrid}; `wide` spans every column. */
export function Card({
  title,
  ui,
  wide = false,
  children,
}: {
  title: string;
  ui: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const heading = useId();
  return (
    <section
      className={cx(styles.card, wide && styles.wide)}
      data-ui={ui}
      aria-labelledby={heading}
    >
      <h2 className={styles.title} id={heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}
