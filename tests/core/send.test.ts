import { afterEach, expect, test } from "bun:test";
import { MemoryMetadata } from "../../src/coordination/metadata";
import { type SendDraft, SendLedger } from "../../src/core/send";
import { HttpClient } from "../../src/transport/http";
import { generateData } from "../fixtures/data";
import { bounded, deferred } from "../harness/barriers";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const draft: SendDraft = {
  roomId: "18491246151592761",
  text: "  같은 별빛을 보냅니다.\n둘째 줄도 그대로  ",
  openRoom: true,
  draftRevision: 1,
  baseline: "28000000000000046",
};
function success(dryRun = false, changes = {}) {
  return Response.json({
    ok: true,
    submitted: !dryRun,
    dryRun,
    room: "가상 관측소",
    roomId: draft.roomId,
    length: [...draft.text].length,
    ...changes,
  });
}
function fixture(
  real: (signal: AbortSignal) => Promise<Response> = async () => success(),
) {
  const metadata = new MemoryMetadata();
  const posts: unknown[] = [];
  globalThis.fetch = (async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.dryRun) return success(true);
    posts.push(body);
    expect((await metadata.read()).attempts.at(-1)?.status).toBe("attempting");
    return real(init?.signal as AbortSignal);
  }) as typeof fetch;
  const ledger = new SendLedger({
    http: new HttpClient(),
    metadata,
    isReady: () => true,
  });
  return { ledger, metadata, posts };
}
async function consent(ledger: SendLedger, value = draft) {
  const uuid = ledger.create(value);
  expect(ledger.get(uuid)?.state).toBe("editing");
  await ledger.preview(uuid);
  expect(ledger.get(uuid)?.state).toBe("awaiting-consent");
  return uuid;
}
function observed(id = "28000000000000047") {
  const row = generateData().messages.get(draft.roomId)?.[0];
  if (!row) throw new Error("Missing synthetic row");
  return { ...row, roomId: draft.roomId, id, text: draft.text, fromMe: true };
}

test("double click records UUID before exactly one POST and never reuses it", async () => {
  const release = deferred<Response>();
  const entered = deferred<void>();
  const { ledger, metadata, posts } = fixture(async () => {
    entered.resolve();
    return release.promise;
  });
  const uuid = await consent(ledger);
  const first = ledger.submit(uuid, draft);
  const second = ledger.submit(uuid, draft);
  await bounded(entered.promise, "POST entered");
  expect(posts).toHaveLength(1);
  expect(ledger.get(uuid)?.state).toBe("posting");
  release.resolve(success());
  await Promise.all([first, second]);
  await ledger.submit(uuid, draft);
  expect(posts).toEqual([
    { room: draft.roomId, text: draft.text, openRoom: true, dryRun: false },
  ]);
  expect(ledger.get(uuid)?.state).toBe("submitted");
  expect((await metadata.read()).attempts).toEqual([
    { uuid, status: "submitted" },
  ]);
});

test("distinct attempts serialize actual POSTs", async () => {
  const entered = deferred<void>();
  const release = deferred<Response>();
  let count = 0;
  const { ledger, posts } = fixture(async () => {
    if (++count === 1) {
      entered.resolve();
      return release.promise;
    }
    return success();
  });
  const a = await consent(ledger);
  const b = await consent(ledger);
  const first = ledger.submit(a, draft);
  await bounded(entered.promise, "first POST");
  const second = ledger.submit(b, draft);
  expect(posts).toHaveLength(1);
  release.resolve(success());
  await Promise.all([first, second]);
  expect(posts).toHaveLength(2);
});

for (const [name, response] of [
  [
    "SEND_FAILED",
    () =>
      Response.json(
        { ok: false, error: { code: "SEND_FAILED", message: "가상 오류" } },
        { status: 500 },
      ),
  ],
  [
    "timeout response",
    () =>
      Response.json(
        { ok: false, error: { code: "TIMEOUT", message: "가상 제한" } },
        { status: 408 },
      ),
  ],
  ["corrupt success", () => Response.json({ ok: true })],
  ["wrong room", () => success(false, { roomId: "-22" })],
  ["dry run disguised as success", () => success(true)],
  ["submitted false", () => success(false, { submitted: false })],
  [
    "unknown server error",
    () =>
      Response.json(
        { ok: false, error: { code: "FUTURE_ERROR", message: "가상 오류" } },
        { status: 500 },
      ),
  ],
] as const) {
  test(`${name} stays unknown with zero retries`, async () => {
    const { ledger, posts } = fixture(async () => response());
    const uuid = await consent(ledger);
    await ledger.submit(uuid, draft);
    await ledger.submit(uuid, draft);
    expect(ledger.get(uuid)?.state).toBe("unknown");
    expect(posts).toHaveLength(1);
  });
}

test("abort after dispatch is unknown and never retried", async () => {
  const entered = deferred<void>();
  const { ledger, posts } = fixture(
    (signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
        entered.resolve();
      }),
  );
  const uuid = await consent(ledger);
  const controller = new AbortController();
  const pending = ledger.submit(uuid, draft, controller.signal);
  await bounded(entered.promise, "abortable POST");
  controller.abort();
  await pending;
  await ledger.submit(uuid, draft);
  expect(ledger.get(uuid)?.state).toBe("unknown");
  expect(posts).toHaveLength(1);
});

test("429 consumes consent: only a new preview and explicit attempt can POST", async () => {
  const { ledger, posts } = fixture(async () =>
    Response.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "가상 대기열" } },
      { status: 429 },
    ),
  );
  const first = await consent(ledger);
  await ledger.submit(first, draft);
  expect(ledger.get(first)?.state).toBe("rejected");
  await ledger.preview(first);
  await ledger.submit(first, draft);
  expect(posts).toHaveLength(1);
  const second = ledger.create(draft);
  await ledger.submit(second, draft);
  expect(posts).toHaveLength(1);
  await ledger.preview(second);
  await ledger.submit(second, draft);
  expect(posts).toHaveLength(2);
});

test("two identical attempts and a manual identical row remain unresolved", async () => {
  const { ledger } = fixture();
  const a = await consent(ledger);
  const b = await consent(ledger);
  await Promise.all([ledger.submit(a, draft), ledger.submit(b, draft)]);
  ledger.observe(observed());
  for (const uuid of [a, b]) {
    expect(ledger.get(uuid)?.state).toBe("submitted");
    expect(ledger.get(uuid)?.candidates).toEqual([observed().id]);
    expect(ledger.get(uuid)?.linkedMessageId).toBeNull();
  }
  expect(ledger.confirmLink(a, observed().id)).toBe(true);
  expect(ledger.get(a)?.state).toBe("submitted");
  expect(ledger.get(b)?.linkedMessageId).toBeNull();
  expect(ledger.confirmLink(b, observed().id)).toBe(false);
});

test("matching requires a pre-send baseline, fromMe, exact text and a newer decimal ID", async () => {
  const { ledger } = fixture();
  const missing = await consent(ledger, { ...draft, baseline: null });
  const uuid = await consent(ledger);
  await ledger.submit(missing, draft);
  await ledger.submit(uuid, draft);
  ledger.observe(observed(draft.baseline ?? "0"));
  ledger.observe({ ...observed(), fromMe: false });
  ledger.observe({ ...observed(), roomId: "-22" });
  ledger.observe({ ...observed(), text: draft.text.trim() });
  expect(ledger.get(uuid)?.candidates).toEqual([]);
  ledger.observe(observed("00028000000000000047"));
  ledger.observe(observed("28000000000000047"));
  expect(ledger.get(uuid)?.candidates).toEqual(["00028000000000000047"]);
  expect(ledger.get(missing)?.candidates).toEqual([]);
});

test("every fingerprint field invalidates consent", async () => {
  const { ledger, posts } = fixture();
  for (const change of [
    { roomId: "-22" },
    { text: "다른 초안" },
    { openRoom: false },
    { draftRevision: 2 },
  ]) {
    const uuid = await consent(ledger);
    await ledger.submit(uuid, { ...draft, ...change });
    expect(ledger.get(uuid)?.state).toBe("editing");
  }
  expect(posts).toHaveLength(0);
});

test("revision during preview fences the old result", async () => {
  const release = deferred<Response>();
  const { ledger } = fixture();
  globalThis.fetch = (() => release.promise) as unknown as typeof fetch;
  const uuid = ledger.create(draft);
  const preview = ledger.preview(uuid);
  expect(ledger.get(uuid)?.state).toBe("previewing");
  ledger.edit(uuid, { ...draft, text: "새 초안", draftRevision: 2 });
  release.resolve(success(true));
  await preview;
  expect(ledger.get(uuid)?.state).toBe("editing");
});

test("recovered attempting metadata is unknown without persisting body or reposting", async () => {
  const { ledger, metadata, posts } = fixture();
  const uuid = await consent(ledger);
  await metadata.update((state) =>
    state.attempts.push({ uuid, status: "attempting" }),
  );
  await ledger.submit(uuid, draft);
  expect(posts).toHaveLength(0);
  expect(ledger.get(uuid)?.state).toBe("unknown");
  expect(await ledger.recover()).toEqual([{ uuid, status: "unknown" }]);
  expect(JSON.stringify(await metadata.read())).not.toContain(draft.text);
});

test("metadata failure and not-ready leader reject before any POST", async () => {
  const { metadata, posts } = fixture();
  for (const ready of [false, true]) {
    const ledger = new SendLedger({
      http: new HttpClient(),
      metadata: ready
        ? {
            ...metadata,
            read: () => metadata.read(),
            update: async () => {
              throw new Error("Unavailable");
            },
            close() {},
          }
        : metadata,
      isReady: () => ready,
    });
    const uuid = await consent(ledger);
    await ledger.submit(uuid, draft);
    expect(ledger.get(uuid)?.state).toBe("rejected");
  }
  expect(posts).toHaveLength(0);
});

test("pending memory is bounded, never silently evicted", () => {
  const { ledger } = fixture();
  expect(() => ledger.create({ ...draft, text: "  \n" })).toThrow();
  expect(() =>
    ledger.create({ ...draft, text: "한".repeat(400_000) }),
  ).toThrow();
  for (let i = 0; i < 32; i++) ledger.create(draft);
  expect(() => ledger.create(draft)).toThrow();
  expect(ledger.getSnapshot()).toHaveLength(32);
  expect(ledger.getSnapshot()).toBe(ledger.getSnapshot());
});
