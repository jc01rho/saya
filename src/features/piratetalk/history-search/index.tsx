import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Attachment, Message, ReadClient, ReadPage } from "./client";
import { HistorySearchController, recentFilter } from "./client";
import styles from "./styles.module.css";

export type {
  Attachment,
  Coverage,
  HistoryPage,
  Message,
  ReadClient,
  ReadOperation,
  ReadPage,
  SearchPage,
} from "./client";
export {
  HistorySearchClient,
  HistorySearchController,
  HistorySearchError,
  recentFilter,
} from "./client";

export type HistorySearchPanelProps = {
  readonly roomId: string;
  readonly onNavigate: (roomId: string, messageId: string) => void;
  readonly onOpenAttachment: (item: Attachment) => void;
  readonly recentMessages?: readonly Message[];
  readonly attentionIds?: readonly string[];
  readonly client?: ReadClient;
  readonly searchAvailable?: boolean;
  readonly historyAvailable?: boolean;
};

type Item = ReadPage["items"][number];
const messageId = (item: Item) =>
  "messageId" in item ? item.messageId : item.id;

function Results({
  items,
  onNavigate,
  onOpenAttachment,
}: {
  readonly items: readonly Item[];
  readonly onNavigate: HistorySearchPanelProps["onNavigate"];
  readonly onOpenAttachment: HistorySearchPanelProps["onOpenAttachment"];
}) {
  const [start, setStart] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const [previousItems, setPreviousItems] = useState(items);
  if (previousItems !== items) {
    setPreviousItems(items);
    setStart(0);
  }
  useEffect(() => {
    if (start === 0 && viewport.current) viewport.current.scrollTop = 0;
  }, [start]);
  const rowHeight = 64;
  const first = Math.max(0, start - 2);
  const visible = items.slice(first, first + 12);
  return (
    <div
      ref={viewport}
      className={styles.results}
      onScroll={(event) =>
        setStart(Math.floor(event.currentTarget.scrollTop / rowHeight))
      }
    >
      <ul
        aria-label="검색 및 기록 결과"
        style={{ height: items.length * rowHeight, position: "relative" }}
      >
        {visible.map((item, offset) => (
          <li
            key={`${item.roomId}:${messageId(item)}:${"name" in item ? item.id : "message"}`}
            style={{
              position: "absolute",
              top: (first + offset) * rowHeight,
              height: rowHeight,
              width: "100%",
            }}
          >
            <button
              type="button"
              className={styles.hit}
              data-ui="piratetalk-read-hit"
              data-message-id={messageId(item)}
              onClick={() =>
                "name" in item
                  ? onOpenAttachment(item)
                  : onNavigate(item.roomId, messageId(item))
              }
            >
              <span>
                {"name" in item ? item.name : item.text || "내용 없음"}
              </span>
              <small>
                {"name" in item
                  ? item.kind
                  : item.at
                    ? new Date(item.at * 1000).toLocaleString()
                    : "시간 미상"}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistorySearchPanel(props: HistorySearchPanelProps) {
  const controller = useMemo(
    () => new HistorySearchController(props.client),
    [props.client],
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState(
    props.searchAvailable === false ? "history" : "archive",
  );
  const [scope, setScope] = useState("room");
  const [names, setNames] = useState(false);
  const [kind, setKind] = useState("");
  const [anchor, setAnchor] = useState<string | null>(null);
  const [previousRoom, setPreviousRoom] = useState(props.roomId);
  if (previousRoom !== props.roomId) {
    setPreviousRoom(props.roomId);
    setAnchor(null);
    controller.reset();
  }
  useEffect(() => () => controller.reset(), [controller]);
  const recent = props.recentMessages ?? [];
  const items =
    mode === "recent" ? recentFilter(recent, query) : (state.page?.items ?? []);
  const navigate = (roomId: string, id: string) => {
    setAnchor(id);
    setMode("history");
    void controller.load({
      kind: "history",
      request: { roomId, messageId: id, limit: 50 },
    });
  };
  const search = () => {
    setAnchor(null);
    if (mode === "recent") return;
    if (mode === "history") {
      void controller.load({
        kind: "history",
        request: { roomId: props.roomId, limit: 50 },
      });
      return;
    }
    if (mode === "attachments") {
      const attachmentKind =
        kind === "photo" ||
        kind === "video" ||
        kind === "file" ||
        kind === "link"
          ? kind
          : undefined;
      void controller.load({
        kind: "attachments",
        request: {
          roomId: props.roomId,
          limit: 200,
          ...(attachmentKind ? { kind: attachmentKind } : {}),
        },
      });
      return;
    }
    void controller.load({
      kind: "search",
      request: {
        q: query,
        scope: names ? "names" : "messages",
        limit: 50,
        ...(scope === "room" ? { roomId: props.roomId } : {}),
      },
    });
  };
  return (
    <section
      className={styles.panel}
      data-ui="piratetalk-history-search"
      aria-label="기록 검색"
    >
      <form
        className={styles.controls}
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label>
          범위
          <select
            aria-label="검색 방식"
            value={mode}
            onChange={(event) => {
              controller.reset();
              setMode(event.target.value);
            }}
          >
            {props.searchAvailable !== false && (
              <option value="archive">보관 기록 검색</option>
            )}
            <option value="recent">불러온 메시지만</option>
            {props.historyAvailable !== false && (
              <>
                <option value="history">이전 기록</option>
                <option value="attachments">첨부 기록</option>
              </>
            )}
          </select>
        </label>
        {(mode === "archive" || mode === "recent") && (
          <input
            aria-label="기록 검색어"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            required={mode === "archive"}
          />
        )}
        {mode === "archive" && (
          <>
            <select
              aria-label="검색할 방"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="room">현재 방</option>
              <option value="all">모든 보관 기록</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={names}
                onChange={(event) => setNames(event.target.checked)}
              />
              이름으로 검색
            </label>
          </>
        )}
        {mode === "attachments" && (
          <select
            aria-label="첨부 종류"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="">전체</option>
            {["photo", "video", "file", "link"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={state.loading}
          data-ui="piratetalk-read-submit"
        >
          {state.loading ? "불러오는 중" : "불러오기"}
        </button>
      </form>
      {mode === "recent" && (
        <p>현재 불러온 {recent.length}개 메시지 안에서만 찾습니다.</p>
      )}
      {state.page && (
        <p data-ui="piratetalk-read-coverage">
          {state.page.coverage.source} ·{" "}
          {state.page.coverage.complete
            ? "해당 범위 확인됨"
            : "로컬 기록 일부 범위"}
          {state.page.coverage.stale ? " · 최신 기록과 다를 수 있음" : ""}
        </p>
      )}
      {state.error && (
        <p role="alert" data-ui="piratetalk-read-error">
          {state.error}
        </p>
      )}
      {anchor && (
        <p data-ui="piratetalk-read-anchor" data-message-id={anchor}>
          선택한 메시지 주변 기록{" "}
          <button
            type="button"
            onClick={() => {
              const item = state.page?.items.find(
                (item) => messageId(item) === anchor,
              );
              if (item) props.onNavigate(item.roomId, anchor);
            }}
            disabled={
              !state.page?.items.some((item) => messageId(item) === anchor)
            }
          >
            대화에서 열기
          </button>
        </p>
      )}
      {!state.loading &&
        !state.error &&
        (state.page || mode === "recent") &&
        items.length === 0 && (
          <p data-ui="piratetalk-read-empty">확인한 범위에 결과가 없습니다.</p>
        )}
      <Results
        items={items}
        onNavigate={navigate}
        onOpenAttachment={props.onOpenAttachment}
      />
      {state.page?.hasMore && (
        <button
          type="button"
          data-ui="piratetalk-read-next"
          disabled={state.loading}
          onClick={() => void controller.next()}
        >
          이전 범위 계속 찾기
        </button>
      )}
      {(props.attentionIds ?? [])
        .filter((id) => recent.some((message) => message.id === id))
        .map((id, index) => (
          <button
            type="button"
            key={id}
            onClick={() => props.onNavigate(props.roomId, id)}
          >
            불러온 알림 {index + 1}로 이동
          </button>
        ))}
    </section>
  );
}
