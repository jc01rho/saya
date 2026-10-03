import { afterEach, expect, test } from "bun:test";
import { ComposerState } from "../../src/features/composer/state";
import { PirateTalkSession } from "../../src/features/piratetalk/session";
import { PirateTalkTransport } from "../../src/transport/piratetalk";

const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});

test("discovery distinguishes unsupported authentication malformed and incompatible", async () => {
  for (const [status, body, kind] of [
    [404, {}, "unsupported"],
    [401, {}, "unauthorized"],
    [200, {}, "malformed"],
    [200, { version: "2.0.0" }, "incompatible"],
  ] as const) {
    globalThis.fetch = Object.assign(
      async () => Response.json(body, { status }),
      { preconnect: original.preconnect },
    );
    expect(
      (await new PirateTalkTransport().discover(new AbortController().signal))
        .kind,
    ).toBe(kind);
  }
});

test("uncertain malformed and misleading mutations make one attempt", async () => {
  for (const body of [
    { outcome: "confirmed" },
    { outcome: "confirmed", messageId: "9007199254740993" },
    { ok: true },
  ]) {
    let calls = 0;
    globalThis.fetch = Object.assign(
      async () => {
        calls++;
        return Response.json(body, { status: 502 });
      },
      { preconnect: original.preconnect },
    );
    const result = await new PirateTalkTransport().send(
      { kind: "text", roomId: "1003", text: "test" },
      new AbortController().signal,
    );
    expect(result.outcome).toBe("unconfirmed");
    expect(calls).toBe(1);
  }
});

test("session starts once and stale discovery cannot replace reconnect", async () => {
  const first = Promise.withResolvers<Response>();
  const second = Promise.withResolvers<Response>();
  let calls = 0;
  globalThis.fetch = Object.assign(
    () => (++calls === 1 ? first.promise : second.promise),
    { preconnect: original.preconnect },
  );
  const session = new PirateTalkSession();
  session.start();
  session.start();
  expect(calls).toBe(1);
  session.reconnect();
  const done = Promise.withResolvers<void>();
  const unsubscribe = session.subscribe(() => {
    if (session.getSnapshot().kind === "unauthorized") done.resolve();
  });
  second.resolve(Response.json({}, { status: 401 }));
  await done.promise;
  first.resolve(Response.json({}, { status: 404 }));
  await first.promise;
  expect(session.getSnapshot().kind).toBe("unauthorized");
  expect(calls).toBe(2);
  unsubscribe();
});

test("room changes and dirty drafts preserve independent uncertain attempts", () => {
  const state = new ComposerState();
  state.setText("1003", "original");
  state.setPending("1003", "original", "uncertain");
  state.setText("1003", "new draft");
  state.setText("1004", "other room");
  expect(state.getPending("1003")).toEqual({
    text: "original",
    kind: "uncertain",
  });
  expect(state.getDraft("1003").text).toBe("new draft");
  expect(state.getPending("1004")).toBeUndefined();
});

test("validated confirmed mutation clears only its unchanged originating draft", () => {
  const state = new ComposerState();
  const original = state.setText("1003", "sent");
  const fingerprint = {
    roomId: "1003",
    text: "sent",
    openRoom: true,
    draftRevision: original.revision,
  };
  state.setText("1003", "new draft");
  state.applyMutation(fingerprint, {
    outcome: "confirmed",
    messageId: "9007199254740993",
  });
  expect(state.getDraft("1003").text).toBe("new draft");
  state.applyMutation(fingerprint, {
    outcome: "unconfirmed",
    error: { code: "unknown", detail: "unknown" },
  });
  expect(state.getPending("1003")?.kind).toBe("uncertain");
});
