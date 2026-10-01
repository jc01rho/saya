import type { AdapterRoom } from "../../transport/adapters";

/** Rooms this tab has seen, so a room view can title itself before it asks again. */
const seen = new Map<string, Map<string, AdapterRoom>>();

export function rememberedRoom(
  adapterId: string,
  roomId: string,
): AdapterRoom | undefined {
  return seen.get(adapterId)?.get(roomId);
}

export function rememberRooms(adapterId: string, rooms: AdapterRoom[]) {
  seen.set(adapterId, new Map(rooms.map((room) => [room.id, room])));
}
