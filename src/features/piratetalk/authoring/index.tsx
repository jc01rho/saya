import { useEffect, useRef, useState } from "react";
import styles from "./Authoring.module.css";
import type {
  AuthoringActions,
  AuthoringSchemas,
  ReplyTarget,
  RichSend,
} from "./model";

export { authoringActions } from "./actions";
export type {
  AuthoringActions,
  AuthoringSchemas,
  ReplyTarget,
  RichSend,
  TextDecoration,
} from "./model";
export {
  editMentions,
  hasDecoration,
  insertMention,
  richTextRequest,
} from "./model";

function failure(error: unknown): string {
  return error instanceof Error ? error.message : "요청을 완료하지 못했습니다.";
}

export function ReplyPreview({
  target,
  onCancel,
  onThread,
}: Readonly<{
  target: ReplyTarget;
  onCancel(): void;
  onThread(target: ReplyTarget): void;
}>) {
  return (
    <aside
      className={styles.reply}
      data-ui="piratetalk-reply-preview"
      aria-label="답장 대상"
    >
      <span>{target.text || "인용 정보 없음"}</span>
      <button type="button" onClick={() => onThread(target)}>
        스레드 보기
      </button>
      <button type="button" onClick={onCancel} aria-label="답장 취소">
        취소
      </button>
    </aside>
  );
}

export function MentionPicker({
  roomId,
  actions,
  onSelect,
  onClose,
}: Readonly<{
  roomId: string;
  actions: AuthoringActions;
  onSelect(person: AuthoringSchemas["Person"]): void;
  onClose(): void;
}>) {
  const [items, setItems] = useState<AuthoringSchemas["Person"][]>([]);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setError(undefined);
    actions
      .members(roomId, undefined, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems(page.items);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(failure(error));
      });
    return () => controller.abort();
  }, [actions, roomId]);
  return (
    <section
      className={styles.panel}
      aria-label="멤버 멘션"
      data-ui="piratetalk-mention-picker"
    >
      <label>
        이름 검색
        <input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <ul>
        {items
          .filter((person) => person.name?.includes(query))
          .map((person) => (
            <li key={person.userId}>
              <button type="button" onClick={() => onSelect(person)}>
                {person.name}
              </button>
            </li>
          ))}
      </ul>
      <button type="button" onClick={onClose}>
        닫기
      </button>
    </section>
  );
}

export function ThreadView({
  target,
  actions,
  onReply,
  onClose,
}: Readonly<{
  target: ReplyTarget;
  actions: AuthoringActions;
  onReply(target: ReplyTarget): void;
  onClose(): void;
}>) {
  const [items, setItems] = useState<AuthoringSchemas["Message"][]>([]);
  const [cursor, setCursor] = useState<string>();
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [coverage, setCoverage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setError(undefined);
    actions
      .thread(target.roomId, target.messageId, cursor, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems((old) => (cursor ? [...old, ...page.items] : page.items));
        setNext(page.nextCursor);
        setCoverage(
          page.coverage.complete
            ? "저장된 스레드"
            : "일부 로컬 기록만 표시합니다.",
        );
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(failure(error));
      });
    return () => controller.abort();
  }, [actions, target.roomId, target.messageId, cursor]);
  return (
    <section
      className={styles.panel}
      aria-label="스레드"
      data-ui="piratetalk-thread"
    >
      <header>
        <h3>스레드</h3>
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </header>
      <p>{coverage}</p>
      {error && <p role="alert">{error}</p>}
      <ol>
        {items.map((message) => (
          <li key={message.id}>
            <p>{message.text || message.kind}</p>
            <button
              type="button"
              onClick={() =>
                onReply({
                  roomId: message.roomId,
                  messageId: message.id,
                  text: message.text,
                })
              }
            >
              답장
            </button>
          </li>
        ))}
      </ol>
      {next && (
        <button type="button" onClick={() => setCursor(next)}>
          스레드 더 보기
        </button>
      )}
    </section>
  );
}

export function MediaAuthoring({
  roomId,
  actions,
  maxBytes,
  disabled,
}: Readonly<{
  roomId: string;
  actions: AuthoringActions;
  maxBytes: number | null;
  disabled: boolean;
}>) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<{ file: File; url: string }>();
  const [upload, setUpload] = useState<AuthoringSchemas["UploadResponse"]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const staged = useRef<AuthoringSchemas["UploadResponse"] | undefined>(
    undefined,
  );
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    if (
      !file ||
      !(file.type.startsWith("image/") || file.type.startsWith("video/"))
    )
      return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => {
      URL.revokeObjectURL(url);
      setPreview(undefined);
    };
  }, [file]);
  useEffect(
    () => () => {
      controller.current?.abort();
      const old = staged.current;
      if (old)
        void actions
          .cancelUpload(old.roomId, old.uploadId)
          .catch((error: unknown) => console.error(failure(error)));
    },
    [actions],
  );
  async function select(value: File | undefined) {
    if (!value || disabled || busy) return;
    if (!value.size || (maxBytes !== null && value.size > maxBytes)) {
      setError("파일 크기 제한을 확인하세요.");
      return;
    }
    controller.current?.abort();
    const old = staged.current;
    if (old) {
      try {
        await actions.cancelUpload(old.roomId, old.uploadId);
      } catch (error: unknown) {
        setError(failure(error));
        return;
      }
    }
    staged.current = undefined;
    setUpload(undefined);
    setFile(value);
    setError(undefined);
    const operation = new AbortController();
    controller.current = operation;
    setBusy(true);
    try {
      const result = await actions.upload(roomId, value, operation.signal);
      if (operation.signal.aborted) {
        await actions.cancelUpload(result.roomId, result.uploadId);
        return;
      }
      if (result.roomId !== roomId)
        throw new Error("업로드 방이 일치하지 않습니다.");
      staged.current = result;
      setUpload(result);
    } catch (error: unknown) {
      if (!operation.signal.aborted) setError(failure(error));
    } finally {
      if (!operation.signal.aborted) setBusy(false);
    }
  }
  async function cancel() {
    controller.current?.abort();
    try {
      if (staged.current)
        await actions.cancelUpload(
          staged.current.roomId,
          staged.current.uploadId,
        );
      staged.current = undefined;
      setUpload(undefined);
      setFile(undefined);
      setBusy(false);
      setError(undefined);
    } catch (error: unknown) {
      setError(failure(error));
    }
  }
  async function send() {
    if (!upload || upload.roomId !== roomId || busy || disabled) return;
    setBusy(true);
    // Ownership moves to the shared pending/send state; uncertainty never retries.
    staged.current = undefined;
    setUpload(undefined);
    try {
      await actions.submit({
        roomId,
        kind: "media",
        uploadId: upload.uploadId,
      });
    } catch (error: unknown) {
      setError(failure(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={styles.panel}
      data-ui="piratetalk-media"
      aria-label="파일 첨부"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files.length === 1)
          void select(event.dataTransfer.files.item(0) ?? undefined);
        else setError("한 번에 파일 하나를 선택하세요.");
      }}
    >
      <label>
        파일 선택
        <input
          data-ui="piratetalk-file-input"
          type="file"
          disabled={disabled || busy}
          onChange={(event) =>
            void select(event.currentTarget.files?.item(0) ?? undefined)
          }
        />
      </label>
      {file && (
        <p>
          {file.name} · {file.size} bytes
        </p>
      )}
      {preview && preview.file === file && file.type.startsWith("image/") && (
        <img
          src={preview.url}
          alt={file.name}
          width="160"
          height="120"
          className={styles.preview}
        />
      )}
      {preview && preview.file === file && file.type.startsWith("video/") && (
        <video src={preview.url} controls width="240" height="160">
          <track kind="captions" />
        </video>
      )}
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">처리 중</p>}
      <button
        type="button"
        data-ui="piratetalk-media-send"
        disabled={!upload || busy || disabled}
        onClick={() => void send()}
      >
        첨부 전송
      </button>
      <button type="button" onClick={() => void cancel()}>
        첨부 취소
      </button>
    </section>
  );
}

export function StickerPicker({
  roomId,
  actions,
  disabled,
  onClose,
}: Readonly<{
  roomId: string;
  actions: AuthoringActions;
  disabled: boolean;
  onClose(): void;
}>) {
  const [items, setItems] = useState<AuthoringSchemas["Sticker"][]>([]);
  const [selected, setSelected] = useState<AuthoringSchemas["Sticker"]>();
  const [cursor, setCursor] = useState<string>();
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    actions
      .stickers(cursor, controller.signal)
      .then((page) => {
        if (!controller.signal.aborted) {
          setItems((old) => (cursor ? [...old, ...page.items] : page.items));
          setNext(page.nextCursor);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(failure(error));
      });
    return () => controller.abort();
  }, [actions, cursor]);
  async function send(request: RichSend) {
    if (sending || disabled) return;
    setSending(true);
    setSelected(undefined);
    try {
      await actions.submit(request);
    } catch (error: unknown) {
      setError(failure(error));
    } finally {
      setSending(false);
    }
  }
  return (
    <section
      className={styles.panel}
      aria-label="정품 이모티콘"
      data-ui="piratetalk-stickers"
    >
      {error && <p role="alert">{error}</p>}
      <ul className={styles.stickers}>
        {items.map((item) => (
          <li key={item.itemId}>
            <button
              type="button"
              aria-label={item.name}
              aria-pressed={selected?.itemId === item.itemId}
              onClick={() => setSelected(item)}
            >
              <img
                src={actions.resourceUrl(item.resource)}
                alt={item.name}
                width="72"
                height="72"
                loading="lazy"
                onError={() => {
                  setError("이모티콘 리소스를 읽을 수 없습니다.");
                  setSelected(undefined);
                }}
              />
            </button>
          </li>
        ))}
      </ul>
      {next && (
        <button type="button" onClick={() => setCursor(next)}>
          이모티콘 더 보기
        </button>
      )}
      {selected && (
        <div>
          <img
            src={actions.resourceUrl(selected.resource)}
            alt={selected.name}
            width="120"
            height="120"
          />
          <button
            type="button"
            data-ui="piratetalk-sticker-send"
            disabled={disabled || sending}
            onClick={() =>
              void send({ roomId, kind: "sticker", itemId: selected.itemId })
            }
          >
            이모티콘 전송
          </button>
        </div>
      )}
      <button type="button" onClick={onClose}>
        닫기
      </button>
    </section>
  );
}
