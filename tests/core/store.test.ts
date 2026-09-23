import { describe, expect, test } from "bun:test";
import type { components } from "../../src/contract/decoded";
import { BoundedCache, CACHE_LIMITS, payloadBytes } from "../../src/core/cache";
import { compareDecimalIds, contextUrl, roomHash } from "../../src/core/ids";
import { ClientStores } from "../../src/core/stores";

type Message = components["schemas"]["Message"];
type Room = components["schemas"]["Room"];
const BIG_ROOM = "18491246151592761";
const message = (
  roomId: string,
  id: string,
  text = "Synthetic body",
): Message => ({
  id,
  roomId,
  text,
  senderId: "42",
  sender: "Invented peer",
  kind: "text",
  sentAt: null,
  fromMe: false,
});
const room = (id: string, title = "Invented room"): Room => ({
  id,
  title,
  kind: "direct",
  type: "DirectChat",
  memberCount: 2,
  unread: 7,
  lastMessageId: null,
  lastActivityAt: null,
  readable: true,
});

describe("string-only identifiers", () => {
  test("selection and URLs preserve the exact wire string", () => {
    const cache = new BoundedCache();
    cache.selectRoom(BIG_ROOM);
    expect(cache.getSnapshot().activeRoomId).toBe(BIG_ROOM);
    expect(
      new URL(
        contextUrl(BIG_ROOM),
        "https://synthetic.invalid",
      ).searchParams.get("roomId"),
    ).toBe(BIG_ROOM);
    expect(
      decodeURIComponent(roomHash(BIG_ROOM).slice("#/rooms/".length)),
    ).toBe(BIG_ROOM);
    expect(contextUrl("-00042")).toContain("roomId=-00042");
    expect(roomHash("opaque/room")).toBe("#/rooms/opaque%2Froom");
  });
  test("compares beyond 2^53 without losing low digits", () => {
    expect(compareDecimalIds("9007199254740992", "9007199254740993")).toBe(-1);
    expect(compareDecimalIds("18491246151592761", "18491246151592760")).toBe(1);
    expect(compareDecimalIds("0009007199254740993", "9007199254740993")).toBe(
      0,
    );
    expect(
      compareDecimalIds("99999999999999999999", "100000000000000000000"),
    ).toBe(-1);
  });
  test("negative room IDs and signed zero sort correctly", () => {
    expect(["10", "-2", "-100", "0", "-00010"].sort(compareDecimalIds)).toEqual(
      ["-100", "-00010", "-2", "0", "10"],
    );
    expect(compareDecimalIds("-000", "0")).toBe(0);
    expect(compareDecimalIds("-0002", "-2")).toBe(0);
    expect(compareDecimalIds("-9007199254740993", "-9007199254740992")).toBe(
      -1,
    );
  });
});

describe("keyed immutable stores", () => {
  test("unchanged slices and rows keep their reference and only changed keys notify", () => {
    const stores = new ClientStores();
    stores.setCatalog([room("1"), room("2")]);
    stores.setThread("1", [message("1", "1")]);
    const a = stores.getSnapshot("thread.1");
    const rowA = stores.getSnapshot("room.1");
    const order = stores.getSnapshot("rooms.order");
    const calls: string[] = [];
    const offA = stores.subscribe("thread.1", () => calls.push("A"));
    stores.subscribe("thread.2", () => calls.push("B"));
    stores.subscribe("rooms.order", () => calls.push("order"));
    stores.setThread("2", [message("2", "1")]);
    stores.setCatalog([room("1"), room("2", "Changed synthetic room")]);
    expect(stores.getSnapshot("thread.1")).toBe(a);
    expect(stores.getSnapshot("room.1")).toBe(rowA);
    expect(stores.getSnapshot("rooms.order")).toBe(order);
    expect(calls).toEqual(["B"]);
    stores.setThread("1", [message("1", "1")]);
    expect(stores.getSnapshot("thread.1")).toBe(a);
    const entity = stores.getSnapshot("message.1.1");
    stores.setThread("1", [message("1", "1"), message("1", "2")]);
    expect(stores.getSnapshot("message.1.1")).toBe(entity);
    offA();
    stores.setThread("1", [message("1", "3")]);
    expect(calls).toEqual(["B", "A"]);
  });
  test("snapshots own and deeply freeze their data; missing slices are stable", () => {
    const stores = new ClientStores();
    const input = message("1", "1");
    input.mentions = [{ userId: "5", name: null, at: [0], length: 1 }];
    stores.setThread("1", [input]);
    const snapshot = stores.getSnapshot("thread.1");
    input.text = "Caller mutation";
    input.mentions[0]?.at.push(3);
    expect(snapshot.messages["1"]?.text).toBe("Synthetic body");
    expect(snapshot.messages["1"]?.mentions?.[0]?.at).toEqual([0]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.messages["1"]?.mentions?.[0]?.at)).toBe(
      true,
    );
    expect(stores.getSnapshot("thread.missing")).toBe(
      stores.getSnapshot("thread.missing"),
    );
    expect(stores.getSnapshot("pending.missing")).toBe(
      stores.getSnapshot("pending.missing"),
    );
  });
  test("room ids that look like derived keys keep their own slices", () => {
    const stores = new ClientStores();
    expect(stores.getSnapshot("thread.9.order").order).toEqual([]);
    stores.setThread("7", [message("7", "1")]);
    stores.setThread("7.order", [message("7.order", "2")]);
    const order7 = stores.getSnapshot("order.7");
    expect(order7).toEqual(["1"]);
    expect(stores.getSnapshot("order.7.order")).toEqual(["2"]);
    expect(stores.getSnapshot("thread.7").order).toEqual(["1"]);
    expect(stores.getSnapshot("thread.7.order").order).toEqual(["2"]);
    stores.setThread("7.order", [
      message("7.order", "2"),
      message("7.order", "3"),
    ]);
    expect(stores.getSnapshot("order.7")).toBe(order7);
    expect(stores.getSnapshot("thread.7").order).toEqual(["1"]);
    stores.setCatalog([room("s.order")]);
    expect(stores.getSnapshot("room.s.order")?.room.id).toBe("s.order");
    expect(stores.getSnapshot("rooms.order")).toEqual(["s.order"]);
  });
  test("connection, send, pending and thread order publish independently and atomically", () => {
    const stores = new ClientStores();
    const keys = ["connection", "send", "pending.1", "order.1"] as const;
    const calls: string[] = [];
    for (const key of keys) stores.subscribe(key, () => calls.push(key));
    stores.setConnection({ status: "connecting", epoch: "4", cursor: {} });
    stores.setSend({ blocked: true, reason: "pending-count" });
    stores.setPending("1", [
      {
        attemptId: "synthetic-1",
        roomId: "1",
        text: "Draft",
        status: "unknown",
      },
    ]);
    stores.subscribe("order.1", () => {
      expect(stores.getSnapshot("message.1.1")?.id).toBe("1");
    });
    stores.setThread("1", [message("1", "1")]);
    stores.setThread("1", [message("1", "1", "Changed body")]);
    expect(calls).toEqual([...keys]);
  });
});

describe("bounded cache", () => {
  test("uses the approved bounds and retains the newest windows in numeric string order", () => {
    expect(CACHE_LIMITS).toEqual({
      activeMessages: 1000,
      inactiveMessages: 200,
      inactiveRooms: 4,
      messageBytes: 16 * 1024 * 1024,
      catalogBytes: 8 * 1024 * 1024,
      previewCharacters: 200,
      pendingCount: 32,
      pendingBytes: 1024 * 1024,
    });
    const cache = new BoundedCache();
    cache.selectRoom("1");
    cache.putMessages(
      "1",
      Array.from({ length: 1005 }, (_, i) => message("1", String(i))),
    );
    expect(cache.stores.getSnapshot("thread.1").order).toHaveLength(1000);
    expect(cache.stores.getSnapshot("thread.1").order[0]).toBe("5");
    expect(cache.stores.getSnapshot("thread.1").gaps).toContain(
      "message-count",
    );
    cache.selectRoom("2");
    expect(cache.stores.getSnapshot("thread.1").order).toHaveLength(200);
    expect(cache.stores.getSnapshot("thread.1").order[0]).toBe("805");
  });
  test("LRU never removes the active room or pending sends and clears evicted cursors", () => {
    const cache = new BoundedCache();
    cache.selectRoom("1");
    cache.putMessages("1", [message("1", "1")]);
    cache.addPending({
      attemptId: "synthetic-pending",
      roomId: "2",
      text: "Uncertain draft",
      status: "unknown",
    });
    const pending = cache.stores.getSnapshot("pending.2");
    for (const id of ["2", "3", "4", "5"])
      cache.putMessages(id, [message(id, "1")], { cursor: "1" });
    cache.touchRoom("3");
    cache.putMessages("6", [message("6", "1")]);
    expect(cache.getSnapshot().retainedRoomIds).toEqual([
      "1",
      "4",
      "5",
      "3",
      "6",
    ]);
    expect(cache.stores.getSnapshot("thread.2").order).toEqual([]);
    expect(cache.stores.getSnapshot("thread.2").cursor).toBeNull();
    expect(cache.stores.getSnapshot("thread.2").gaps).toContain("room-lru");
    expect(cache.stores.getSnapshot("pending.2")).toBe(pending);
    expect(pending[0]?.text).toBe("Uncertain draft");
    expect(cache.stores.getSnapshot("thread.1").order).toEqual(["1"]);
  });
  test("pins scroll anchors and explicitly rejects room pressure when every victim is protected", () => {
    const cache = new BoundedCache({ inactiveRooms: 1, activeMessages: 2 });
    cache.selectRoom("1");
    cache.putMessages("1", [message("1", "1"), message("1", "2")]);
    cache.setScrollAnchor("1", "1");
    cache.putMessages("1", [message("1", "3")]);
    expect(cache.stores.getSnapshot("thread.1").order).toEqual(["1", "3"]);
    cache.selectRoom("2");
    cache.putMessages("3", [message("3", "1")]);
    expect(cache.getSnapshot().retainedRoomIds).toContain("1");
    expect(cache.getSnapshot().retainedRoomIds).not.toContain("3");
    expect(cache.getSnapshot().status.kind).toBe("over-capacity");
  });
  test("pins observed messages referenced by pending sends", () => {
    const cache = new BoundedCache({ activeMessages: 1 });
    cache.selectRoom("1");
    cache.putMessages("1", [message("1", "1")]);
    cache.addPending({
      attemptId: "synthetic-link",
      roomId: "1",
      text: "Draft",
      status: "submitted",
      messageId: "1",
    });
    expect(cache.putMessages("1", [message("1", "2")]).retained).toBe(false);
    expect(cache.stores.getSnapshot("thread.1").order).toEqual(["1"]);
    expect(cache.getSnapshot().status.kind).toBe("over-capacity");
  });
  test("counts UTF-8 payload bytes and rejects oversize bodies intact", () => {
    const original = message("1", "1");
    const limit = payloadBytes(original);
    const cache = new BoundedCache({ messageBytes: limit });
    cache.selectRoom("1");
    cache.putMessages("1", [original]);
    const huge = message("1", "2", "\uD83D\uDC08".repeat(limit));
    expect(cache.putMessages("1", [huge]).retained).toBe(false);
    expect(cache.stores.getSnapshot("thread.1").messages["1"]?.text).toBe(
      original.text,
    );
    expect(cache.stores.getSnapshot("thread.1").messages["2"]).toBeUndefined();
    expect(cache.stores.getSnapshot("thread.1").gaps).toContain(
      "message-bytes",
    );
    expect(cache.getSnapshot().messageBytes).toBe(limit);
    expect(cache.getSnapshot().status.kind).toBe("over-capacity");
    expect(payloadBytes("\uD83D\uDC08")).toBe(6);
  });
  test("global byte pressure evicts least recently used inactive payload first", () => {
    const one = message("1", "1");
    const cache = new BoundedCache({ messageBytes: payloadBytes(one) * 2 });
    cache.selectRoom("1");
    cache.putMessages("1", [one]);
    cache.putMessages("2", [message("2", "1")]);
    cache.putMessages("3", [message("3", "1")]);
    expect(cache.getSnapshot().messageBytes).toBeLessThanOrEqual(
      payloadBytes(one) * 2,
    );
    expect(cache.stores.getSnapshot("thread.1").order).toEqual(["1"]);
    expect(cache.stores.getSnapshot("thread.2").order).toEqual([]);
    expect(cache.stores.getSnapshot("thread.2").gaps).toContain(
      "message-bytes",
    );
  });
  test("catalog rejection is atomic, previews use observed code points and ignore old replay", () => {
    const rooms = [room("1")];
    const cache = new BoundedCache({ catalogBytes: payloadBytes(rooms) });
    expect(cache.setCatalog(rooms)).toBe(true);
    const order = cache.stores.getSnapshot("rooms.order");
    expect(cache.setCatalog([room("2", "x".repeat(1000))])).toBe(false);
    expect(cache.stores.getSnapshot("rooms.order")).toBe(order);
    expect(cache.getSnapshot().status.reason).toBe("catalog-bytes");
    const text = "\uD83D\uDC08".repeat(250);
    cache.putMessages("1", [message("1", "2", text)]);
    cache.putMessages("1", [message("1", "1", "Older replay")]);
    const preview = cache.stores.getSnapshot("room.1")?.preview;
    expect(preview).toBe("\uD83D\uDC08".repeat(200));
    expect(cache.stores.getSnapshot("thread.1").messages["2"]?.text).toBe(text);
    expect(cache.stores.getSnapshot("room.1")?.room.unread).toBe(7);
  });
  test("capacity status stays visible until the reader acknowledges it", () => {
    const cache = new BoundedCache({ activeMessages: 1 });
    const notifications: string[] = [];
    cache.subscribe(() => notifications.push(cache.getSnapshot().status.kind));
    cache.selectRoom("1");
    cache.putMessages("1", [message("1", "1"), message("1", "2")]);
    expect(cache.getSnapshot().status).toEqual({
      kind: "gap",
      reason: "message-count",
      roomId: "1",
    });
    cache.acknowledgeStatus();
    expect(cache.getSnapshot().status).toEqual({
      kind: "ok",
      reason: null,
      roomId: null,
    });
    // Acknowledging the banner is not a claim of recovery: the room keeps its gap.
    expect(cache.stores.getSnapshot("thread.1").gaps).toContain(
      "message-count",
    );
    const settled = cache.getSnapshot();
    const count = notifications.length;
    cache.acknowledgeStatus();
    expect(cache.getSnapshot()).toBe(settled);
    expect(notifications.length).toBe(count);
    expect(notifications.at(-1)).toBe("ok");
  });
  test("pending capacity blocks new sends rather than evicting existing attempts", () => {
    const cache = new BoundedCache({ pendingCount: 1 });
    const first = {
      attemptId: "synthetic-1",
      roomId: "1",
      text: "Original draft",
      status: "unknown" as const,
    };
    expect(cache.addPending(first)).toBe(true);
    const pending = cache.stores.getSnapshot("pending.1");
    expect(cache.addPending({ ...first, attemptId: "synthetic-2" })).toBe(
      false,
    );
    expect(cache.stores.getSnapshot("pending.1")).toBe(pending);
    expect(cache.stores.getSnapshot("send")).toEqual({
      blocked: true,
      reason: "pending-count",
    });
    cache.removePending("synthetic-1");
    expect(cache.addPending({ ...first, attemptId: "synthetic-2" })).toBe(true);
    const byteCache = new BoundedCache({ pendingBytes: payloadBytes(first) });
    expect(byteCache.addPending(first)).toBe(true);
    expect(byteCache.addPending({ ...first, text: "x".repeat(1000) })).toBe(
      false,
    );
    expect(byteCache.stores.getSnapshot("pending.1")[0]?.text).toBe(first.text);
    expect(byteCache.stores.getSnapshot("send").reason).toBe("pending-bytes");
  });
});
