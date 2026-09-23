import { describe, expect, test } from "bun:test";
import {
  DigestRequests,
  RETAINED_DIGESTS,
} from "../../src/features/digest/requests";
import {
  digestOf,
  drain,
  fakeTransport,
  NOTE,
  roomFor,
  sliceFor,
  success,
  syntheticRows,
  whenSettled,
} from "./synthetic";

const room = roomFor("18491246151592761", "가상 관측소 1");
const DEFAULTS = { span: "30m", limit: 400, highlights: 3 };

function harness() {
  const fake = fakeTransport();
  const requests = new DigestRequests(fake.transport);
  const queryOf = (index: number) => {
    const query = fake.pending[index]?.request.query;
    return query ? Object.fromEntries(query.entries()) : null;
  };
  return { ...fake, requests, queryOf };
}

describe("digest requests", () => {
  test("an invalid span is refused on the client: nothing is sent and the field is named", () => {
    const { pending, requests } = harness();
    expect(
      requests.load(room.id, { span: "0m", limit: 400, highlights: 3 }),
    ).toBe(false);
    expect(pending).toHaveLength(0);
    let snapshot = requests.getSnapshot(room.id);
    expect(snapshot.loading).toBe(false);
    expect(snapshot.digest).toBeNull();
    expect(snapshot.failure).toEqual({
      kind: "invalid",
      problems: [{ field: "span", reason: "zero" }],
    });
    // The room keeps the parameters it last accepted: the defaults, untouched by the refusal.
    expect(snapshot.params).toEqual(DEFAULTS);

    for (const span of ["1w", "30", "", "30 m"]) {
      expect(requests.load(room.id, { span, limit: 400, highlights: 3 })).toBe(
        false,
      );
      snapshot = requests.getSnapshot(room.id);
      expect(snapshot.failure).toEqual({
        kind: "invalid",
        problems: [{ field: "span", reason: "shape" }],
      });
    }
    expect(pending).toHaveLength(0);
  });

  test("more than 20 highlights, or a limit outside 1..1000, never reaches the bridge", () => {
    const { pending, requests, queryOf } = harness();
    expect(
      requests.load(room.id, { span: "30m", limit: 400, highlights: 21 }),
    ).toBe(false);
    expect(requests.getSnapshot(room.id).failure).toEqual({
      kind: "invalid",
      problems: [{ field: "highlights", reason: "count" }],
    });
    expect(
      requests.load(room.id, { span: "30m", limit: 400, highlights: 0 }),
    ).toBe(false);
    expect(
      requests.load(room.id, { span: "30m", limit: 1001, highlights: 3 }),
    ).toBe(false);
    expect(
      requests.load(room.id, { span: "30m", limit: 0, highlights: 3 }),
    ).toBe(false);
    expect(
      requests.load(room.id, {
        span: "30m",
        limit: Number.NaN,
        highlights: Number.NaN,
      }),
    ).toBe(false);
    expect(requests.getSnapshot(room.id).failure).toEqual({
      kind: "invalid",
      problems: [
        { field: "limit", reason: "count" },
        { field: "highlights", reason: "count" },
      ],
    });
    expect(pending).toHaveLength(0);

    // The edges are inside the contract and go out as typed.
    expect(
      requests.load(room.id, { span: " 2H ", limit: 1000, highlights: 20 }),
    ).toBe(true);
    expect(pending).toHaveLength(1);
    expect(queryOf(0)).toEqual({
      roomId: room.id,
      span: "2h",
      limit: "1000",
      highlights: "20",
    });
    expect(requests.getSnapshot(room.id).failure).toBeNull();
    expect(requests.getSnapshot(room.id).params).toEqual({
      span: "2h",
      limit: 1000,
      highlights: 20,
    });
  });

  test("open sends the defaults as an explicit query and applies the answer with its note verbatim", async () => {
    const { pending, requests, queryOf } = harness();
    requests.open(room.id);
    expect(pending).toHaveLength(1);
    const [first] = pending;
    expect(first?.request.path).toBe("/digest");
    expect(first?.request.generationKey).toBe(`digest:${room.id}`);
    expect(queryOf(0)).toEqual({
      roomId: room.id,
      span: "30m",
      limit: "400",
      highlights: "3",
    });
    expect(requests.getSnapshot(room.id).loading).toBe(true);

    const rows = syntheticRows(room.id, 40);
    const digest = digestOf(room, {
      span: "30m",
      considered: 40,
      slices: [sliceFor(rows, 3)],
    });
    const settled = whenSettled(requests, room.id);
    first?.resolve(success(digest));
    await settled;

    const snapshot = requests.getSnapshot(room.id);
    expect(snapshot.loading).toBe(false);
    expect(snapshot.failure).toBeNull();
    expect(snapshot.params).toEqual(DEFAULTS);
    expect(snapshot.digest?.note).toBe(NOTE);
    expect(snapshot.digest?.considered).toBe(40);
    expect(
      snapshot.digest?.slices[0]?.highlights.map((message) => message.id),
    ).toEqual(rows.slice(0, 3).map((row) => row.id));
    expect(snapshot.digest?.slices[0]?.speakers).toEqual([
      { name: "가상참여자-0", count: 10 },
      { name: "가상참여자-1", count: 10 },
      { name: "가상참여자-2", count: 10 },
      { name: "가상참여자-3", count: 10 },
    ]);
  });

  test("an empty digest is an answer, not a failure", async () => {
    const { pending, requests } = harness();
    requests.open(room.id);
    const settled = whenSettled(requests, room.id);
    pending[0]?.resolve(
      success(digestOf(room, { span: "30m", considered: 0, slices: [] })),
    );
    await settled;
    const snapshot = requests.getSnapshot(room.id);
    expect(snapshot.failure).toBeNull();
    expect(snapshot.digest?.considered).toBe(0);
    expect(snapshot.digest?.slices).toEqual([]);
    expect(snapshot.digest?.note).toBe(NOTE);
  });

  test("a superseded or closed request never lands", async () => {
    const { pending, requests, queryOf } = harness();
    const rows = syntheticRows(room.id, 40);
    requests.open(room.id);
    expect(
      requests.load(room.id, { span: "1h", limit: 200, highlights: 5 }),
    ).toBe(true);
    const [first, second] = pending;
    expect(pending).toHaveLength(2);
    expect(first?.request.signal.aborted).toBe(true);
    expect(queryOf(1)?.span).toBe("1h");
    expect(requests.getSnapshot(room.id).params).toEqual({
      span: "1h",
      limit: 200,
      highlights: 5,
    });

    // The older generation answers late; nothing may change.
    first?.resolve(
      success(
        digestOf(room, {
          span: "30m",
          considered: 40,
          slices: [sliceFor(rows, 3)],
        }),
      ),
    );
    await drain();
    expect(requests.getSnapshot(room.id).digest).toBeNull();
    expect(requests.getSnapshot(room.id).loading).toBe(true);

    const settled = whenSettled(requests, room.id);
    second?.resolve(
      success(
        digestOf(room, {
          span: "1h",
          considered: 40,
          slices: [sliceFor(rows, 5)],
        }),
      ),
    );
    await settled;
    expect(requests.getSnapshot(room.id).digest?.span).toBe("1h");

    // A closed sheet's answer is discarded; the held digest and parameters stay.
    requests.open(room.id);
    const third = pending[2];
    requests.close(room.id);
    expect(third?.request.signal.aborted).toBe(true);
    expect(requests.getSnapshot(room.id).loading).toBe(false);
    third?.resolve(
      success(digestOf(room, { span: "1h", considered: 0, slices: [] })),
    );
    await drain();
    expect(requests.getSnapshot(room.id).digest?.considered).toBe(40);
    expect(requests.getSnapshot(room.id).params).toEqual({
      span: "1h",
      limit: 200,
      highlights: 5,
    });
  });

  test("bridge refusals keep their code; no answer is a network failure; another room's digest is a protocol failure", async () => {
    const { pending, requests } = harness();
    requests.open(room.id);
    let settled = whenSettled(requests, room.id);
    pending[0]?.resolve({
      kind: "failure",
      status: 400,
      error: { code: "INVALID_REQUEST", message: "synthetic" },
    });
    await settled;
    expect(requests.getSnapshot(room.id).failure).toEqual({
      kind: "bridge",
      outcome: {
        kind: "failure",
        status: 400,
        error: { code: "INVALID_REQUEST", message: "synthetic" },
      },
    });
    expect(requests.getSnapshot(room.id).digest).toBeNull();

    requests.retry(room.id);
    expect(requests.getSnapshot(room.id).failure).toBeNull();
    settled = whenSettled(requests, room.id);
    pending[1]?.reject(new TypeError("Failed to fetch"));
    await settled;
    expect(requests.getSnapshot(room.id).failure).toEqual({ kind: "network" });

    const other = roomFor("18491246151592999", "가상 관측소 다른 방");
    requests.retry(room.id);
    settled = whenSettled(requests, room.id);
    pending[2]?.resolve(
      success(
        digestOf(other, {
          span: "30m",
          considered: 3,
          slices: [sliceFor(syntheticRows(other.id, 3), 3)],
        }),
      ),
    );
    await settled;
    expect(requests.getSnapshot(room.id).failure).toEqual({
      kind: "protocol",
    });
    expect(requests.getSnapshot(room.id).digest).toBeNull();
  });

  test(`answers are kept for at most ${RETAINED_DIGESTS} rooms`, async () => {
    const { pending, requests } = harness();
    const rooms = Array.from({ length: RETAINED_DIGESTS + 1 }, (_, index) =>
      roomFor(`1849124615159270${index}`, `가상 관측소 보관 ${index}`),
    );
    for (const [index, item] of rooms.entries()) {
      requests.open(item.id);
      const settled = whenSettled(requests, item.id);
      pending[index]?.resolve(
        success(
          digestOf(item, {
            span: "30m",
            considered: 2,
            slices: [sliceFor(syntheticRows(item.id, 2), 2)],
          }),
        ),
      );
      await settled;
    }
    const [oldest, ...kept] = rooms;
    expect(oldest && requests.getSnapshot(oldest.id).digest).toBeNull();
    for (const item of kept)
      expect(requests.getSnapshot(item.id).digest?.room.id).toBe(item.id);
  });
});
