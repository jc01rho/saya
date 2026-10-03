import { useRef, useState } from "react";
import { Avatar } from "../../../ui/Avatar";
import type {
  Load,
  Mutation,
  ReactionAction,
  ReadAction,
  Schema,
} from "./state";
import { confirmedOwn, safeResource } from "./state";
import styles from "./state-people.module.css";

export { loaded, PeopleClient } from "./client";
export type {
  Load,
  LocalReadSnapshot,
  Mutation,
  ReactionAction,
  ReadAction,
  ReadResult,
  Schema,
} from "./state";
export {
  confirmedOwn,
  LocalReadState,
  localUnread,
  ReactionQueue,
  safeResource,
} from "./state";

export function ReactionControl({
  roomId,
  messageId,
  code,
  label,
  count,
  mine,
  action,
  onConfirmed,
}: {
  readonly roomId: string;
  readonly messageId: string;
  readonly code: string;
  readonly label: string;
  readonly count: number;
  readonly mine: boolean | null;
  readonly action: ReactionAction;
  readonly onConfirmed: (
    request: Schema["ReactionRequest"],
    result: Mutation,
  ) => void;
}) {
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<string>("");
  const busy = useRef(false);
  const submit = async (selected: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setOutcome("");
    const request = { roomId, messageId, code, selected };
    try {
      const result = await action(request);
      if (
        result.outcome === "confirmed" &&
        confirmedOwn(mine, request, result) === selected
      ) {
        onConfirmed(request, result);
        setOutcome("confirmed");
      } else
        setOutcome(result.outcome === "rejected" ? "rejected" : "unconfirmed");
    } catch {
      setOutcome("unconfirmed");
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return (
    <span
      className={styles.actions}
      data-ui="piratetalk-reaction"
      data-code={code}
      data-outcome={outcome}
      aria-busy={pending}
    >
      <button
        type="button"
        aria-pressed={mine === true}
        disabled={pending}
        onClick={() => void submit(mine !== true)}
      >
        {label} {count}
      </button>
      {mine === null && (
        <>
          <span>내 공감 여부 미확인</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => void submit(false)}
          >
            내 공감 취소
          </button>
        </>
      )}
      <span role="status">
        {pending
          ? "확인 중"
          : outcome === "unconfirmed"
            ? "공감 결과 미확인"
            : outcome === "rejected"
              ? "공감 요청 거절됨"
              : ""}
      </span>
    </span>
  );
}

export function LocalReadControl({
  roomId,
  messageId,
  action,
  onConfirmed,
}: {
  readonly roomId: string;
  readonly messageId: string;
  readonly action: ReadAction;
  readonly onConfirmed: (result: Schema["ReadResponse"]) => void;
}) {
  const busy = useRef(false);
  const [state, setState] = useState("idle");
  const mark = async () => {
    if (busy.current) return;
    busy.current = true;
    setState("pending");
    try {
      const result = await action({ roomId, messageId });
      if (
        result.outcome === "confirmed" &&
        "scope" in result &&
        result.scope === "local" &&
        result.roomId === roomId &&
        result.messageId === messageId
      ) {
        onConfirmed(result);
        setState("confirmed");
      } else setState("unconfirmed");
    } catch {
      setState("unconfirmed");
    } finally {
      busy.current = false;
    }
  };
  return (
    <div
      className={styles.actions}
      data-ui="piratetalk-read"
      data-state={state}
    >
      <button
        type="button"
        disabled={state === "pending"}
        onClick={() => void mark()}
      >
        여기까지 로컬 읽음
      </button>
      <span role="status">
        {state === "confirmed"
          ? "로컬 읽음 저장됨"
          : state === "pending"
            ? "저장 중"
            : state === "unconfirmed"
              ? "로컬 읽음 저장 미확인"
              : "다른 기기의 읽음 상태는 바뀌지 않습니다"}
      </span>
    </div>
  );
}

function Coverage({ value }: { readonly value: Schema["Coverage"] }) {
  return (
    <p className={styles.note}>
      {value.stale
        ? "기기에 저장된 정보 · 최신 정보가 아닐 수 있습니다"
        : "기기에 저장된 정보"}
      {!value.complete && " · 일부 정보만 제공됩니다"}
    </p>
  );
}

function PersonRow({
  person,
  onProfile,
  onRoom,
}: {
  readonly person: Schema["Person"];
  readonly onProfile: (userId: string) => void;
  readonly onRoom: (roomId: string) => void;
}) {
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.person}
        data-user-id={person.userId}
        onClick={() => onProfile(person.userId)}
      >
        <Avatar name={person.name} size={40} src={safeResource(person.image)} />
        <span>
          <strong>{person.name}</strong>
          {person.status && (
            <span className={styles.note}>{person.status}</span>
          )}
          {person.birthday && (
            <span className={styles.note}>{person.birthday}</span>
          )}
        </span>
      </button>
      {person.roomId && (
        <button
          type="button"
          onClick={() => {
            if (person.roomId) onRoom(person.roomId);
          }}
        >
          대화
        </button>
      )}
    </li>
  );
}

const sections = [
  ["all", "전체"],
  ["favorites", "즐겨찾기"],
  ["updated", "업데이트"],
  ["channels", "채널"],
  ["birthday", "생일"],
  ["hidden", "숨김"],
  ["blocked", "차단"],
] as const;
export type PeopleSection = NonNullable<Schema["FriendsRequest"]["section"]>;

export function FriendsView({
  state,
  section,
  onSection,
  onMore,
  onProfile,
  onRoom,
}: {
  readonly state: Load<Schema["FriendsResponse"]>;
  readonly section: PeopleSection;
  readonly onSection: (section: PeopleSection) => void;
  readonly onMore: (cursor: string) => void;
  readonly onProfile: (userId: string) => void;
  readonly onRoom: (roomId: string) => void;
}) {
  return (
    <section
      className={styles.panel}
      data-ui="piratetalk-friends"
      aria-label="친구"
    >
      <h2>친구</h2>
      <div className={styles.actions}>
        {sections.map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={section === key}
            onClick={() => onSection(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {state.kind === "loading" ? (
        <p role="status">불러오는 중</p>
      ) : state.kind === "unavailable" ? (
        <p role="status">정보를 불러올 수 없습니다: {state.detail}</p>
      ) : (
        <>
          <Coverage value={state.value.coverage} />
          {state.value.items.length === 0 ? (
            <p>이 구역에 저장된 친구가 없습니다</p>
          ) : (
            <ul className={styles.list}>
              {state.value.items.map((person) => (
                <PersonRow
                  key={person.userId}
                  person={person}
                  onProfile={onProfile}
                  onRoom={onRoom}
                />
              ))}
            </ul>
          )}
          {state.value.hasMore && state.value.nextCursor && (
            <button
              type="button"
              onClick={() => {
                if (state.value.nextCursor) onMore(state.value.nextCursor);
              }}
            >
              더 보기
            </button>
          )}
        </>
      )}
    </section>
  );
}

export function MembersView({
  state,
  onProfile,
  onRoom,
}: {
  readonly state: Load<Schema["MembersResponse"]>;
  readonly onProfile: (userId: string) => void;
  readonly onRoom: (roomId: string) => void;
}) {
  return (
    <section
      className={styles.panel}
      data-ui="piratetalk-members"
      aria-label="참여자"
    >
      <h2>참여자</h2>
      {state.kind === "loading" ? (
        <p role="status">불러오는 중</p>
      ) : state.kind === "unavailable" ? (
        <p role="status">참여자 정보 없음: {state.detail}</p>
      ) : (
        <>
          <Coverage value={state.value.coverage} />
          <ul className={styles.list}>
            {state.value.items.map((person) => (
              <PersonRow
                key={person.userId}
                person={person}
                onProfile={onProfile}
                onRoom={onRoom}
              />
            ))}
          </ul>
          {state.value.items.length === 0 && <p>저장된 참여자가 없습니다</p>}
        </>
      )}
    </section>
  );
}

export function ProfileView({
  state,
  onRoom,
}: {
  readonly state: Load<Schema["ProfileResponse"]>;
  readonly onRoom: (roomId: string) => void;
}) {
  const person = state.kind === "ready" ? state.value.profile : null;
  const background = safeResource(person?.background);
  return (
    <section
      className={styles.panel}
      data-ui="piratetalk-profile"
      aria-label="프로필"
    >
      <h2>프로필</h2>
      {state.kind === "loading" ? (
        <p role="status">불러오는 중</p>
      ) : state.kind === "unavailable" ? (
        <p role="status">프로필 정보 없음: {state.detail}</p>
      ) : (
        <>
          <Coverage value={state.value.coverage} />
          {person ? (
            <>
              <Avatar
                name={person.name}
                size={48}
                src={safeResource(person.image)}
              />
              <h3>{person.name}</h3>
              {background && (
                <img
                  className={styles.background}
                  src={background}
                  alt=""
                  width={300}
                  height={200}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              )}
              {person.status && <p>{person.status}</p>}
              {person.birthday && <p>{person.birthday}</p>}
              {person.musics && (
                <pre className={styles.metadata}>{person.musics}</pre>
              )}
              {person.roomId && (
                <button
                  type="button"
                  onClick={() => {
                    if (person.roomId) onRoom(person.roomId);
                  }}
                >
                  대화 열기
                </button>
              )}
            </>
          ) : (
            <p>이 프로필은 기기에 저장되어 있지 않습니다</p>
          )}
        </>
      )}
    </section>
  );
}
