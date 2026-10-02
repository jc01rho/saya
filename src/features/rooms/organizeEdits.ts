import { cleanFolderName, MAX_FOLDERS, type Organize } from "./organize";

/** The edits the room menu and the folder editor make; loaded with them, not with the list. */
const toggled = (ids: readonly string[], id: string) =>
  ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];

export const togglePinned = (state: Organize, roomId: string): Organize => ({
  ...state,
  pinned: toggled(state.pinned, roomId),
});

export const toggleHidden = (state: Organize, roomId: string): Organize => ({
  ...state,
  hidden: toggled(state.hidden, roomId),
});

/** A blank name, or one folder too many, leaves the state as it was. */
export function createFolder(
  state: Organize,
  id: string,
  name: string,
  roomId?: string,
): Organize {
  const clean = cleanFolderName(name);
  if (
    !clean ||
    state.folders.length >= MAX_FOLDERS ||
    state.folders.some((folder) => folder.id === id)
  )
    return state;
  return {
    ...state,
    folders: [
      ...state.folders,
      { id, name: clean, rooms: roomId ? [roomId] : [] },
    ],
  };
}

export function renameFolder(
  state: Organize,
  id: string,
  name: string,
): Organize {
  const clean = cleanFolderName(name);
  if (!clean) return state;
  return {
    ...state,
    folders: state.folders.map((folder) =>
      folder.id === id ? { ...folder, name: clean } : folder,
    ),
  };
}

/** Deleting a folder only forgets the grouping; the rooms stay in the list. */
export const deleteFolder = (state: Organize, id: string): Organize => ({
  ...state,
  folders: state.folders.filter((folder) => folder.id !== id),
});

export const toggleFolderRoom = (
  state: Organize,
  folderId: string,
  roomId: string,
): Organize => ({
  ...state,
  folders: state.folders.map((folder) =>
    folder.id === folderId
      ? { ...folder, rooms: toggled(folder.rooms, roomId) }
      : folder,
  ),
});
