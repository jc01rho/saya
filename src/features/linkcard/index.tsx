import { useEffect, useState } from "react";
import styles from "./LinkCard.module.css";
import { type LinkCard as Card, fetchCard } from "./requests";

export const LINKCARD_COPY = {
  /** The image is decoration for the title beside it, so it carries no other name. */
  image: "",
} as const;

/**
 * The preview card under a message that carries an address.
 *
 * It renders nothing until the proxy answers, and nothing at all if it does
 * not: a missing card is the resting state, never an error on screen. Every
 * string here came from the linked page, so it is text and only text.
 */
export function LinkCard({ url }: { url: string }) {
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    let live = true;
    setCard(null);
    fetchCard(url).then((value) => {
      if (live) setCard(value);
    });
    return () => {
      live = false;
    };
  }, [url]);

  if (!card) return null;
  return (
    <a
      className={styles.card}
      data-ui="link-card"
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {card.image ? (
        <img
          className={styles.image}
          src={card.image}
          alt={LINKCARD_COPY.image}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className={styles.body}>
        {card.siteName ? (
          <span className={styles.site}>{card.siteName}</span>
        ) : null}
        {card.title ? <span className={styles.title}>{card.title}</span> : null}
        {card.description ? (
          <span className={styles.description}>{card.description}</span>
        ) : null}
      </span>
    </a>
  );
}
