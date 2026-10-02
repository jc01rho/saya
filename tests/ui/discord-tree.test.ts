import { expect, test } from "bun:test";
import {
  discordPlace,
  discordTree,
} from "../../src/features/inbox/discordPlaces";
import type { AdapterRoom } from "../../src/transport/adapters";

const guild = { id: "100000000000000001", name: "Synthetic server" };
const talk = { id: "200000000000000002", name: "Talk", position: 2 };
const misc = { id: "200000000000000001", name: "Misc", position: 5 };

function room(
  id: string,
  lastActivityAt: string,
  place?: Record<string, unknown>,
): AdapterRoom {
  return {
    id,
    title: `room ${id}`,
    kind: "group",
    unread: 0,
    lastActivityAt,
    ...(place ? { "x-discord.place": place } : {}),
  } as AdapterRoom;
}

test("rooms are ordered by Discord position, never by recent activity", () => {
  const rooms = [
    // Newest activity first, as the adapter sorts them.
    room("31", "2026-10-02T00:00:09Z", {
      guild,
      category: talk,
      channel: { id: "30", name: "random", position: 4 },
      thread: { id: "31", name: "newer thread" },
    }),
    room("40", "2026-10-02T00:00:08Z", {
      guild,
      category: misc,
      channel: { id: "40", name: "later", position: 0 },
    }),
    room("30", "2026-10-02T00:00:07Z", {
      guild,
      category: talk,
      channel: { id: "30", name: "random", position: 4 },
    }),
    room("29", "2026-10-02T00:00:06Z", {
      guild,
      category: talk,
      channel: { id: "30", name: "random", position: 4 },
      thread: { id: "29", name: "older thread" },
    }),
    room("10", "2026-10-02T00:00:05Z", {
      guild,
      category: talk,
      channel: { id: "10", name: "general", position: 1 },
    }),
    room("5", "2026-10-02T00:00:04Z", {
      guild,
      channel: { id: "5", name: "rules", position: 9 },
    }),
  ];
  const { guilds, rest } = discordTree(rooms);
  expect(rest).toEqual([]);
  expect(guilds).toHaveLength(1);
  const sections = guilds[0]?.sections ?? [];
  expect(sections.map((section) => section.category?.name ?? null)).toEqual([
    null,
    "Talk",
    "Misc",
  ]);
  expect(sections[1]?.channels.map((channel) => channel.name)).toEqual([
    "general",
    "random",
  ]);
  const random = sections[1]?.channels[1];
  expect(random?.room?.id).toBe("30");
  expect(random?.threads.map((thread) => thread.name)).toEqual([
    "older thread",
    "newer thread",
  ]);
});

test("a thread whose channel is not a room still hangs under that channel", () => {
  const { guilds } = discordTree([
    room("31", "2026-10-02T00:00:00Z", {
      guild,
      channel: { id: "30", name: "random", position: 0 },
      thread: { id: "31", name: "thread" },
    }),
  ]);
  const channel = guilds[0]?.sections[0]?.channels[0];
  expect(channel?.room).toBeNull();
  expect(channel?.threads.map((thread) => thread.id)).toEqual(["31"]);
});

test("rooms without a well-formed place stay out of the tree", () => {
  const malformed = [
    room("1", "2026-10-02T00:00:00Z"),
    room("2", "2026-10-02T00:00:00Z", { guild }),
    room("3", "2026-10-02T00:00:00Z", {
      guild,
      channel: { id: "3", name: "x", position: "1" },
    }),
    room("4", "2026-10-02T00:00:00Z", {
      guild,
      category: { id: "9", name: "c" },
      channel: { id: "4", name: "x", position: 1 },
    }),
  ];
  for (const candidate of malformed) expect(discordPlace(candidate)).toBeNull();
  const { guilds, rest } = discordTree(malformed);
  expect(guilds).toEqual([]);
  expect(rest.map((entry) => entry.id)).toEqual(["1", "2", "3", "4"]);
});
