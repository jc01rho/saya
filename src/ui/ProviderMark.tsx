import { useState } from "react";
import styles from "./ProviderMark.module.css";

export const KAKAO_ICON = "/kakao-talk.svg";

/** Keep the mark's box and initial when artwork is absent or fails. */
export function ProviderMark({
  src,
  mark,
  className,
}: {
  src?: string | undefined;
  mark: string;
  className?: string | undefined;
}) {
  const [failed, setFailed] = useState<string>();
  const image = src !== undefined && src !== failed;
  return (
    <span
      className={className}
      aria-hidden="true"
      data-icon={image || undefined}
    >
      {image ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
        />
      ) : (
        mark
      )}
    </span>
  );
}
