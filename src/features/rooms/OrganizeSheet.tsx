import { type FormEvent, useId, useLayoutEffect, useRef } from "react";
import type { ClientStores } from "../../core/stores";
import styles from "./OrganizeSheet.module.css";
import { FOLDER_NAME_MAX, type Organize } from "./organize";
import {
  createFolder,
  deleteFolder,
  renameFolder,
  toggleFolderRoom,
  toggleHidden,
  togglePinned,
} from "./organizeEdits";
import { useSlice } from "./slices";

export type OrganizeSheetKind =
  | { kind: "room"; roomId: string; at: { x: number; y: number } | null }
  | { kind: "folders" };

const COPY = {
  pin: "맨 위에 고정",
  unpin: "고정 해제",
  hide: "목록에서 숨기기",
  unhide: "숨김 해제",
  putIn: "폴더에 넣기",
  newFolder: "새 폴더 이름",
  create: "만들기",
  folders: "폴더 편집",
  noFolders: "아직 만든 폴더가 없습니다",
  folderName: "폴더 이름",
  remove: (name: string) => `${name} 폴더 삭제`,
  removeShort: "삭제",
  close: "닫기",
  local: "고정·숨김·폴더는 이 브라우저에만 저장됩니다",
} as const;

export interface OrganizeSheetProps {
  sheet: OrganizeSheetKind;
  stores: ClientStores;
  organize: Organize;
  update: (change: (state: Organize) => Organize) => void;
  onClose: () => void;
}

function folderId() {
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function NewFolder({ onCreate }: { onCreate: (name: string) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem("name");
    if (!(field instanceof HTMLInputElement) || !field.value.trim()) return;
    onCreate(field.value);
    field.value = "";
  };
  return (
    <form className={styles.new} onSubmit={submit}>
      <input
        name="name"
        aria-label={COPY.newFolder}
        placeholder={COPY.newFolder}
        maxLength={FOLDER_NAME_MAX}
        autoComplete="off"
      />
      <button type="submit">{COPY.create}</button>
    </form>
  );
}

function RoomMenu({
  roomId,
  stores,
  organize,
  update,
  close,
  headingId,
}: {
  roomId: string;
  stores: ClientStores;
  organize: Organize;
  update: OrganizeSheetProps["update"];
  close: () => void;
  headingId: string;
}) {
  const snapshot = useSlice(stores, `room.${roomId}`);
  const pinned = organize.pinned.includes(roomId);
  const hidden = organize.hidden.includes(roomId);
  // The catalog dropped the room while the menu was open: nothing to arrange.
  useLayoutEffect(() => {
    if (!snapshot) close();
  }, [snapshot, close]);
  if (!snapshot) return null;
  return (
    <>
      <h2 id={headingId} className={styles.title} tabIndex={-1}>
        {snapshot.room.title}
      </h2>
      <div className={styles.actions}>
        <button
          type="button"
          data-ui="menu-pin"
          onClick={() => {
            update((state) => togglePinned(state, roomId));
            close();
          }}
        >
          {pinned ? COPY.unpin : COPY.pin}
        </button>
        <button
          type="button"
          data-ui="menu-hide"
          onClick={() => {
            update((state) => toggleHidden(state, roomId));
            close();
          }}
        >
          {hidden ? COPY.unhide : COPY.hide}
        </button>
      </div>
      <fieldset className={styles.group}>
        <legend>{COPY.putIn}</legend>
        {organize.folders.map((folder) => (
          <label key={folder.id} className={styles.check}>
            <input
              type="checkbox"
              checked={folder.rooms.includes(roomId)}
              onChange={() =>
                update((state) => toggleFolderRoom(state, folder.id, roomId))
              }
            />
            <span>{folder.name}</span>
          </label>
        ))}
        <NewFolder
          onCreate={(name) =>
            update((state) => createFolder(state, folderId(), name, roomId))
          }
        />
      </fieldset>
    </>
  );
}

function FolderEditor({
  organize,
  update,
  headingId,
}: {
  organize: Organize;
  update: OrganizeSheetProps["update"];
  headingId: string;
}) {
  return (
    <>
      <h2 id={headingId} className={styles.title} tabIndex={-1}>
        {COPY.folders}
      </h2>
      {organize.folders.length === 0 ? (
        <p className={styles.note}>{COPY.noFolders}</p>
      ) : (
        <ul className={styles.list}>
          {organize.folders.map((folder) => (
            <li key={folder.id}>
              <input
                aria-label={COPY.folderName}
                defaultValue={folder.name}
                maxLength={FOLDER_NAME_MAX}
                autoComplete="off"
                onBlur={(event) => {
                  const name = event.currentTarget.value;
                  if (name.trim())
                    update((state) => renameFolder(state, folder.id, name));
                  else event.currentTarget.value = folder.name;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
              <button
                type="button"
                aria-label={COPY.remove(folder.name)}
                onClick={() =>
                  update((state) => deleteFolder(state, folder.id))
                }
              >
                {COPY.removeShort}
              </button>
            </li>
          ))}
        </ul>
      )}
      <NewFolder
        onCreate={(name) =>
          update((state) => createFolder(state, folderId(), name))
        }
      />
    </>
  );
}

/**
 * The room menu and the folder editor in one modal dialog: a bottom sheet on a
 * phone, a small menu at the pointer on a wider screen. The native dialog
 * keeps focus inside, closes on Escape and gives focus back to the opener.
 */
export default function OrganizeSheet({
  sheet,
  stores,
  organize,
  update,
  onClose,
}: OrganizeSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const at = sheet.kind === "room" ? sheet.at : null;

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    // Start at the title, not the first action: a long press should not ring a button.
    element.querySelector<HTMLElement>("h2")?.focus();
    // A tap on the backdrop dismisses it; the keyboard's way out is Escape, which the dialog owns.
    const dismiss = (event: globalThis.MouseEvent) => {
      if (event.target === element) element.close();
    };
    element.addEventListener("click", dismiss);
    if (at && matchMedia("(min-width: 768px)").matches) {
      const { width, height } = element.getBoundingClientRect();
      element.style.left = `${Math.max(8, Math.min(at.x, innerWidth - width - 8))}px`;
      element.style.top = `${Math.max(8, Math.min(at.y, innerHeight - height - 8))}px`;
      element.dataset.anchored = "";
    }
    return () => {
      element.removeEventListener("click", dismiss);
      element.close();
    };
  }, [at]);

  const close = () => dialog.current?.close();
  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-labelledby={headingId}
      data-ui="organize-sheet"
      // StrictMode reopens the dialog after its test cleanup; only a real close ends the sheet.
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
    >
      <div className={styles.body}>
        {sheet.kind === "room" ? (
          <RoomMenu
            roomId={sheet.roomId}
            stores={stores}
            organize={organize}
            update={update}
            close={close}
            headingId={headingId}
          />
        ) : (
          <FolderEditor
            organize={organize}
            update={update}
            headingId={headingId}
          />
        )}
        <p className={styles.note}>{COPY.local}</p>
        <button type="button" className={styles.close} onClick={close}>
          {COPY.close}
        </button>
      </div>
    </dialog>
  );
}
