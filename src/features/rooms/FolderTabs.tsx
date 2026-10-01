import { useId } from "react";
import type { Organize } from "./organize";
import styles from "./RoomsPane.module.css";

const COPY = {
  folders: "폴더",
  all: "전체",
  edit: "폴더 편집",
  hidden: (count: number) => `숨긴 방 ${count}`,
} as const;

export interface FolderTabsProps {
  organize: Organize;
  folder: string | null;
  hiddenCount: number;
  showHidden: boolean;
  onFolder: (id: string | null) => void;
  onHidden: () => void;
  onEdit: () => void;
}

/**
 * The user's folders as one more radio group under the filter, so a folder and
 * a filter narrow the list together. Drawn only once a folder or a hidden room
 * exists; until then the head is exactly what it was.
 */
export default function FolderTabs({
  organize,
  folder,
  hiddenCount,
  showHidden,
  onFolder,
  onHidden,
  onEdit,
}: FolderTabsProps) {
  const group = useId();
  return (
    <fieldset className={styles.folders} data-ui="room-folders">
      <legend className="sr-only">{COPY.folders}</legend>
      {[{ id: null, name: COPY.all }, ...organize.folders].map((entry) => (
        <label key={entry.id ?? ""} className={styles.chip}>
          <input
            className="sr-only"
            type="radio"
            name={group}
            checked={!showHidden && folder === entry.id}
            onChange={() => onFolder(entry.id)}
          />
          <span>{entry.name}</span>
        </label>
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          className={styles.chip}
          aria-pressed={showHidden}
          data-ui="hidden-rooms"
          onClick={onHidden}
        >
          {COPY.hidden(hiddenCount)}
        </button>
      ) : null}
      <button
        type="button"
        className={styles.chip}
        aria-haspopup="dialog"
        data-ui="edit-folders"
        onClick={onEdit}
      >
        {COPY.edit}
      </button>
    </fieldset>
  );
}
