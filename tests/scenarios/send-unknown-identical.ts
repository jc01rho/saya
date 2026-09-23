import type { SendAttempt } from "../../src/core/send";
import { domBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";
import {
  assert,
  close,
  coordinationMetadata,
  mountSurface,
  preview,
  repeat,
  snapshot,
  stopLeader,
} from "./send/surface";

const IDENTICAL =
  "  같은 문장을 두 번 시도합니다.\n데스크톱에서도 같은 문장을 씁니다.  ";
const CORRUPT = "가상 응답이 깨진 채 돌아오는 문장입니다.";
const LIMITED = "가상 대기열이 가득 찼을 때의 문장입니다.";
const LOST = "요청 도중 보내는 쪽이 사라지는 문장입니다.";

/** Every uncertain ending: identical texts, a corrupt success, 429, and a lost result. */
export const scenario: Scenario = {
  id: "send-unknown-identical",
  async run(context) {
    const { page, bridge, log, screenshot } = context;
    const { events, posts, room } = await mountSurface(context);
    const state = (uuid: string) =>
      snapshot(context).then((attempts) =>
        attempts.find((attempt) => attempt.uuid === uuid),
      );
    const ledgerEvent = (
      predicate: (attempts: readonly SendAttempt[]) => boolean,
      label: string,
    ) =>
      events.expect(
        (event) => event.attempts !== undefined && predicate(event.attempts),
        label,
      );
    try {
      // 1. Two identical attempts, each with its own consent and its own POST.
      const first = await preview(context, IDENTICAL);
      const firstSubmitted = ledgerEvent(
        (attempts) =>
          attempts.find((item) => item.uuid === first)?.state === "submitted",
        "first attempt submitted",
      );
      await page.locator('[data-ui="send-confirm"]').click();
      await firstSubmitted;
      const second = await preview(context, IDENTICAL);
      const secondSubmitted = ledgerEvent(
        (attempts) =>
          attempts.find((item) => item.uuid === second)?.state === "submitted",
        "second attempt submitted",
      );
      await page.locator('[data-ui="send-confirm"]').click();
      await secondSubmitted;
      assert(
        posts.length === 2,
        `Two explicit attempts sent ${posts.length} POSTs`,
      );
      assert(
        posts[0] === posts[1],
        "Identical attempts produced different request bodies",
      );
      assert(
        !/uuid|nonce|receipt|attempt/i.test(posts[0] ?? ""),
        "The request invented an identifier the contract does not carry",
      );

      // 2. A manually typed identical row is read back. It resolves nothing by itself.
      const rows = bridge.data.messages.get(room.id);
      const newest = rows?.at(-1);
      assert(rows && newest, "Missing synthetic baseline row");
      const manual = {
        ...newest,
        id: (BigInt(newest.id) + 1n).toString(),
        text: IDENTICAL,
        fromMe: true,
      };
      rows.push(manual);
      const applied = events.expect(
        (event) => event.type === "context",
        "manual row read back",
      );
      const candidates = await domBarrier(page, '[data-ui="pending-link"]');
      const inHistory = await domBarrier(
        page,
        `[data-message-id="${manual.id}"]`,
      );
      await page.locator('[data-ui="send-refresh"]').click();
      await Promise.all([applied, candidates.wait(), inHistory.wait()]);
      for (const uuid of [first, second]) {
        const attempt = await state(uuid);
        assert(
          attempt?.state === "submitted" && attempt.linkedMessageId === null,
          "An identical desktop message resolved a request on its own",
        );
        assert(
          attempt.candidates.length === 1 &&
            attempt.candidates[0] === manual.id,
          "The observed row was not offered as a candidate to both attempts",
        );
      }
      const ground = await page
        .locator('[data-ui="send-ground"]')
        .textContent();
      assert(
        ground?.includes("입력됨 · 전달 미확인") &&
          !ground.includes("보냈습니다"),
        "The ground claimed delivery for a request",
      );
      assert(
        (await page.locator('[data-ui="pending-link"]').count()) === 2,
        "Each unresolved attempt must carry its own explicit link control",
      );
      await screenshot("identical-unresolved-desktop");
      await page.setViewportSize({ width: 390, height: 844 });
      await screenshot("identical-unresolved-mobile");
      await page.setViewportSize({ width: 1440, height: 900 });

      // The user links one attempt. The other stays unresolved forever.
      const linked = ledgerEvent(
        (attempts) =>
          attempts.find((item) => item.uuid === first)?.linkedMessageId ===
          manual.id,
        "one explicit user link",
      );
      await page
        .locator(`[data-attempt-id="${first}"] [data-ui="pending-link"]`)
        .click();
      await linked;
      const survivor = await state(second);
      assert(
        survivor?.state === "submitted" && survivor.linkedMessageId === null,
        "Linking one attempt resolved the other",
      );
      assert(
        (await page.locator(`[data-attempt-id="${second}"]`).count()) === 1 &&
          (await page.locator(`[data-attempt-id="${first}"]`).count()) === 0,
        "The pending list did not reflect exactly one link",
      );
      assert(
        await page
          .locator(`[data-attempt-id="${second}"] [data-ui="pending-link"]`)
          .isDisabled(),
        "A second request could claim the already linked row",
      );
      assert(
        (await page.locator(`[data-message-id="${manual.id}"]`).count()) === 1,
        "Linking duplicated the observed row",
      );

      // 3. A corrupt success envelope is unknown, and unknown is never retried.
      const corrupt = await preview(context, CORRUPT);
      bridge.failNext("/send", "malformed");
      const unknown = await domBarrier(
        page,
        `[data-attempt-id="${corrupt}"][data-send-state="unknown"]`,
      );
      await page.locator('[data-ui="send-confirm"]').click();
      await unknown.wait();
      const afterCorrupt = posts.length;
      await repeat(context);
      assert(
        posts.length === afterCorrupt,
        "A corrupt success was retried by the client",
      );
      const unknownText = await page
        .locator(`[data-attempt-id="${corrupt}"]`)
        .textContent();
      assert(
        unknownText?.includes("결과 확인 필요") &&
          !unknownText.includes("보냈습니다"),
        "An unknown result was not stated as 결과 확인 필요",
      );
      await page
        .locator(
          `[data-attempt-id="${corrupt}"] [data-ui="pending-new-attempt"]`,
        )
        .click();
      assert(
        (await page.locator('[data-ui="send-consent"]').count()) === 0 &&
          posts.length === afterCorrupt,
        "The manual control sent again without a fresh dry run and consent",
      );

      // 4. 429 rejects the attempt; only a brand new explicit attempt may send.
      const limited = await preview(context, LIMITED);
      bridge.failNext("/send", 429);
      const rejected = await domBarrier(
        page,
        `[data-attempt-id="${limited}"][data-send-state="rejected"]`,
      );
      await page.locator('[data-ui="send-confirm"]').click();
      await rejected.wait();
      const afterLimit = posts.length;
      await repeat(context);
      assert(
        posts.length === afterLimit &&
          (await page.locator('[data-ui="send-confirm"]').count()) === 0,
        "A rate-limited attempt kept its consent or sent again by itself",
      );
      assert(
        (
          await page.locator(`[data-attempt-id="${limited}"]`).textContent()
        )?.includes("보내는 중인 메시지가 많습니다"),
        "The rate limit was not stated in the approved words",
      );
      const retried = await preview(context, LIMITED);
      const retriedSubmitted = ledgerEvent(
        (attempts) =>
          attempts.find((item) => item.uuid === retried)?.state === "submitted",
        "fresh explicit attempt after 429",
      );
      await page.locator('[data-ui="send-confirm"]').click();
      await retriedSubmitted;
      assert(
        posts.length === afterLimit + 1,
        "A fresh consent did not produce exactly one new POST",
      );

      // 5. The sender disappears while the POST is in flight: unknown, never re-sent.
      const lost = await preview(context, LOST);
      const release = bridge.pauseNext("/send");
      const dispatched = bridge.events.expect(
        (event) => event.type === "request" && event.path === "/send",
        "paused real POST",
      );
      const lostRow = await domBarrier(
        page,
        `[data-attempt-id="${lost}"][data-send-state="unknown"]`,
      );
      await page.locator('[data-ui="send-confirm"]').click();
      await dispatched;
      const afterLoss = posts.length;
      await stopLeader(context);
      release();
      await lostRow.wait();
      await repeat(context);
      assert(
        posts.length === afterLoss,
        "A lost result was re-sent on the user's behalf",
      );

      const metadata = await coordinationMetadata(context);
      assert(
        !JSON.stringify(metadata).includes("문장"),
        "Coordination metadata stored a message body",
      );
      assert(
        metadata.attempts.length === posts.length &&
          metadata.attempts.filter((item) => item.status === "unknown")
            .length === 2,
        "Metadata did not record one durable status per dispatched UUID",
      );
      await screenshot("uncertain-states-desktop");
      log("send-unknown-identical", {
        realPosts: posts.length,
        automaticRetries: 0,
        unresolvedIdenticalAttempts: 1,
        explicitLinks: 1,
      });
    } finally {
      await close(context);
    }
  },
};
