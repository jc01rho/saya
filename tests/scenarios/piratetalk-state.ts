import { expect } from "bun:test";
import type { Mutation } from "../../src/features/piratetalk/state-people/state";
import {
  confirmedOwn,
  LocalReadState,
  localUnread,
  ReactionQueue,
} from "../../src/features/piratetalk/state-people/state";
import { bounded, deferred } from "../harness/barriers";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-state",
  async run({ log }) {
    const entered = deferred<void>();
    const release = deferred<Mutation>();
    const calls: boolean[] = [];
    const queue = new ReactionQueue(async (request) => {
      calls.push(request.selected);
      if (calls.length === 1) {
        entered.resolve();
        return release.promise;
      }
      return { outcome: "confirmed", messageId: request.messageId };
    });
    const request = {
      roomId: "100",
      messageId: "200",
      code: "1200509_021",
      selected: true,
    };
    const add = queue.run(request);
    await bounded(entered.promise, "first reaction entered");
    const remove = queue.run({ ...request, selected: false });
    expect(calls).toEqual([true]);
    release.resolve({ outcome: "confirmed", messageId: "200" });
    expect(
      confirmedOwn(false, request, await bounded(add, "add confirmed")),
    ).toBe(true);
    expect(
      confirmedOwn(
        true,
        { ...request, selected: false },
        await bounded(remove, "remove confirmed"),
      ),
    ).toBe(false);
    expect(calls).toEqual([true, false]);
    expect(
      confirmedOwn(false, request, {
        outcome: "unconfirmed",
        error: { code: "unconfirmed", detail: "synthetic" },
      }),
    ).toBe(false);
    expect(
      confirmedOwn(false, request, { outcome: "confirmed", messageId: "201" }),
    ).toBe(false);
    expect(
      localUnread("9007199254740993", [
        { id: "9007199254740993", fromMe: false },
        { id: "9007199254740994", fromMe: false },
        { id: "9007199254740994", fromMe: false },
        { id: "9007199254740995", fromMe: true },
      ]),
    ).toBe(1);
    const restored = new LocalReadState();
    restored.restore({
      roomId: "100",
      messageId: "200",
      throughMessageId: "202",
      unread: 2,
    });
    restored.observe("100", { id: "202", fromMe: false });
    restored.observe("100", { id: "203", fromMe: false });
    restored.observe("100", { id: "203", fromMe: false });
    expect(restored.unread("100")).toBe(3);
    restored.restore({
      roomId: "100",
      messageId: "200",
      throughMessageId: "203",
      unread: 3,
    });
    expect(restored.unread("100")).toBe(3);
    log("state-model", {
      ordered: calls,
      uncertainNotApplied: true,
      exactUnread: 1,
    });
  },
};
