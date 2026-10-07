import assert from "node:assert/strict";
import { CONTRACT_VERSION } from "../../src/contract/tsuba/version";
import type { AdapterMessage } from "../../src/transport/adapters";
import { bounded } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

/**
 * A room in a Discord server reads like Discord: every line on the left, one
 * round picture, name and time per run (one speaker within seven minutes), a
 * reply's quote above its name, files under the words. A direct room on the
 * same adapter keeps the KakaoTalk bubbles. Every name, word and byte is invented.
 */
const guild = { id: "100000000000000001", name: "Synthetic server" };
const channel = { id: "300000000000000010", name: "general", position: 1 };
const PLACE_ROOM = channel.id;
const DIRECT_ROOM = "400000000000000001";

const LOOKS: { name: string; storage?: Record<string, string> }[] = [
  { name: "default" },
];

const message = (
  id: string,
  who: "a" | "b" | "me",
  minute: string,
  text: string,
  extra: Partial<AdapterMessage> = {},
): AdapterMessage => ({
  id,
  roomId: PLACE_ROOM,
  senderId: who,
  sender: who === "me" ? "나" : who === "a" ? "가상참여자-1" : "가상참여자-2",
  fromMe: who === "me",
  sentAt: `2037-04-07T12:${minute}:00Z`,
  kind: "text",
  text,
  ...extra,
});

const MESSAGES: AdapterMessage[] = [
  message("0", "a", "00", "오늘 시안 올려볼게요"),
  message(
    "1",
    "a",
    "03",
    "말풍선 없이 줄 단위로 읽히게 바꿨고, 같은 사람이 이어서 쓰면 이름과 사진은 한 번만 나와요. 긴 글도 화면 폭을 다 쓰니까 답답하지 않게 읽힙니다. 테마 색과 배경 그림은 그대로예요.",
  ),
  message("2", "a", "04", "캡처 첨부", {
    kind: "media",
    attachments: [
      {
        id: "picture",
        kind: "image",
        mimeType: "image/png",
        width: 640,
        height: 480,
      },
    ],
  }),
  message("3", "b", "06", "좋네요! 버튼은 조금 더 크게 가면 어때요?", {
    reactions: [{ emoji: "\u{1F440}", count: 2, mine: false }],
  }),
  message("4", "me", "07", "네, 다음 시안에서 키울게요", { replyTo: "3" }),
  message("5", "me", "08", "다크 테마도 같이 볼게요", {
    reactions: [{ emoji: "\u{1F44D}", count: 1, mine: true }],
  }),
  message("6", "b", "30", "확인했습니다"),
  message("7", "b", "45", "15분 뒤에 같은 사람이 다시 쓰면 새 묶음"),
];

const DIRECT: AdapterMessage[] = [
  { ...message("d0", "a", "00", "DM은 말풍선 그대로"), roomId: DIRECT_ROOM },
  { ...message("d1", "me", "01", "네"), roomId: DIRECT_ROOM },
];

export const scenario: Scenario = {
  id: "discord-turns",
  async run({ context, url, log, evidence }) {
    const png = Buffer.from(
      await Bun.file(
        new URL("../fixtures/synthetic-media.png", import.meta.url),
      ).arrayBuffer(),
    );
    for (const look of LOOKS)
      for (const width of [1440, 390]) {
        const page = await context.newPage();
        await page.setViewportSize({
          width,
          height: width === 390 ? 844 : 900,
        });
        await page.route("**/adapters{,/**}", async (route) => {
          const request = new URL(route.request().url());
          const json = (body: unknown) => route.fulfill({ json: body });
          if (request.pathname === "/adapters")
            return json({ adapters: [{ id: "discord" }] });
          if (request.pathname.endsWith("/capabilities"))
            return json({
              ok: true,
              contract: { version: CONTRACT_VERSION },
              adapter: { name: "synthetic", version: "0.0.0" },
              provider: { id: "discord", name: "Discord" },
              account: { kind: "user" },
              revision: "0123456789abcdef",
              features: {
                "rooms.list": {},
                "messages.read": { paging: "none", maxLimit: 50 },
                "attachments.read": {},
                "reactions.read": {},
              },
            });
          if (request.pathname.endsWith("/stream"))
            return route.fulfill({
              status: 503,
              json: {
                ok: false,
                error: {
                  code: "BUSY",
                  message: "Synthetic stream unavailable",
                },
              },
            });
          if (request.pathname.endsWith("/rooms"))
            return json({
              ok: true,
              complete: true,
              rooms: [
                {
                  id: PLACE_ROOM,
                  title: "Synthetic server · #general",
                  kind: "group",
                  unread: 0,
                  "x-discord.place": { guild, channel },
                },
                {
                  id: DIRECT_ROOM,
                  title: "가상참여자-1",
                  kind: "direct",
                  unread: 0,
                },
              ],
            });
          if (request.pathname.endsWith("/media"))
            return route.fulfill({ contentType: "image/png", body: png });
          if (request.pathname.endsWith("/messages"))
            return json({
              ok: true,
              hasEarlier: false,
              messages:
                request.searchParams.get("roomId") === DIRECT_ROOM
                  ? DIRECT
                  : MESSAGES,
            });
          throw new Error(
            `Unexpected synthetic adapter route: ${request.pathname}`,
          );
        });
        await page.addInitScript((storage) => {
          for (const [key, value] of Object.entries(storage))
            localStorage.setItem(key, value);
        }, look.storage ?? {});
        // Resolve on the rendered state, not elapsed time.
        const turnsDrawn = (layout: string, count: number) =>
          bounded(
            page
              .locator(`[data-ui="adapter-turn"][data-layout="${layout}"]`)
              .nth(count - 1)
              .waitFor({ state: "attached" }),
            `${count} ${layout} turns`,
            10_000,
          );
        await page.goto(`${url}/#/adapters/discord/${PLACE_ROOM}`, {
          waitUntil: "load",
        });
        await turnsDrawn("lines", MESSAGES.length);
        await bounded(
          page
            .locator('[data-ui="photo"] img')
            .evaluate((img: HTMLImageElement) => {
              img.scrollIntoView({ block: "center" });
              return img.complete ? undefined : img.decode();
            }),
          "synthetic picture decoded",
          10_000,
        );
        const turn = (id: string) => page.locator(`[data-message-id="${id}"]`);
        const head = (id: string) =>
          turn(id).locator('[data-ui="adapter-head"]').count();
        const avatar = (id: string) =>
          turn(id).locator('[data-ui="avatar"]').count();

        assert.equal(
          await page.locator('[data-ui="adapter-turn"]').count(),
          MESSAGES.length,
        );
        assert.equal(
          await page
            .locator('[data-ui="adapter-turn"]:not([data-layout="lines"])')
            .count(),
          0,
          "every turn in a Discord server room is a line",
        );
        // 0-2: one speaker within seven minutes is one run, across minutes.
        assert.deepEqual(
          [await head("0"), await head("1"), await head("2")],
          [1, 0, 0],
        );
        assert.deepEqual(
          [await avatar("0"), await avatar("1"), await avatar("2")],
          [1, 0, 0],
        );
        // 4: mine is drawn like everyone's: picture and name on the left.
        assert.equal(await avatar("4"), 1);
        assert.equal(await head("4"), 1);
        const left = async (id: string) =>
          (await turn(id).locator('[data-ui="avatar"]').boundingBox())?.x;
        assert.equal(await left("4"), await left("0"), "one left edge");
        // 4: the reply's quote sits above the name.
        const quote = turn("4").locator(':scope > [data-ui="adapter-quote"]');
        assert.equal(await quote.count(), 1);
        const quoteBox = await quote.boundingBox();
        const headBox = await turn("4")
          .locator('[data-ui="adapter-head"]')
          .boundingBox();
        assert.ok(quoteBox && headBox && quoteBox.y < headBox.y);
        // 5 joins the reply's run; 7 comes fifteen minutes after 6 and opens one.
        assert.deepEqual([await head("5"), await head("7")], [0, 1]);
        // 2: the words first, the picture under them.
        const words = await turn("2").getByText("캡처 첨부").boundingBox();
        const picture = await turn("2")
          .locator('[data-ui="photo"]')
          .boundingBox();
        assert.ok(words && picture && words.y < picture.y);
        assert.equal(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          ),
          false,
        );
        await page.screenshot({
          path: `${evidence}/${look.name}-${width}-discord-picture.png`,
        });
        await turn("7").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${evidence}/${look.name}-${width}-discord.png`,
        });

        // The same adapter's direct room keeps the bubbles.
        await page.goto(`${url}/#/adapters/discord/${DIRECT_ROOM}`, {
          waitUntil: "load",
        });
        await turnsDrawn("bubbles", DIRECT.length);
        assert.equal(
          await page
            .locator('[data-ui="adapter-turn"][data-layout="lines"]')
            .count(),
          0,
        );
        log("discord-turns", { look: look.name, width });
        await page.close();
      }
  },
};
