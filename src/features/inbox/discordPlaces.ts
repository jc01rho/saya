import type { AdapterRoom } from "../../transport/adapters";

/**
 * A room's place in Discord's own sidebar, as the Discord adapter sends it
 * under the `x-discord.place` extension key. Clients that do not know the key
 * ignore it; this one draws the sidebar from it.
 */
export type DiscordPlace = {
  guild: { id: string; name: string };
  category?: { id: string; name: string; position: number };
  channel: { id: string; name: string; position: number };
  thread?: { id: string; name: string };
  /** Mentions of this account waiting in the room, when the adapter knows them. */
  mentions?: number;
};

export type TreeThread = { id: string; name: string; room: AdapterRoom };
export type TreeChannel = {
  id: string;
  name: string;
  position: number;
  /** Absent when only threads under it are rooms. */
  room: AdapterRoom | null;
  threads: TreeThread[];
};
export type TreeSection = {
  /** null: channels outside every category, drawn first as Discord does. */
  category: { id: string; name: string; position: number } | null;
  channels: TreeChannel[];
};
export type TreeGuild = { id: string; name: string; sections: TreeSection[] };

const KEY = "x-discord.place";

function named(value: unknown): value is { id: string; name: string } {
  if (!value || typeof value !== "object") return false;
  const { id, name } = value as Record<string, unknown>;
  return typeof id === "string" && id !== "" && typeof name === "string";
}

function positioned(
  value: unknown,
): value is { id: string; name: string; position: number } {
  return (
    named(value) && Number.isInteger((value as { position?: unknown }).position)
  );
}

/** The extension as sent, or null when it is absent or not the shape above. */
export function discordPlace(room: AdapterRoom): DiscordPlace | null {
  const value = (room as Record<string, unknown>)[KEY];
  if (!value || typeof value !== "object") return null;
  const { guild, category, channel, thread, mentions } = value as Record<
    string,
    unknown
  >;
  if (!named(guild) || !positioned(channel)) return null;
  if (category !== undefined && !positioned(category)) return null;
  if (thread !== undefined && !named(thread)) return null;
  return {
    guild: { id: guild.id, name: guild.name },
    channel: { id: channel.id, name: channel.name, position: channel.position },
    ...(category
      ? {
          category: {
            id: category.id,
            name: category.name,
            position: category.position,
          },
        }
      : {}),
    ...(thread ? { thread: { id: thread.id, name: thread.name } } : {}),
    ...(typeof mentions === "number" &&
    Number.isInteger(mentions) &&
    mentions > 0
      ? { mentions }
      : {}),
  };
}

/** Snowflakes are decimal strings of growing length: shorter is older. */
function bySnowflake(left: string, right: string): number {
  return (
    left.length - right.length || (left < right ? -1 : left > right ? 1 : 0)
  );
}

function byPosition(
  left: { id: string; position: number },
  right: { id: string; position: number },
): number {
  return left.position - right.position || bySnowflake(left.id, right.id);
}

/**
 * Discord's sidebar from the rooms that carry a place: server, then the
 * channels outside any category, then each category by position, channels by
 * position inside it, and a channel's threads under it, oldest first (threads
 * have no position). Rooms without a place are returned as they came.
 */
export function discordTree(rooms: readonly AdapterRoom[]): {
  guilds: TreeGuild[];
  rest: AdapterRoom[];
} {
  const guilds = new Map<
    string,
    {
      id: string;
      name: string;
      sections: Map<string, TreeSection>;
      channels: Map<string, TreeChannel>;
    }
  >();
  const rest: AdapterRoom[] = [];
  for (const room of rooms) {
    const place = discordPlace(room);
    if (!place) {
      rest.push(room);
      continue;
    }
    let guild = guilds.get(place.guild.id);
    if (!guild) {
      guild = {
        ...place.guild,
        sections: new Map(),
        channels: new Map(),
      };
      guilds.set(place.guild.id, guild);
    }
    const sectionKey = place.category?.id ?? "";
    let section = guild.sections.get(sectionKey);
    if (!section) {
      section = { category: place.category ?? null, channels: [] };
      guild.sections.set(sectionKey, section);
    }
    let channel = guild.channels.get(place.channel.id);
    if (!channel) {
      channel = { ...place.channel, room: null, threads: [] };
      guild.channels.set(place.channel.id, channel);
      section.channels.push(channel);
    }
    if (place.thread)
      channel.threads.push({ ...place.thread, id: room.id, room });
    else channel.room = room;
  }
  return {
    guilds: [...guilds.values()]
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name, "ko-KR") ||
          bySnowflake(left.id, right.id),
      )
      .map(({ id, name, sections }) => ({
        id,
        name,
        sections: [...sections.values()]
          .sort((left, right) =>
            left.category === null
              ? -1
              : right.category === null
                ? 1
                : byPosition(left.category, right.category),
          )
          .map((section) => ({
            ...section,
            channels: section.channels.sort(byPosition).map((channel) => ({
              ...channel,
              threads: channel.threads.sort((left, right) =>
                bySnowflake(left.id, right.id),
              ),
            })),
          })),
      })),
    rest,
  };
}
