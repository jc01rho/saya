import { resolve } from "node:path";
import type { SendAttempt } from "../../../src/core/send";
import { Barriers } from "../../harness/barriers";
import { domBarrier } from "../../harness/browser-barriers";
import type { ScenarioContext } from "../../harness/runner";

// Test-only composition. The parent owns the app and coordinator send-command
// integration; this exercises the real ledger, HTTP, IndexedDB and pending UI.
const entry = `
import { createElement as h, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { IndexedMetadata } from "./src/coordination/metadata";
import { SendLedger } from "./src/core/send";
import { BoundedCache } from "./src/core/cache";
import { ContextWindows } from "./src/core/context";
import { HttpClient } from "./src/transport/http";
import { PendingList, PendingRecovery } from "./src/features/composer/pending";
import { ThreadPane } from "./src/features/thread";
import "./src/styles/tokens.css";
window.startSend = async (room) => {
  const metadata = await IndexedMetadata.open(indexedDB);
  const http = new HttpClient();
  const cache = new BoundedCache();
  cache.setCatalog([room]); cache.selectRoom(room.id);
  const windows = new ContextWindows(http, cache);
  const ledger = new SendLedger({ http, metadata, isReady: () => true });
  const recovered = await ledger.recover();
  const emit = (event) => window.sendEvent(event);
  ledger.subscribe(() => emit({type: "ledger", attempts: ledger.getSnapshot()}));
  windows.subscribe(room.id, () => {
    const state = windows.getSnapshot(room.id);
    if (!state.settled || state.loading) return;
    const thread = cache.stores.getSnapshot("thread." + room.id);
    for (const id of thread.order) ledger.observe(thread.messages[id]);
    emit({type: "context"});
  });
  const root = document.createElement("main");
  root.style.cssText = "height:100dvh;max-width:880px;margin:auto;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;background:var(--field-wall);color:var(--ink);font:16px/1.7 system-ui,sans-serif";
  document.body.style.cssText = "margin:0;background:var(--field-list)";
  document.body.append(root);
  function Surface() {
    const [text, setText] = useState("");
    const [revision, setRevision] = useState(0);
    const [uuid, setUuid] = useState(null);
    const attempts = useSyncExternalStore(ledger.subscribe, ledger.getSnapshot);
    const current = attempts.find((item) => item.uuid === uuid);
    const fingerprint = { roomId: room.id, text, openRoom: true, draftRevision: revision };
    const preview = () => {
      const order = cache.stores.getSnapshot("thread." + room.id).order;
      const id = ledger.create({...fingerprint, baseline: order.at(-1) ?? null});
      setUuid(id); void ledger.preview(id);
    };
    const confirm = () => { if (uuid) void ledger.submit(uuid, fingerprint); };
    return h("div", {style:{display:"contents"}},
      h("h1", {style:{margin:"0",padding:"8px 24px",fontSize:"20px"}}, "가상 관측소 · 전송 기록"),
      h(ThreadPane, {stores:cache.stores, windows, roomId:room.id}),
      h("div", {"data-ui":"send-ground",style:{borderTop:"1px solid var(--rule)",minHeight:0}},
        h(PendingRecovery,{attempts:recovered}),
        h(PendingList,{ledger,roomId:room.id,onNewAttempt:(draft)=>{setText(draft.text);setRevision(revision+1);setUuid(null);}})),
      h("section", {style:{padding:"12px 24px",background:"var(--field-ground)"}},
        h("label", null, "메시지 작성", h("textarea", {"data-ui":"send-input",value:text,style:{display:"block",width:"100%",boxSizing:"border-box",font:"inherit"},onChange:(e)=>{setText(e.target.value);setRevision(revision+1);if(uuid&&e.target.value.trim()) ledger.edit(uuid,{...fingerprint,text:e.target.value,draftRevision:revision+1,baseline:current?.draft.baseline??null});}})),
        h("button", {type:"button","data-ui":"send-preview",onClick:preview},"미리보기"),
        current?.state === "awaiting-consent" ? h("div", {"data-ui":"send-consent"},h("p",null,"미리보기는 초안을 잠그지 않습니다. 데스크톱 초안이 지워질 수 있습니다."),h("button",{type:"button","data-ui":"send-confirm",onClick:confirm},"확인 후 보내기")) : null,
        h("button", {type:"button","data-ui":"send-refresh",onClick:()=>windows.retry(room.id)},"기록 다시 읽기")));
  }
  createRoot(root).render(h(Surface));
  window.sendSurface = {
    snapshot: () => ledger.getSnapshot(),
    metadata: () => metadata.read(),
    repeat: async () => { for (const attempt of ledger.getSnapshot()) await ledger.submit(attempt.uuid, attempt.draft); },
    stop: () => ledger.stop(),
    close: () => {ledger.stop();windows.close(room.id);metadata.close();}
  };
};
`;
export type SendEvent = {
  type: "ledger" | "context";
  attempts?: SendAttempt[];
};
export function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function mountSurface({ page, bridge, url }: ScenarioContext) {
  const build = await Bun.build({
    entrypoints: ["send-entry"],
    target: "browser",
    format: "iife",
    plugins: [
      {
        name: "send-entry",
        setup(builder) {
          builder.onResolve({ filter: /^send-entry$/ }, () => ({
            path: "send-entry",
            namespace: "send",
          }));
          builder.onLoad({ filter: /.*/, namespace: "send" }, () => ({
            contents: entry,
            loader: "js",
            resolveDir: resolve(import.meta.dir, "../../.."),
          }));
        },
      },
    ],
  });
  if (!build.success)
    throw new AggregateError(build.logs, "Send browser bundle failed");
  const events = new Barriers<SendEvent>();
  await page.exposeFunction("sendEvent", (event: SendEvent) =>
    events.emit(event),
  );
  await page.goto(`${url}/__qa/blank`);
  for (const output of build.outputs) {
    if (output.path.endsWith(".css"))
      await page.addStyleTag({ content: await output.text() });
    if (output.path.endsWith(".js"))
      await page.addScriptTag({ content: await output.text() });
  }
  const room = bridge.data.rooms[0];
  assert(room, "Missing synthetic room");
  const loaded = events.expect(
    (event) => event.type === "context",
    "initial context applied",
  );
  await page.evaluate(
    (room) =>
      (Reflect.get(window, "startSend") as (room: unknown) => Promise<void>)(
        room,
      ),
    room,
  );
  await loaded;
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/send" &&
      request.postDataJSON()?.dryRun === false
    )
      posts.push(request.postData() ?? "");
  });
  return { events, posts, room };
}
/** Each call is a whole fresh consent: a new UUID, its own dry run, its own confirmation. */
export async function preview(context: ScenarioContext, text: string) {
  assert(
    (await context.page.locator('[data-ui="send-consent"]').count()) === 0,
    "A consent was already open: this preview would not have proven anything",
  );
  await context.page.locator('[data-ui="send-input"]').fill(text);
  const ready = await domBarrier(context.page, '[data-ui="send-consent"]');
  await context.page.locator('[data-ui="send-preview"]').click();
  await ready.wait();
  const attempt = (await snapshot(context)).at(-1);
  assert(
    attempt?.state === "awaiting-consent",
    "Preview did not reach consent",
  );
  return attempt.uuid;
}
export async function snapshot(
  context: ScenarioContext,
): Promise<SendAttempt[]> {
  return context.page.evaluate(() =>
    (
      Reflect.get(window, "sendSurface") as { snapshot(): SendAttempt[] }
    ).snapshot(),
  );
}
export async function repeat(context: ScenarioContext) {
  await context.page.evaluate(() =>
    (
      Reflect.get(window, "sendSurface") as { repeat(): Promise<void> }
    ).repeat(),
  );
}
/** Models the leader losing the ability to finish: aborts, never re-sends. */
export async function stopLeader(context: ScenarioContext) {
  await context.page.evaluate(() =>
    (Reflect.get(window, "sendSurface") as { stop(): void }).stop(),
  );
}
export async function coordinationMetadata(context: ScenarioContext) {
  return context.page.evaluate(() =>
    (
      Reflect.get(window, "sendSurface") as {
        metadata(): Promise<{
          attempts: { uuid: string; status: string }[];
        }>;
      }
    ).metadata(),
  );
}
export async function close(context: ScenarioContext) {
  await context.page.evaluate(() =>
    (Reflect.get(window, "sendSurface") as { close(): void }).close(),
  );
}
