import type { AdapterRoom } from "../../transport/adapters";

/** Rooms this tab has seen, so a room view can title itself before it asks again. */
const seen = new Map<string, Map<string, AdapterRoom>>();

type ReadListener = (adapterId: string, roomId: string) => void;
const readListeners = new Set<ReadListener>();

export function rememberedRoom(
  adapterId: string,
  roomId: string,
): AdapterRoom | undefined {
  return seen.get(adapterId)?.get(roomId);
}

export function rememberRooms(adapterId: string, rooms: AdapterRoom[]) {
  seen.set(adapterId, new Map(rooms.map((room) => [room.id, room])));
}

/** A room view marked the room read; the lists drop its unread count at once. */
export function noteRead(adapterId: string, roomId: string) {
  const room = rememberedRoom(adapterId, roomId);
  if (room) seen.get(adapterId)?.set(roomId, { ...room, unread: 0 });
  for (const listener of readListeners) listener(adapterId, roomId);
}

export function onRead(listener: ReadListener): () => void {
  readListeners.add(listener);
  return () => {
    readListeners.delete(listener);
  };
}
