import { useState } from "react";
import { validateExtension } from "../../contract/piratetalk/boundary";
import styles from "./StoredSticker.module.css";

export function StoredSticker({
  roomId,
  messageId,
}: {
  readonly roomId: string;
  readonly messageId: string;
}) {
  const [failed, setFailed] = useState(false);
  const request = { roomId, messageId };
  if (failed || !validateExtension("StoredStickerResourceRequest", request))
    return (
      <span data-ui="stored-sticker-unavailable">
        이모티콘을 불러올 수 없습니다
      </span>
    );
  return (
    <img
      className={styles.image}
      data-ui="stored-sticker"
      src={`/api/extensions/piratetalk/v1/stored-sticker-resource?${new URLSearchParams(request)}`}
      alt="저장된 이모티콘"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
