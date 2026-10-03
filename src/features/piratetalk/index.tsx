import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { components } from "../../contract/decoded";
import type { ClientStores } from "../../core/stores";
import type { ExtensionResult } from "../../transport/piratetalk";
import styles from "../composer/Composer.module.css";
import type { ComposerState } from "../composer/state";
import { useSlice } from "../rooms";
import type {
  AuthoringActions,
  ReplyTarget,
  TextDecoration,
} from "./authoring/model";
import type { ReadClient } from "./history-search/client";
import { localReadSnapshot, type PirateTalkSession } from "./session";
import type { PeopleSection } from "./state-people";
import type { Load, Schema } from "./state-people/state";

export { PirateTalkSession } from "./session";

const HistorySearchPanel = lazy(() =>
  import("./history-search").then((module) => ({
    default: module.HistorySearchPanel,
  })),
);
const ModelAssistance = lazy(() =>
  import("./model-assistance").then((module) => ({
    default: module.ModelAssistance,
  })),
);
const FriendsView = lazy(() =>
  import("./state-people").then((module) => ({ default: module.FriendsView })),
);
const MembersView = lazy(() =>
  import("./state-people").then((module) => ({ default: module.MembersView })),
);
const ProfileView = lazy(() =>
  import("./state-people").then((module) => ({ default: module.ProfileView })),
);
const ReactionControl = lazy(() =>
  import("./state-people").then((module) => ({
    default: module.ReactionControl,
  })),
);
const LocalReadControl = lazy(() =>
  import("./state-people").then((module) => ({
    default: module.LocalReadControl,
  })),
);
const ReplyPreview = lazy(() =>
  import("./authoring").then((module) => ({ default: module.ReplyPreview })),
);
const MentionPicker = lazy(() =>
  import("./authoring").then((module) => ({ default: module.MentionPicker })),
);
const ThreadView = lazy(() =>
  import("./authoring").then((module) => ({ default: module.ThreadView })),
);
const MediaAuthoring = lazy(() =>
  import("./authoring").then((module) => ({ default: module.MediaAuthoring })),
);
const StickerPicker = lazy(() =>
  import("./authoring").then((module) => ({ default: module.StickerPicker })),
);

class ExtensionFailure extends Error {
  constructor(
    readonly code: string,
    detail: string,
  ) {
    super(detail);
  }
}

async function unwrap<T>(result: Promise<ExtensionResult<T>>): Promise<T> {
  const value = await result;
  if (value.kind === "success") return value.data;
  if (value.kind === "cancelled")
    throw new DOMException("Cancelled", "AbortError");
  throw new ExtensionFailure(value.error.code, value.error.detail);
}

export function PirateTalkActions({
  session,
  roomId,
  stores,
  composer,
  decoration,
  onDecoration,
  onNavigate,
  onAttachment,
  onRefresh,
  anchor,
}: {
  readonly session: PirateTalkSession;
  readonly roomId: string;
  readonly stores: ClientStores;
  readonly composer: ComposerState;
  readonly decoration: TextDecoration;
  readonly onDecoration: (value: TextDecoration) => void;
  readonly onNavigate: (room: string, message: string) => void;
  readonly onAttachment: (room: string, message: string) => void;
  readonly onRefresh: () => void;
  readonly anchor: components["schemas"]["Message"] | undefined;
}) {
  const discovery = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
  );
  useSyncExternalStore(composer.subscribe, composer.getSnapshot);
  const thread = useSlice(stores, `thread.${roomId}`);
  const room = useSlice(stores, `room.${roomId}`);
  const [history, setHistory] = useState(false);
  const [model, setModel] = useState(false);
  const [people, setPeople] = useState<
    "friends" | "members" | "profile" | null
  >(null);
  const [section, setSection] = useState<PeopleSection>("all");
  const [cursor, setCursor] = useState<string>();
  const [person, setPerson] = useState("");
  const [friends, setFriends] = useState<Load<Schema["FriendsResponse"]>>({
    kind: "loading",
  });
  const [members, setMembers] = useState<Load<Schema["MembersResponse"]>>({
    kind: "loading",
  });
  const [profile, setProfile] = useState<Load<Schema["ProfileResponse"]>>({
    kind: "loading",
  });
  const [selected, setSelected] = useState("");
  const [reactionCode, setReactionCode] = useState("1200509_021");
  const [ownReactions, setOwnReactions] = useState<Record<string, boolean>>({});
  const [readBoundary, setReadBoundary] = useState<string>();
  const storedOverlay =
    room?.room && "piratetalkLocalRead" in room.room
      ? room.room.piratetalkLocalRead
      : undefined;
  const overlay = localReadSnapshot(storedOverlay, roomId);
  if (overlay) {
    session.restoreLocal(overlay);
    for (const id of thread.order) {
      const row = thread.messages[id];
      if (row) session.localRead.observe(roomId, row);
    }
  }
  const [authoring, setAuthoring] = useState<
    "mention" | "media" | "sticker" | null
  >(null);
  const [threadTarget, setThreadTarget] = useState<ReplyTarget>();
  const root = useRef<HTMLFieldSetElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const dismiss = () => {
    setHistory(false);
    setModel(false);
    setPeople(null);
    setAuthoring(null);
    setThreadTarget(undefined);
    focusReturn.current?.focus();
  };
  useEffect(() => {
    if (decoration.threadRoot && decoration.reply)
      setThreadTarget(decoration.reply);
  }, [decoration.threadRoot, decoration.reply]);
  const actions = useMemo<AuthoringActions>(
    () => ({
      members: (room, _cursor, signal) =>
        unwrap(session.transport.members({ roomId: room }, signal)),
      thread: (room, message, cursor, signal) =>
        unwrap(
          session.transport.thread(
            {
              roomId: room,
              messageId: message,
              limit: 50,
              ...(cursor ? { cursor } : {}),
            },
            signal,
          ),
        ),
      stickers: (cursor, signal) =>
        unwrap(
          session.transport.stickers(
            { limit: 50, ...(cursor ? { cursor } : {}) },
            signal,
          ),
        ),
      upload: (room, file, signal) =>
        unwrap(session.transport.upload(room, file, signal)),
      cancelUpload: (room, uploadId) =>
        session.transport.cancelUpload(room, uploadId),
      resourceUrl: (resource) => {
        const parsed = new URL(resource, window.location.origin);
        if (
          parsed.origin !== window.location.origin ||
          parsed.pathname !== "/extensions/piratetalk/v1/sticker-resource"
        )
          throw new ExtensionFailure(
            "invalid_resource",
            "Invalid sticker resource",
          );
        return `/api${parsed.pathname}${parsed.search}`;
      },
      submit: async (request) => {
        const result = await session.send(
          request,
          composer,
          new AbortController().signal,
        );
        if (result.outcome !== "confirmed")
          throw new ExtensionFailure(result.error.code, result.error.detail);
      },
    }),
    [session, composer],
  );
  useEffect(() => {
    if (
      !people ||
      discovery.kind !== "available" ||
      !discovery.capabilities.features.people.available
    )
      return;
    const controller = new AbortController();
    const load = async <T,>(
      result: Promise<ExtensionResult<T>>,
      update: (value: Load<T>) => void,
    ) => {
      update({ kind: "loading" });
      const value = await result;
      if (controller.signal.aborted || value.kind === "cancelled") return;
      update(
        value.kind === "success"
          ? { kind: "ready", value: value.data }
          : { kind: "unavailable", detail: value.error.detail },
      );
    };
    if (people === "friends")
      void load(
        session.transport.friends(
          { limit: 50, section, ...(cursor ? { cursor } : {}) },
          controller.signal,
        ),
        setFriends,
      );
    if (people === "members")
      void load(
        session.transport.members({ roomId }, controller.signal),
        setMembers,
      );
    if (people === "profile")
      void load(
        session.transport.profile({ userId: person }, controller.signal),
        setProfile,
      );
    return () => controller.abort();
  }, [people, section, cursor, person, roomId, session, discovery]);
  const client = useMemo<ReadClient>(
    () => ({
      read(operation, signal) {
        switch (operation.kind) {
          case "history":
            return unwrap(session.transport.history(operation.request, signal));
          case "search":
            return unwrap(session.transport.search(operation.request, signal));
          case "attachments":
            return unwrap(
              session.transport.attachments(operation.request, signal),
            );
        }
      },
    }),
    [session],
  );
  if (discovery.kind !== "available") return null;
  const { features, models } = discovery.capabilities;
  const navigate = onNavigate;
  const onRoom = (id: string) => {
    window.location.hash = `#/room/${encodeURIComponent(id)}`;
  };
  const onProfile = (id: string) => {
    setPerson(id);
    setPeople("profile");
  };
  const newest = thread.order.at(-1);
  const reactionKey = `${selected}:${reactionCode}`;
  return (
    <fieldset
      ref={root}
      style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      aria-label="추가 기능"
      data-ui="piratetalk-actions"
      onFocusCapture={(event) => {
        if (
          event.target instanceof HTMLButtonElement &&
          event.target.parentElement === root.current
        )
          focusReturn.current = event.target;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          dismiss();
        }
      }}
    >
      {(history || model || people || authoring || threadTarget) && (
        <button type="button" onClick={dismiss}>
          추가 기능 닫기
        </button>
      )}
      {overlay && (
        <p data-ui="piratetalk-local-unread">
          로컬 보관 기록 안 읽음: {session.localRead.unread(roomId)} · 보관
          자료와 불러온 이후 기록 기준
        </p>
      )}
      {(features.history.available || features.search.available) && (
        <button
          type="button"
          onClick={() => setHistory(!history)}
          aria-expanded={history}
        >
          기록 · 검색
        </button>
      )}
      {(features.summary.available || features.question.available) && (
        <button
          type="button"
          onClick={() => setModel(!model)}
          aria-expanded={model}
        >
          모델 기능
        </button>
      )}
      {features.people.available && (
        <>
          <button
            type="button"
            onClick={() => setPeople(people === "friends" ? null : "friends")}
          >
            친구
          </button>
          <button
            type="button"
            onClick={() => setPeople(people === "members" ? null : "members")}
          >
            참여자
          </button>
        </>
      )}
      {features.mentions.available && (
        <button
          type="button"
          onClick={() =>
            setAuthoring(authoring === "mention" ? null : "mention")
          }
        >
          멤버 멘션
        </button>
      )}
      {features.media.available && (
        <button
          type="button"
          onClick={() => setAuthoring(authoring === "media" ? null : "media")}
        >
          파일 첨부
        </button>
      )}
      {features.stickers.available && (
        <button
          type="button"
          onClick={() =>
            setAuthoring(authoring === "sticker" ? null : "sticker")
          }
        >
          정품 이모티콘
        </button>
      )}
      <Suspense fallback={<p role="status">불러오는 중</p>}>
        {features.reply.available && (
          <label>
            답장 대상
            <select
              value={decoration.reply?.messageId ?? ""}
              onChange={(event) => {
                const row = thread.messages[event.target.value];
                const { reply: _reply, ...rest } = decoration;
                onDecoration(
                  row
                    ? {
                        ...rest,
                        reply: { roomId, messageId: row.id, text: row.text },
                      }
                    : rest,
                );
              }}
            >
              <option value="">답장 없음</option>
              {decoration.reply &&
                !thread.order.includes(decoration.reply.messageId) && (
                  <option value={decoration.reply.messageId}>
                    {decoration.reply.text}
                  </option>
                )}
              {thread.order.map((id) => (
                <option key={id} value={id}>
                  {thread.messages[id]?.text || id}
                </option>
              ))}
            </select>
          </label>
        )}
        {decoration.reply && (
          <ReplyPreview
            target={decoration.reply}
            onCancel={() => {
              const { reply: _reply, ...rest } = decoration;
              onDecoration(rest);
            }}
            onThread={setThreadTarget}
          />
        )}
        {threadTarget && features.thread.available && (
          <ThreadView
            key={`${threadTarget.roomId}:${threadTarget.messageId}`}
            target={threadTarget}
            actions={actions}
            onClose={() => setThreadTarget(undefined)}
            onReply={(reply) =>
              onDecoration({
                ...decoration,
                reply,
                threadRoot: threadTarget.messageId,
              })
            }
          />
        )}
        {authoring === "mention" && features.mentions.available && (
          <MentionPicker
            roomId={roomId}
            actions={actions}
            onClose={() => setAuthoring(null)}
            onSelect={(person) => {
              const selectedDecoration = composer.getDecoration(roomId);
              void import("./authoring").then(({ insertMention }) => {
                if (composer.getDecoration(roomId) !== selectedDecoration)
                  return;
                const draft = composer.getDraft(roomId);
                const next = insertMention(
                  draft.text,
                  draft.selectionStart,
                  draft.selectionEnd,
                  person,
                  decoration.mentions,
                );
                if (!next) return;
                composer.setText(roomId, next.text);
                composer.setSelection(roomId, next.caret, next.caret);
                onDecoration({ ...decoration, mentions: next.mentions });
                setAuthoring(null);
              });
            }}
          />
        )}
        {authoring === "media" && features.media.available && (
          <MediaAuthoring
            roomId={roomId}
            actions={actions}
            maxBytes={discovery.capabilities.uploadPolicy.maxBytes}
            disabled={!!composer.getPending(roomId)}
          />
        )}
        {authoring === "sticker" && features.stickers.available && (
          <StickerPicker
            roomId={roomId}
            actions={actions}
            disabled={!!composer.getPending(roomId)}
            onClose={() => setAuthoring(null)}
          />
        )}
        {features.people.available && people === "friends" && (
          <FriendsView
            state={friends}
            section={section}
            onSection={(value) => {
              setCursor(undefined);
              setSection(value);
            }}
            onMore={setCursor}
            onProfile={onProfile}
            onRoom={onRoom}
          />
        )}
        {features.people.available && people === "members" && (
          <MembersView state={members} onProfile={onProfile} onRoom={onRoom} />
        )}
        {features.people.available && people === "profile" && (
          <ProfileView state={profile} onRoom={onRoom} />
        )}
        {features.readLocal.available && newest && (
          <>
            <LocalReadControl
              key={newest}
              roomId={roomId}
              messageId={newest}
              action={(body) =>
                session.transport.read(body, new AbortController().signal)
              }
              onConfirmed={(value) => {
                setReadBoundary(value.messageId);
                onRefresh();
              }}
            />
            {readBoundary && (
              <p>
                로컬 읽음 이후 불러온 메시지:{" "}
                {
                  thread.order.filter(
                    (id) =>
                      BigInt(id) > BigInt(readBoundary) &&
                      !thread.messages[id]?.fromMe,
                  ).length
                }
              </p>
            )}
          </>
        )}
        {features.reactions.available && (
          <>
            <label>
              공감할 메시지
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">메시지 선택</option>
                {anchor && !thread.messages[anchor.id] && (
                  <option value={anchor.id}>{anchor.text || anchor.id}</option>
                )}
                {thread.order.map((id) => (
                  <option key={id} value={id}>
                    {thread.messages[id]?.text || id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              공감 코드
              <input
                value={reactionCode}
                onChange={(event) => setReactionCode(event.target.value)}
              />
            </label>
            {selected && (
              <ReactionControl
                key={reactionKey}
                roomId={roomId}
                messageId={selected}
                code={reactionCode}
                label="공감"
                count={
                  (
                    thread.messages[selected] ??
                    (anchor?.id === selected ? anchor : undefined)
                  )?.reactions?.find(
                    (reaction) => reaction.code === reactionCode,
                  )?.count ?? 0
                }
                mine={ownReactions[reactionKey] ?? null}
                action={(body) => session.reactions.run(body)}
                onConfirmed={(body) => {
                  setOwnReactions((old) => ({
                    ...old,
                    [`${body.messageId}:${body.code}`]: body.selected,
                  }));
                  onRefresh();
                }}
              />
            )}
          </>
        )}
        {history &&
          (features.history.available || features.search.available) && (
            <HistorySearchPanel
              key={roomId}
              roomId={roomId}
              client={client}
              searchAvailable={features.search.available}
              historyAvailable={features.history.available}
              recentMessages={thread.order.flatMap((id) => {
                const message = thread.messages[id];
                if (!message) return [];
                const kind =
                  message.kind === "text" ||
                  message.kind === "photo" ||
                  message.kind === "video" ||
                  message.kind === "file" ||
                  message.kind === "sticker"
                    ? message.kind
                    : "other";
                return [
                  {
                    id,
                    roomId,
                    userId: message.senderId,
                    text: message.text,
                    kind,
                    at: message.sentAt
                      ? Math.floor(Date.parse(message.sentAt) / 1000)
                      : 0,
                  },
                ];
              })}
              onNavigate={navigate}
              onOpenAttachment={(item) =>
                onAttachment(item.roomId, item.messageId)
              }
            />
          )}
        {model && (
          <ModelAssistance
            roomId={roomId}
            models={models}
            summaryAvailable={features.summary.available}
            questionAvailable={features.question.available}
            summarize={(body, signal) =>
              session.transport.summary(body, signal)
            }
            ask={(body, signal) => session.transport.question(body, signal)}
            onCitation={navigate}
          />
        )}
      </Suspense>
    </fieldset>
  );
}

export function PirateTalkStatus({ session }: { session: PirateTalkSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  if (state.kind === "unsupported") return null;
  const label = (() => {
    switch (state.kind) {
      case "checking":
        return "추가 기능 확인 중";
      case "available":
        return Object.values(state.capabilities.features).some(
          (feature) => feature.available,
        )
          ? "추가 기능 연결됨"
          : "현재 사용할 수 있는 추가 기능이 없습니다.";
      case "unauthorized":
        return "추가 기능 인증이 필요합니다.";
      case "incompatible":
        return "추가 기능 버전이 맞지 않습니다.";
      case "malformed":
        return "추가 기능 응답을 해석할 수 없습니다.";
      case "unreachable":
        return "추가 기능에 연결할 수 없습니다.";
    }
  })();
  return (
    <section
      className={styles.status}
      data-ui="piratetalk-status"
      data-state={state.kind}
      aria-live="polite"
    >
      <span>{label}</span>{" "}
      <button
        type="button"
        className={styles.quiet}
        data-ui="piratetalk-reconnect"
        onClick={session.reconnect}
      >
        다시 연결
      </button>
    </section>
  );
}
