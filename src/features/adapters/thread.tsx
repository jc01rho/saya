import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  type AdapterAttachment,
  type AdapterMessage,
  type AdapterOutcome,
  type AdapterProblem,
  type AdapterRoom,
  type Capabilities,
  fetchCapabilities,
  fetchMessages,
  fetchRooms,
  mediaUrl,
  roomFeature,
  sendMessage,
  streamAdapter,
} from "../../transport/adapters";
import { cx, formatTime } from "../../ui";
import { formatSize } from "../attachments/pages";
import { problemSentence } from "./copy";
import { rememberedRoom, rememberRooms } from "./rooms";
import styles from "./Thread.module.css";

const COPY = {
  checking: "어댑터를 확인하는 중입니다.",
  loading: "메시지를 불러오는 중입니다.",
  empty: "이 방에서 읽을 수 있는 메시지가 없습니다.",
  noRead: "이 어댑터는 아직 메시지 읽기를 제공하지 않습니다.",
  earlier: "이전 메시지 더 보기",
  loadingEarlier: "불러오는 중",
  media: "사진·파일 등",
  service: "알림",
  edited: "수정됨",
  placeholder: "메시지 입력",
  send: "보내기",
  sending: "보내는 중",
  input: "보낼 메시지",
  tooLong: (max: number) =>
    `${max.toLocaleString("ko-KR")}자를 넘어 보낼 수 없습니다.`,
  uncertain:
    "보냈는지 알 수 없습니다. 대화에 나타나는지 확인한 뒤 필요하면 다시 보내세요.",
  noSend: "이 어댑터는 메시지 보내기를 제공하지 않습니다.",
  noSendHere: "이 방에는 이 계정으로 보낼 수 없습니다.",
  unshown: "불러오지 못했습니다",
  kinds: {
    file: "파일",
    image: "사진",
    video: "동영상",
    audio: "오디오",
    voice: "음성 메시지",
    sticker: "스티커",
    animation: "움직이는 이미지",
  } as Record<string, string>,
  reconnecting: "실시간 연결이 끊겨 다시 잇는 중입니다.",
} as const;

type Features = Capabilities["features"];

function withNewer(
  current: AdapterMessage[],
  newer: AdapterMessage[],
): AdapterMessage[] {
  const known = new Set(current.map((message) => message.id));
  const fresh = newer.filter((message) => !known.has(message.id));
  return fresh.length ? [...current, ...fresh] : current;
}

function withOlder(
  older: AdapterMessage[],
  current: AdapterMessage[],
): AdapterMessage[] {
  const known = new Set(current.map((message) => message.id));
  return [...older.filter((message) => !known.has(message.id)), ...current];
}

/** The reconnect backoff: waits `ms`, or less when the view goes away. */
function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** Types `/media` serves inline, so an `<img>` can draw them; anything else is a download. */
const DRAWABLE = /^image\/(?:jpeg|png|gif|webp|avif)$/;

function Attachment({
  adapterId,
  attachment,
}: {
  adapterId: string;
  attachment: AdapterAttachment;
}) {
  const [broken, setBroken] = useState(false);
  const href = mediaUrl(adapterId, attachment.id);
  const label = COPY.kinds[attachment.kind] ?? COPY.kinds.file;
  const drawable =
    (attachment.kind === "image" || attachment.kind === "sticker") &&
    DRAWABLE.test(attachment.mimeType ?? "");
  if (drawable && !broken)
    return (
      <a
        className={cx(
          styles.picture,
          attachment.kind === "sticker" && styles.sticker,
        )}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-ui="adapter-picture"
      >
        <img
          src={href}
          alt={attachment.name ?? label}
          width={attachment.width}
          height={attachment.height}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      </a>
    );
  const seconds = attachment.durationSeconds;
  const meta = [
    attachment.name ? label : null,
    seconds === undefined
      ? null
      : `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`,
    broken ? COPY.unshown : formatSize(attachment.size),
  ].filter(Boolean);
  return (
    <a
      className={styles.file}
      href={href}
      download={attachment.name ?? ""}
      data-ui="adapter-file"
    >
      <span className={styles.fileName}>{attachment.name ?? label}</span>
      <span className={styles.fileMeta}>{meta.join(" · ")}</span>
    </a>
  );
}

function Turn({
  adapterId,
  files,
  message,
  previous,
  now,
}: {
  adapterId: string;
  /** Whether the adapter declares `attachments.read`, so `/media` answers. */
  files: boolean;
  message: AdapterMessage;
  previous: AdapterMessage | undefined;
  now: Date;
}) {
  if (message.kind === "service")
    return (
      <li className={styles.service} data-ui="adapter-service">
        {message.text || COPY.service}
      </li>
    );
  const continued =
    previous !== undefined &&
    previous.kind !== "service" &&
    previous.fromMe === message.fromMe &&
    (previous.senderId ?? previous.sender) ===
      (message.senderId ?? message.sender);
  const time = formatTime(message.sentAt, now);
  const bare =
    files &&
    !message.text &&
    message.attachments?.length === 1 &&
    message.attachments[0]?.kind === "sticker";
  return (
    <li
      className={cx(styles.turn, message.fromMe && styles.mine)}
      data-ui="adapter-turn"
    >
      {!message.fromMe && !continued ? (
        <span className={styles.sender}>{message.sender}</span>
      ) : null}
      <div className={styles.line}>
        <div className={cx(styles.bubble, bare && styles.bare)}>
          {files && message.attachments ? (
            message.attachments.map((attachment) => (
              <Attachment
                key={attachment.id}
                adapterId={adapterId}
                attachment={attachment}
              />
            ))
          ) : message.kind === "media" ? (
            <span className={styles.media}>{COPY.media}</span>
          ) : null}
          {message.text ? (
            <span className={styles.text}>{message.text}</span>
          ) : null}
        </div>
        <time className={styles.time} dateTime={message.sentAt}>
          {time.label}
          {message.editedAt ? ` · ${COPY.edited}` : null}
        </time>
      </div>
    </li>
  );
}

function Composer({
  adapterId,
  roomId,
  maxLength,
  onStored,
}: {
  adapterId: string;
  roomId: string;
  maxLength: number;
  onStored: (message: AdapterMessage) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const over = [...text].length > maxLength;

  async function submit() {
    if (busy || over || !text.trim()) return;
    setBusy(true);
    setNote(null);
    let result: Awaited<ReturnType<typeof sendMessage>>;
    try {
      result = await sendMessage(
        adapterId,
        { roomId, text },
        new AbortController().signal,
      );
    } catch {
      result = { kind: "unreachable" };
    }
    setBusy(false);
    if (result.kind === "ok") {
      setText("");
      onStored(result.data.message);
      return;
    }
    // Refused means nothing was sent; anything else leaves the outcome unknown.
    setNote(
      result.kind === "refused" ? problemSentence(result) : COPY.uncertain,
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className={styles.composer} data-ui="adapter-composer">
      <div className={styles.box}>
        <textarea
          className={styles.field}
          aria-label={COPY.input}
          placeholder={COPY.placeholder}
          rows={1}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className={styles.send}
          disabled={busy || over || !text.trim()}
          onClick={() => void submit()}
          data-ui="adapter-send"
        >
          {busy ? COPY.sending : COPY.send}
        </button>
      </div>
      {over ? (
        <p className={styles.note} role="status">
          {COPY.tooLong(maxLength)}
        </p>
      ) : note ? (
        <p className={styles.note} role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/** One room's messages, the way back in time, live arrivals and the composer. */
export function AdapterThread({
  adapterId,
  roomId,
  room,
  features,
}: {
  adapterId: string;
  roomId: string;
  /** The room as the list described it, once known; it may narrow `features`. */
  room: AdapterRoom | undefined;
  features: Features;
}) {
  const read = features["messages.read"];
  const live = features["messages.stream"];
  const send = roomFeature(features, room, "messages.send");
  const files = roomFeature(features, room, "attachments.read") !== undefined;
  const limit = Math.min(50, read?.maxLimit ?? 50);
  const canPage = read?.paging === "before-id";

  const [messages, setMessages] = useState<AdapterMessage[]>([]);
  const [phase, setPhase] = useState<
    { kind: "loading" } | { kind: "ready" } | AdapterProblem
  >({ kind: "loading" });
  const [hasEarlier, setHasEarlier] = useState(false);
  const [earlier, setEarlier] = useState<"idle" | "busy" | string>("idle");
  const [reconnecting, setReconnecting] = useState(false);
  const wall = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const fromBottom = useRef<number | null>(null);
  const newest = useRef<string | null>(null);

  useEffect(() => {
    newest.current = messages.at(-1)?.id ?? newest.current;
  }, [messages]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMessages(adapterId, { roomId, limit }, controller.signal).then(
      (result) => {
        if (result.kind !== "ok") {
          setPhase(result);
          return;
        }
        setMessages(result.data.messages);
        setHasEarlier(result.data.hasEarlier);
        setPhase({ kind: "ready" });
      },
      () => {
        // Only an abort rejects.
      },
    );
    return () => controller.abort();
  }, [adapterId, roomId, limit]);

  const ready = phase.kind === "ready";
  const resumable = live?.resume === "cursor";
  const streaming = live !== undefined;
  useEffect(() => {
    if (!ready || !streaming) return;
    const controller = new AbortController();
    const { signal } = controller;
    void (async () => {
      let failures = 0;
      while (!signal.aborted) {
        const since =
          resumable && newest.current ? { [roomId]: newest.current } : {};
        const end = await streamAdapter(adapterId, {
          since,
          signal,
          onEvent(event) {
            if (event.type === "ready") {
              failures = 0;
              setReconnecting(false);
            } else if (
              event.type === "message" &&
              event.data.message.roomId === roomId
            ) {
              setMessages((current) =>
                withNewer(current, [event.data.message]),
              );
            }
          },
        });
        if (end.kind === "aborted" || signal.aborted) return;
        if (
          (end.kind === "error" || end.kind === "refused") &&
          end.code === "NOT_FOUND" &&
          newest.current
        ) {
          // The cursor's message is gone, so the adapter refuses to resume from
          // it. Refill the newest window and resume from a message that exists.
          const refill = await fetchMessages(
            adapterId,
            { roomId, limit },
            signal,
          ).catch(() => null);
          if (signal.aborted) return;
          if (refill?.kind === "ok") {
            newest.current = refill.data.messages.at(-1)?.id ?? null;
            setMessages((current) => withNewer(current, refill.data.messages));
          } else newest.current = null;
        }
        failures += 1;
        setReconnecting(true);
        await pause(
          Math.min(30_000, 1000 * 2 ** Math.min(failures, 5)),
          signal,
        );
      }
    })();
    return () => controller.abort();
  }, [ready, streaming, resumable, adapterId, roomId, limit]);

  useLayoutEffect(() => {
    const element = wall.current;
    if (!element || messages.length === 0) return;
    if (fromBottom.current !== null) {
      element.scrollTop = element.scrollHeight - fromBottom.current;
      fromBottom.current = null;
    } else if (stick.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  async function loadEarlier() {
    const first = messages[0];
    if (!first || earlier === "busy") return;
    setEarlier("busy");
    let result: Awaited<ReturnType<typeof fetchMessages>>;
    try {
      result = await fetchMessages(
        adapterId,
        { roomId, limit, before: first.id },
        new AbortController().signal,
      );
    } catch {
      result = { kind: "unreachable" };
    }
    if (result.kind !== "ok") {
      setEarlier(problemSentence(result));
      return;
    }
    const older = result.data.messages;
    const element = wall.current;
    if (element) fromBottom.current = element.scrollHeight - element.scrollTop;
    setMessages((current) => withOlder(older, current));
    setHasEarlier(result.data.hasEarlier);
    setEarlier("idle");
  }

  const now = new Date();
  return (
    <div className={styles.thread} data-ui="adapter-thread">
      <div
        className={styles.wall}
        ref={wall}
        onScroll={(event) => {
          const element = event.currentTarget;
          stick.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
        }}
      >
        {phase.kind === "loading" ? (
          <p className={styles.status}>{COPY.loading}</p>
        ) : phase.kind !== "ready" ? (
          <p className={styles.status}>{problemSentence(phase)}</p>
        ) : (
          <>
            {canPage && hasEarlier ? (
              <button
                type="button"
                className={styles.earlier}
                onClick={() => void loadEarlier()}
                disabled={earlier === "busy"}
              >
                {earlier === "busy" ? COPY.loadingEarlier : COPY.earlier}
              </button>
            ) : null}
            {earlier !== "idle" && earlier !== "busy" ? (
              <p className={styles.status}>{earlier}</p>
            ) : null}
            {messages.length ? (
              <ol className={styles.list}>
                {messages.map((message, index) => (
                  <Turn
                    key={message.id}
                    adapterId={adapterId}
                    files={files}
                    message={message}
                    previous={messages[index - 1]}
                    now={now}
                  />
                ))}
              </ol>
            ) : (
              <p className={styles.status}>{COPY.empty}</p>
            )}
          </>
        )}
      </div>
      {reconnecting ? (
        <p className={styles.reconnecting} role="status">
          {COPY.reconnecting}
        </p>
      ) : null}
      {send ? (
        <Composer
          adapterId={adapterId}
          roomId={roomId}
          maxLength={send.maxLength}
          onStored={(message) => {
            stick.current = true;
            setMessages((current) => withNewer(current, [message]));
          }}
        />
      ) : (
        <p className={styles.reconnecting} data-ui="adapter-no-send">
          {features["messages.send"] ? COPY.noSendHere : COPY.noSend}
        </p>
      )}
    </div>
  );
}

/** The room's title (from the list when this tab has it) and the adapter's declaration. */
export function useAdapterRoom(adapterId: string, roomId: string) {
  const [room, setRoom] = useState<AdapterRoom | undefined>(() =>
    rememberedRoom(adapterId, roomId),
  );
  const [capabilities, setCapabilities] = useState<
    { kind: "checking" } | AdapterOutcome
  >({ kind: "checking" });
  useEffect(() => {
    const controller = new AbortController();
    const ignore = () => {
      // Only an abort rejects.
    };
    fetchCapabilities(adapterId, controller.signal).then(
      setCapabilities,
      ignore,
    );
    if (!rememberedRoom(adapterId, roomId))
      fetchRooms(adapterId, controller.signal).then((result) => {
        if (result.kind !== "ok") return;
        rememberRooms(adapterId, result.data.rooms);
        setRoom(rememberedRoom(adapterId, roomId));
      }, ignore);
    return () => controller.abort();
  }, [adapterId, roomId]);
  return { room, capabilities };
}

export function AdapterRoomBody({
  adapterId,
  roomId,
  room,
  capabilities,
}: {
  adapterId: string;
  roomId: string;
  room: AdapterRoom | undefined;
  capabilities: { kind: "checking" } | AdapterOutcome;
}) {
  if (capabilities.kind === "checking")
    return <p className={styles.status}>{COPY.checking}</p>;
  if (capabilities.kind !== "connected")
    return <p className={styles.status}>{problemSentence(capabilities)}</p>;
  const { features } = capabilities.capabilities;
  if (!features["messages.read"])
    return <p className={styles.status}>{COPY.noRead}</p>;
  return (
    <AdapterThread
      key={`${adapterId}/${roomId}`}
      adapterId={adapterId}
      roomId={roomId}
      room={room}
      features={features}
    />
  );
}
