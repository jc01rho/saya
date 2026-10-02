import { useState } from "react";
import { adapterRoomHash } from "../../app/routes";
import type { AdapterRoom } from "../../transport/adapters";
import { cx, UnreadBadge } from "../../ui";
import styles from "./DiscordTree.module.css";
import {
  discordPlace,
  type TreeChannel,
  type TreeGuild,
} from "./discordPlaces";

const COPY = {
  collapse: (name: string) => `${name} 접기`,
  expand: (name: string) => `${name} 펼치기`,
  unread: "안 읽음",
  mentions: (count: number) => `멘션 ${count.toLocaleString("ko-KR")}개`,
} as const;

const STORE = "saya.discord-tree.collapsed.";

function loadCollapsed(adapterId: string): Set<string> {
  try {
    const held: unknown = JSON.parse(
      localStorage.getItem(STORE + adapterId) ?? "[]",
    );
    return new Set(
      Array.isArray(held)
        ? held.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function saveCollapsed(adapterId: string, ids: Set<string>) {
  try {
    localStorage.setItem(STORE + adapterId, JSON.stringify([...ids]));
  } catch {
    // A browser that refuses storage keeps the fold for this visit only.
  }
}

function RoomLink({
  adapterId,
  room,
  name,
  kind,
  active,
}: {
  adapterId: string;
  room: AdapterRoom;
  name: string;
  kind: "channel" | "thread";
  active: boolean;
}) {
  const mentions = discordPlace(room)?.mentions ?? 0;
  const unread = room.unread > 0 || mentions > 0;
  return (
    <a
      className={cx(styles.link, styles[kind], active && styles.active)}
      href={adapterRoomHash(adapterId, room.id)}
      aria-current={active ? "page" : undefined}
      data-unread={unread || undefined}
      data-ui={`discord-${kind}`}
    >
      {kind === "channel" ? (
        <span className={styles.hash} aria-hidden="true">
          #
        </span>
      ) : null}
      <span className={styles.name}>{name}</span>
      {unread ? <span className="sr-only">{COPY.unread}</span> : null}
      {mentions > 0 ? (
        <span className={styles.badge}>
          <UnreadBadge count={mentions} />
          <span className="sr-only">{COPY.mentions(mentions)}</span>
        </span>
      ) : null}
    </a>
  );
}

function shows(room: AdapterRoom | null, activeId: string | null): boolean {
  return (
    room !== null &&
    (room.id === activeId ||
      room.unread > 0 ||
      (discordPlace(room)?.mentions ?? 0) > 0)
  );
}

/** A collapsed category keeps the open room and the unread ones, as Discord does. */
function Channel({
  adapterId,
  channel,
  activeId,
  folded,
}: {
  adapterId: string;
  channel: TreeChannel;
  activeId: string | null;
  folded: boolean;
}) {
  const threads = folded
    ? channel.threads.filter((thread) => shows(thread.room, activeId))
    : channel.threads;
  if (folded && !shows(channel.room, activeId) && threads.length === 0)
    return null;
  return (
    <li className={styles.channelItem}>
      {channel.room ? (
        <RoomLink
          adapterId={adapterId}
          room={channel.room}
          name={channel.name}
          kind="channel"
          active={channel.room.id === activeId}
        />
      ) : (
        <span className={cx(styles.link, styles.channel, styles.plain)}>
          <span className={styles.hash} aria-hidden="true">
            #
          </span>
          <span className={styles.name}>{channel.name}</span>
        </span>
      )}
      {threads.length ? (
        <ul className={styles.threads}>
          {threads.map((thread) => (
            <li key={thread.id} className={styles.threadItem}>
              <RoomLink
                adapterId={adapterId}
                room={thread.room}
                name={thread.name}
                kind="thread"
                active={thread.id === activeId}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Discord's own sidebar: the server's name once, categories that fold and
 * remember it in this browser, # channels in Discord's order, and each
 * channel's active threads beneath it on a hooked line.
 */
export function DiscordTree({
  adapterId,
  guilds,
  activeId,
}: {
  adapterId: string;
  guilds: TreeGuild[];
  activeId: string | null;
}) {
  const [collapsed, setCollapsed] = useState(() => loadCollapsed(adapterId));
  const toggle = (id: string) => {
    const next = new Set(collapsed);
    if (!next.delete(id)) next.add(id);
    saveCollapsed(adapterId, next);
    setCollapsed(next);
  };
  return (
    <div className={styles.tree} data-ui="discord-tree">
      {guilds.map((guild) => (
        <section key={guild.id} className={styles.guild}>
          <h2 className={styles.guildName} data-ui="discord-guild">
            {guild.name}
          </h2>
          {guild.sections.map((section) => {
            const category = section.category;
            const folded = category !== null && collapsed.has(category.id);
            return (
              <div key={category?.id ?? ""} className={styles.section}>
                {category ? (
                  <button
                    type="button"
                    className={styles.category}
                    aria-expanded={!folded}
                    aria-label={
                      folded
                        ? COPY.expand(category.name)
                        : COPY.collapse(category.name)
                    }
                    data-ui="discord-category"
                    onClick={() => toggle(category.id)}
                  >
                    <svg
                      className={styles.chevron}
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                    >
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                    <span className={styles.categoryName}>{category.name}</span>
                  </button>
                ) : null}
                <ul className={styles.channels}>
                  {section.channels.map((channel) => (
                    <Channel
                      key={channel.id}
                      adapterId={adapterId}
                      channel={channel}
                      activeId={activeId}
                      folded={folded}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
