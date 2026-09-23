import type { ReactNode } from "react";
import type { components } from "../contract/decoded";
import styles from "./CoverageLine.module.css";
import { COPY } from "./copy";

type Coverage = components["schemas"]["Coverage"];

export type CoverageLineProps =
  | {
      /** The first row of the log: how far the local copy reaches. */
      kind: "coverage";
      coverage: Coverage;
      /** How many of the newest messages the window currently shows. */
      shown: number;
      children?: ReactNode;
    }
  | {
      /** After the 1000-newest window: no older-history route exists (G3). */
      kind: "ceiling";
      children?: ReactNode;
    }
  | {
      /** A resume gap the cursor could not cover; children hold 지금 불러오기. */
      kind: "gap";
      children?: ReactNode;
    };

/**
 * Muted statements about the edge of what the screen knows. Coverage is not
 * emptiness: an empty window is never read as "this conversation never happened".
 */
export function CoverageLine(props: CoverageLineProps) {
  let text: string;
  if (props.kind === "coverage") {
    const { coverage, shown } = props;
    const parts = [
      COPY.coverageLocal,
      `이 기기에 ${coverage.storedLocally.toLocaleString("ko-KR")}개 저장 · 최근 ${shown.toLocaleString("ko-KR")}개 표시`,
    ];
    if (coverage.hasEarlier) parts.push(COPY.coverageEarlier);
    if (!coverage.reachesLatestKnown) parts.push(COPY.coverageBehind);
    text = parts.join(" · ");
  } else text = props.kind === "ceiling" ? COPY.ceiling : COPY.gap;
  return (
    <p className={styles.line} data-ui="coverage-line" data-kind={props.kind}>
      <span>{text}</span>
      {props.children}
    </p>
  );
}
