import { useId, useState } from "react";
import { expiryOf } from "../../ui";
import { YEAR_AGO_COPY } from "./copy";
import { dayKey, type YearAgo, type YearAgoPicture } from "./pick";
import styles from "./YearAgo.module.css";

function Picture({ picture, now }: { picture: YearAgoPicture; now: Date }) {
  const [failed, setFailed] = useState(false);
  const deadline = expiryOf(picture.url);
  // An expired address is never put on an `src`, so the browser never asks for it.
  const gone =
    failed || (deadline !== null && deadline.getTime() <= now.getTime());
  return (
    <li className={styles.picture} data-ui="year-ago-picture">
      {gone ? (
        <span className={styles.gone}>{YEAR_AGO_COPY.pictureGone}</span>
      ) : (
        <img
          src={picture.url}
          width={picture.width || undefined}
          height={picture.height || undefined}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </li>
  );
}

export default function YearAgoCard({
  found,
  now,
  onClose,
}: {
  found: YearAgo;
  now: Date;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const headingId = useId();
  const bodyId = useId();
  return (
    <section
      className={styles.card}
      aria-labelledby={headingId}
      data-ui="year-ago"
      data-open={open}
    >
      <div className={styles.head}>
        <span className={styles.label} aria-hidden="true">
          {YEAR_AGO_COPY.label}
        </span>
        <h2 id={headingId} className={styles.title}>
          <span className="sr-only">{YEAR_AGO_COPY.label} </span>
          <time dateTime={dayKey(found.day)}>
            {YEAR_AGO_COPY.title(found.day)}
          </time>
        </h2>
        <span className={styles.count}>{YEAR_AGO_COPY.count(found.count)}</span>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          data-ui="year-ago-toggle"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? YEAR_AGO_COPY.collapse : YEAR_AGO_COPY.expand}
        </button>
        <button
          type="button"
          className={styles.close}
          aria-label={YEAR_AGO_COPY.close}
          data-ui="year-ago-close"
          onClick={onClose}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>
      </div>
      {open ? (
        <div id={bodyId} className={styles.body}>
          {found.lines.length > 0 ? (
            <ul className={styles.lines} data-ui="year-ago-lines">
              {found.lines.map((line) => (
                <li key={line.id} className={styles.line}>
                  <span className={styles.who}>{line.sender}</span>
                  <span className={styles.what}>
                    {line.text.replace(/\s+/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {found.pictures.length > 0 ? (
            <ul
              className={styles.pictures}
              aria-label={YEAR_AGO_COPY.pictures}
              data-ui="year-ago-pictures"
            >
              {found.pictures.map((picture) => (
                <Picture key={picture.messageId} picture={picture} now={now} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
