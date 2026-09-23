import { expect, test } from "bun:test";
import { Coordinator } from "../../src/coordination/coordinator";
import type { Reply, Request } from "../../src/coordination/protocol";
import { REQUEST_CHANNEL } from "../../src/coordination/protocol";
import { bounded, deferred } from "../harness/barriers";
import { ManualClock, status, World } from "./fakes";

test("unsupported coordination never opens a stream", async () => {
  const coordinator = new Coordinator({ platform: undefined, apply() {} });
  await coordinator.start();
  expect(coordinator.status.getSnapshot().mode).toBe("manual-refresh");
  await coordinator.stop();
});

test("a denied Web Lock fails closed instead of hanging startup", async () => {
  const world = new World();
  const platform = world.platform();
  platform.locks = {
    async request() {
      throw new DOMException("Denied", "SecurityError");
    },
  };
  const coordinator = new Coordinator({ platform, apply() {} });
  await bounded(coordinator.start(), "denied lock startup", 1000);
  expect(coordinator.status.getSnapshot().mode).toBe("manual-refresh");
  expect(world.streams).toHaveLength(0);
  await coordinator.stop();
});

test("startup listener answers not-ready before the epoch commits", async () => {
  const world = new World();
  const entered = deferred<void>();
  const release = deferred<void>();
  const platform = world.platform();
  platform.metadata = async () => ({
    read: () => world.metadata.read(),
    close() {},
    async update(change) {
      entered.resolve();
      await release.promise;
      return world.metadata.update(change);
    },
  });
  const coordinator = new Coordinator({ platform, apply() {} });
  const ready = status(coordinator, "live");
  try {
    await coordinator.start();
    await entered.promise;
    const answered = world.traffic.expect(
      (event) =>
        event.channel === "saya:reply:observer" &&
        (event.data as Reply).kind === "not-ready",
      "startup not-ready",
    );
    const channel = world.channel(REQUEST_CHANNEL);
    channel.postMessage({
      kind: "register",
      version: 1,
      nonce: "observer",
      requestSeq: 1,
      epoch: 0,
      afterSeq: 0,
      creditBytes: 65536,
    } satisfies Request);
    channel.close();
    await answered;
    expect((await world.metadata.read()).epoch).toBe(0);
    release.resolve();
    await ready;
  } finally {
    release.resolve();
    await coordinator.stop();
  }
});

test("same-epoch response loss retries the identical sequence then enters manual refresh", async () => {
  const world = new World();
  const leader = new Coordinator({ platform: world.platform(), apply() {} });
  const ready = status(leader, "live");
  await leader.start();
  await ready;
  const clock = new ManualClock();
  const followerPlatform = world.platform(clock);
  followerPlatform.visible = () => false;
  const follower = new Coordinator({
    platform: followerPlatform,
    apply() {},
  });
  world.drop = (channel) => channel === `saya:reply:${follower.nonce}`;
  try {
    const first = world.traffic.expect(
      (event) => event.channel === `saya:reply:${follower.nonce}`,
      "lost registration response",
    );
    await follower.start();
    await first;
    expect(follower.status.getSnapshot().mode).toBe("waiting");
    clock.fire(1000);
    clock.fire(2000);
    const failed = status(follower, "manual-refresh");
    clock.fire(4000);
    await failed;
    const requests = world.log
      .filter(
        (event) =>
          event.channel === REQUEST_CHANNEL &&
          (event.data as Request).nonce === follower.nonce,
      )
      .map((event) => event.data as Request);
    expect(requests).toHaveLength(3);
    expect(new Set(requests.map((request) => request.requestSeq)).size).toBe(1);
    expect(new Set(requests.map((request) => request.kind))).toEqual(
      new Set(["register"]),
    );
    expect(
      (await world.metadata.read()).subscribers.find(
        (item) => item.nonce === follower.nonce,
      )?.credit,
    ).toBe(0);
  } finally {
    await follower.stop();
    await leader.stop();
  }
});

test("ready arriving during registration is applied, not discarded as a checkpoint", async () => {
  const world = new World();
  const platform = world.platform();
  const open = platform.openStream;
  platform.openStream = (request) => {
    request.onEvent({
      type: "ready",
      data: { ok: true, resumed: false, cursor: {} },
    });
    return open(request);
  };
  const types: string[] = [];
  const coordinator = new Coordinator({
    platform,
    apply(records) {
      types.push(...records.map((record) => record.event.type));
    },
  });
  const live = status(coordinator, "live");
  try {
    await coordinator.start();
    await live;
    expect(types).toContain("ready");
  } finally {
    await coordinator.stop();
  }
});

test("a follower grants no new credit until its batch has been applied", async () => {
  const world = new World();
  const leader = new Coordinator({ platform: world.platform(), apply() {} });
  const leaderReady = status(leader, "live");
  await leader.start();
  await leaderReady;
  const entered = deferred<void>();
  const release = deferred<void>();
  const follower = new Coordinator({
    platform: world.platform(),
    async apply(records) {
      if (records.length) {
        entered.resolve();
        await release.promise;
      }
    },
  });
  const followerReady = status(follower, "live");
  await follower.start();
  await followerReady;
  try {
    const stream = world.streams[0];
    if (!stream) throw new Error("Missing leader reader");
    stream.onEvent({ type: "ping", data: { ok: true } });
    await entered.promise;
    const requests = () =>
      world.log.filter(
        (entry) =>
          entry.channel === REQUEST_CHANNEL &&
          (entry.data as Request).nonce === follower.nonce,
      ).length;
    const count = requests();
    expect(
      (await world.metadata.read()).subscribers.find(
        (item) => item.nonce === follower.nonce,
      )?.credit,
    ).toBe(0);
    const leaderApplied = status(leader, "live");
    for (let i = 0; i < 100; i++)
      stream.onEvent({ type: "ping", data: { ok: true } });
    await leaderApplied;
    expect(requests()).toBe(count);
    const live = status(follower, "live");
    release.resolve();
    await live;
    expect(requests()).toBeGreaterThan(count);
    expect(
      (await world.metadata.read()).subscribers.find(
        (item) => item.nonce === follower.nonce,
      )?.credit,
    ).toBe(1);
  } finally {
    release.resolve();
    await follower.stop();
    await leader.stop();
  }
});

test("protocol mismatch requests reload instead of opening another reader", async () => {
  const world = new World();
  const leader = new Coordinator({ platform: world.platform(), apply() {} });
  const live = status(leader, "live");
  await leader.start();
  await live;
  try {
    const reply = world.traffic.expect(
      (entry) =>
        entry.channel === "saya:reply:newbuild" &&
        (entry.data as Reply).kind === "reload-required",
      "reload-required",
    );
    const channel = world.channel(REQUEST_CHANNEL);
    channel.postMessage({
      kind: "register",
      version: 2,
      nonce: "newbuild",
      requestSeq: 1,
      epoch: 1,
      afterSeq: 0,
      creditBytes: 65536,
    } satisfies Request);
    channel.close();
    await reply;
    expect(world.streams).toHaveLength(1);
  } finally {
    await leader.stop();
  }
});

test("clean handover cancels the old reader before the next lock holder opens", async () => {
  const world = new World();
  const first = new Coordinator({ platform: world.platform(), apply() {} });
  const second = new Coordinator({ platform: world.platform(), apply() {} });
  const firstReady = status(first, "live");
  await first.start();
  await firstReady;
  const secondReady = status(second, "live");
  await second.start();
  await secondReady;
  const opened = world.opened.expect(() => true, "replacement reader");
  await first.stop();
  await opened;
  expect(world.maximum).toBe(1);
  expect(world.streams).toHaveLength(2);
  expect(world.streams[0]?.signal.aborted).toBe(true);
  await second.stop();
  expect(world.active).toBe(0);
});
