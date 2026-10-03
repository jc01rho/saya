import { expect, test } from "bun:test";
import type {
  ReadClient,
  ReadOperation,
  ReadPage,
} from "../src/features/piratetalk/history-search/client";
import {
  HistorySearchClient,
  HistorySearchController,
  recentFilter,
} from "../src/features/piratetalk/history-search/client";

const empty = (cursor: string | null): ReadPage => ({
  items: [],
  hasMore: cursor !== null,
  nextCursor: cursor,
  coverage: { source: "archive", complete: false, stale: true },
});

test("empty attachment scan advances using the server cursor", async () => {
  const operations: ReadOperation[] = [];
  const client: ReadClient = {
    async read(operation) {
      operations.push(operation);
      return empty(operations.length === 1 ? "scan_200" : null);
    },
  };
  const controller = new HistorySearchController(client);
  await controller.load({
    kind: "attachments",
    request: { roomId: "9007199254740993", limit: 200 },
  });
  await controller.next();
  expect(operations[1]?.request.cursor).toBe("scan_200");
  expect(controller.getSnapshot().page?.hasMore).toBe(false);
});

test("stale response cannot populate a switched room", async () => {
  let finish: (page: ReadPage) => void = () => {
    throw new Error("Deferred request not registered");
  };
  const pending = new Promise<ReadPage>((resolve) => {
    finish = resolve;
  });
  const controller = new HistorySearchController({ read: async () => pending });
  const load = controller.load({
    kind: "search",
    request: { roomId: "1003", q: "needle", limit: 50 },
  });
  controller.reset();
  finish(empty(null));
  await load;
  expect(controller.getSnapshot()).toEqual({
    operation: null,
    page: null,
    loading: false,
    error: null,
  });
});

test("anchor continuation removes initial anchor and preserves exact IDs", async () => {
  const operations: ReadOperation[] = [];
  const controller = new HistorySearchController({
    async read(operation) {
      operations.push(operation);
      return empty("older");
    },
  });
  await controller.load({
    kind: "history",
    request: { roomId: "1003", messageId: "9007199254740993", limit: 50 },
  });
  await controller.next();
  expect(operations[0]?.request).toEqual({
    roomId: "1003",
    messageId: "9007199254740993",
    limit: 50,
  });
  expect(operations[1]?.request).toEqual({
    roomId: "1003",
    cursor: "older",
    limit: 50,
  });
});

test("read failures are not represented as empty pages", async () => {
  const controller = new HistorySearchController({
    async read() {
      throw new Error("source_unavailable");
    },
  });
  await controller.load({
    kind: "search",
    request: { q: "needle", limit: 50 },
  });
  expect(controller.getSnapshot().page).toBeNull();
  expect(controller.getSnapshot().error).toBe("source_unavailable");
});

test("recent filter searches only supplied coverage", () => {
  const message = {
    id: "9007199254740993",
    roomId: "1003",
    userId: "1",
    text: "needle",
    kind: "text",
    at: 1700000000,
  } satisfies ReadPage["items"][number];
  expect(recentFilter([message], "needle")).toEqual([message]);
  expect(recentFilter([], "needle")).toEqual([]);
});

test("malformed cursor is rejected before fetch", async () => {
  const client = new HistorySearchClient();
  await expect(
    client.read(
      {
        kind: "history",
        request: { roomId: "1003", cursor: "!invalid", limit: 50 },
      },
      new AbortController().signal,
    ),
  ).rejects.toMatchObject({ code: "invalid_request" });
});
