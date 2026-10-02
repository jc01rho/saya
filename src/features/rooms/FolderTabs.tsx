import { useId } from "react";
import { UnreadBadge } from "../../ui/UnreadBadge";
import type { Organize } from "./organize";
import styles from "./RoomsPane.module.css";

const COPY = {
  folders: "폴더",
  all: "전체",
  edit: "폴더 편집",
  hidden: (count: number) => `숨긴 방 ${count}`,
  hiddenUnread: (count: number) =>
    `, 안 읽은 메시지 ${count.toLocaleString("ko-KR")}개`,
} as const;

export interface FolderTabsProps {
  organize: Organize;
  folder: string | null;
  hiddenCount: number;
  /** Unread messages in the hidden rooms: hiding never silences a room. */
  hiddenUnread: number;
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
  hiddenUnread,
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
          <span>{COPY.hidden(hiddenCount)}</span>
          {hiddenUnread > 0 ? (
            <>
              <UnreadBadge count={hiddenUnread} />
              <span className="sr-only">{COPY.hiddenUnread(hiddenUnread)}</span>
            </>
          ) : null}
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
