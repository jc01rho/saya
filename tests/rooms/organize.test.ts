import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { ClientStores } from "../../src/core/stores";
import {
  arrangeRoomIds,
  createOrganizeStore,
  EMPTY_ORGANIZE,
  ORGANIZE_KEY,
  type Organize,
  parseOrganize,
  serializeOrganize,
} from "../../src/features/rooms/organize";
import {
  createFolder,
  deleteFolder,
  renameFolder,
  toggleFolderRoom,
  toggleHidden,
  togglePinned,
} from "../../src/features/rooms/organizeEdits";
import { hiddenUnreadOf } from "../../src/features/rooms/slices";

// Catalog order, most recent first, as /rooms delivers it.
const ORDER = ["101", "102", "103", "104", "105", "106"];
const ALL = { folder: null, hidden: false };

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("arrangeRoomIds", () => {
  test("an unarranged list is the catalog itself", () => {
    expect(arrangeRoomIds(ORDER, EMPTY_ORGANIZE, ALL)).toBe(ORDER);
  });

  test("pinned rooms come first and keep catalog recency among themselves", () => {
    let state = togglePinned(EMPTY_ORGANIZE, "105");
    state = togglePinned(state, "103");
    expect(arrangeRoomIds(ORDER, state, ALL)).toEqual([
      "103",
      "105",
      "101",
      "102",
      "104",
      "106",
    ]);
    expect(arrangeRoomIds(ORDER, togglePinned(state, "105"), ALL)).toEqual([
      "103",
      "101",
      "102",
      "104",
      "105",
      "106",
    ]);
  });

  test("hidden rooms leave the list, even when pinned, and only they show in the hidden view", () => {
    let state = togglePinned(EMPTY_ORGANIZE, "102");
    state = toggleHidden(state, "102");
    state = toggleHidden(state, "104");
    expect(arrangeRoomIds(ORDER, state, ALL)).toEqual([
      "101",
      "103",
      "105",
      "106",
    ]);
    expect(
      arrangeRoomIds(ORDER, state, { folder: null, hidden: true }),
    ).toEqual(["102", "104"]);
    const restored = toggleHidden(state, "102");
    expect(arrangeRoomIds(ORDER, restored, ALL)[0]).toBe("102");
  });

  test("a folder tab is the intersection of the folder and the filtered ids", () => {
    let state = createFolder(EMPTY_ORGANIZE, "f1", "일", "106");
    state = toggleFolderRoom(state, "f1", "102");
    state = toggleFolderRoom(state, "f1", "104");
    state = togglePinned(state, "106");
    const view = { folder: "f1", hidden: false };
    expect(arrangeRoomIds(ORDER, state, view)).toEqual(["106", "102", "104"]);
    // The filter already removed 102 and 106 (say, not unread).
    expect(arrangeRoomIds(["101", "103", "104", "105"], state, view)).toEqual([
      "104",
    ]);
    expect(arrangeRoomIds(ORDER, toggleHidden(state, "102"), view)).toEqual([
      "106",
      "104",
    ]);
  });

  test("a room may sit in several folders, and a deleted folder falls back to every room", () => {
    let state = createFolder(EMPTY_ORGANIZE, "f1", "가", "101");
    state = createFolder(state, "f2", "나", "101");
    expect(
      arrangeRoomIds(ORDER, state, { folder: "f1", hidden: false }),
    ).toEqual(["101"]);
    expect(
      arrangeRoomIds(ORDER, state, { folder: "f2", hidden: false }),
    ).toEqual(["101"]);
    state = deleteFolder(state, "f1");
    expect(
      arrangeRoomIds(ORDER, state, { folder: "f1", hidden: false }),
    ).toEqual(ORDER);
  });

  test("rooms the catalog no longer carries are ignored", () => {
    let state = togglePinned(EMPTY_ORGANIZE, "999");
    state = toggleHidden(state, "998");
    state = createFolder(state, "f1", "가", "997");
    expect(arrangeRoomIds(ORDER, state, ALL)).toEqual(ORDER);
    expect(
      arrangeRoomIds(ORDER, state, { folder: "f1", hidden: false }),
    ).toEqual([]);
    expect(
      arrangeRoomIds(ORDER, state, { folder: null, hidden: true }),
    ).toEqual([]);
  });
});

describe("folders", () => {
  test("blank names neither create nor rename a folder", () => {
    const state = createFolder(EMPTY_ORGANIZE, "f1", "가");
    expect(createFolder(state, "f2", "   ")).toBe(state);
    expect(createFolder(state, "f1", "중복")).toBe(state);
    expect(renameFolder(state, "f1", " ").folders[0]?.name).toBe(
      state.folders[0]?.name,
    );
    expect(renameFolder(state, "f1", "다른").folders[0]?.name).not.toBe(
      state.folders[0]?.name,
    );
  });
});

describe("storage", () => {
  test("an arrangement survives a reload of the page", () => {
    const storage = memoryStorage();
    const first = createOrganizeStore(storage);
    first.update((state) => togglePinned(state, "101"));
    first.update((state) => toggleHidden(state, "102"));
    first.update((state) => createFolder(state, "f1", "가", "103"));
    const second = createOrganizeStore(storage);
    expect(second.get()).toEqual(first.get());
  });

  test("subscribers hear each change and changes from another tab", () => {
    const store = createOrganizeStore(memoryStorage());
    let heard = 0;
    const unsubscribe = store.subscribe(() => {
      heard++;
    });
    store.update((state) => togglePinned(state, "101"));
    store.update((state) => state);
    store.receive(serializeOrganize(toggleHidden(EMPTY_ORGANIZE, "105")));
    unsubscribe();
    expect(heard).toBe(2);
    expect(store.get().hidden).toEqual(["105"]);
    expect(store.get().pinned).toEqual([]);
  });

  test("a value that is not JSON, or not an object, starts empty", () => {
    for (const raw of ["{", "null", "42", '"x"', "[]", ""]) {
      const store = createOrganizeStore(memoryStorage({ [ORGANIZE_KEY]: raw }));
      expect(store.get()).toEqual(EMPTY_ORGANIZE);
    }
  });

  test("damaged members are dropped one by one, keeping the rest", () => {
    const raw = JSON.stringify({
      pinned: ["101", 7, "", "101", null, "102"],
      hidden: "103",
      folders: [
        { id: "f1", name: "  가  ", rooms: ["101", 3, "101"] },
        { id: "f1", name: "중복", rooms: [] },
        { id: "f2", name: "", rooms: ["102"] },
        { id: 9, name: "숫자", rooms: [] },
        "folder",
        null,
        { id: "f3", name: "나" },
      ],
    });
    const parsed: Organize = parseOrganize(raw);
    expect(parsed.pinned).toEqual(["101", "102"]);
    expect(parsed.hidden).toEqual([]);
    expect(parsed.folders.map((folder) => folder.id)).toEqual(["f1", "f3"]);
    expect(parsed.folders[0]?.rooms).toEqual(["101"]);
    expect(parsed.folders[1]?.rooms).toEqual([]);
    expect(parsed.folders[0]?.name).toBe(parsed.folders[0]?.name.trim());
  });

  test("a storage that refuses to save keeps the arrangement for this page", () => {
    const store = createOrganizeStore({
      getItem: () => null,
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    });
    const warn = console.warn;
    const warnings: unknown[] = [];
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      store.update((state) => togglePinned(state, "101"));
    } finally {
      console.warn = warn;
    }
    expect(store.get().pinned).toEqual(["101"]);
    expect(warnings.length).toBe(1);
  });
});

describe("hiding tidies the list, it never mutes a room", () => {
  const room = (id: string, unread: number): components["schemas"]["Room"] => ({
    id,
    title: "가상 방",
    kind: "group",
    type: "MultiChat",
    memberCount: 3,
    unread,
    lastMessageId: null,
    lastActivityAt: "2037-04-07T09:00:00.000Z",
    readable: true,
  });

  test("the hidden chip counts what waits in hidden rooms, and only there", () => {
    const stores = new ClientStores();
    stores.setCatalog([room("101", 2), room("102", 5), room("103", 1)]);
    expect(hiddenUnreadOf(stores, ["101", "103"])).toBe(3);
    // A hidden id the catalog no longer has counts nothing.
    expect(hiddenUnreadOf(stores, ["999"])).toBe(0);
    stores.setCatalog([room("101", 4), room("102", 5), room("103", 1)]);
    expect(hiddenUnreadOf(stores, ["101", "103"])).toBe(5);
  });
});
