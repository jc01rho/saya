import { expect, test } from "bun:test";
import * as validators from "../../src/contract/validators.js";
import { bounded } from "../harness/barriers";
import { startBridge } from "./bridge";
import { FIRST_ROOM_ID, generateData } from "./data";

const request = (url: string, init?: RequestInit) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });

test("seed seven generates reproducible large decimal string ids and bounded datasets", () => {
  const first = generateData();
  expect(first).toEqual(generateData());
  expect(first.rooms).toHaveLength(100);
  expect(first.messages.get(FIRST_ROOM_ID)).toHaveLength(40);
  const stress = generateData("stress");
  expect(stress.rooms).toHaveLength(1000);
  expect(stress.messages.get(FIRST_ROOM_ID)).toHaveLength(1000);
  for (const room of stress.rooms) {
    expect(typeof room.id).toBe("string");
    expect(BigInt(room.id) > 2n ** 53n).toBe(true);
    for (const message of stress.messages.get(room.id) ?? []) {
      expect(typeof message.id).toBe("string");
      expect(BigInt(message.id) > 2n ** 53n).toBe(true);
      expect(validators.validateMessage(message)).toBe(true);
    }
  }
});

test("all JSON routes answer generated contract-valid data and send does not fabricate readback", async () => {
  const bridge = startBridge();
  try {
    for (const [path, validate] of [
      ["/health", validators.validateHealthResponse],
      ["/rooms", validators.validateRoomsResponse],
      [`/context?roomId=${FIRST_ROOM_ID}`, validators.validateContext],
      [`/digest?roomId=${FIRST_ROOM_ID}`, validators.validateDigest],
    ] as const) {
      const response = await request(bridge.url + path);
      expect(response.status).toBe(200);
      expect(validate(await response.json())).toBe(true);
    }
    for (const dryRun of [true, false]) {
      const response = await request(`${bridge.url}/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          room: FIRST_ROOM_ID,
          text: "Invented outgoing lantern.",
          dryRun,
        }),
      });
      const result = await response.json();
      expect(validators.validateSendResult(result)).toBe(true);
      expect(result.submitted).toBe(!dryRun);
    }
    expect(bridge.data.messages.get(FIRST_ROOM_ID)).toHaveLength(40);
    expect(
      (
        await request(
          `${bridge.url}/context?roomId=${FIRST_ROOM_ID}&limit=1001`,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await request(
          `${bridge.url}/digest?roomId=${FIRST_ROOM_ID}&span=invalid`,
        )
      ).status,
    ).toBe(400);
  } finally {
    await bridge.stop();
  }
});

test("on-demand errors, malformed envelopes, command acknowledgement and paused response", async () => {
  const bridge = startBridge();
  try {
    for (const status of [401, 429, 503] as const) {
      await bridge.command(() => bridge.failNext("/rooms", status));
      const response = await request(`${bridge.url}/rooms`);
      expect(response.status).toBe(status);
      const envelope = await response.json();
      expect(validators.validateErrorEnvelope(envelope)).toBe(true);
      if (status === 503) expect(envelope.error.code).toBe("BUSY");
    }
    bridge.failNext("/health", "malformed");
    expect(
      validators.validateHealthResponse(
        await (await request(`${bridge.url}/health`)).json(),
      ),
    ).toBe(false);
    const release = bridge.pauseNext("/rooms");
    const arrived = bridge.events.expect(
      (event) => event.type === "request" && event.path === "/rooms",
      "paused rooms request",
    );
    const replied = bridge.events.expect(
      (event) => event.type === "response" && event.path === "/rooms",
      "released rooms response",
    );
    let settled = false;
    const pending = request(`${bridge.url}/rooms`).then((response) => {
      settled = true;
      return response;
    });
    await arrived;
    expect(settled).toBe(false);
    release();
    await replied;
    expect((await pending).status).toBe(200);
    await expect(
      bridge.command(() => {
        throw new Error("Injected command failure");
      }),
    ).rejects.toThrow("Injected command failure");
    expect(bridge.events.pending).toBe(0);
  } finally {
    await bridge.stop();
  }
});

test("SSE preserves generated UTF-8 bytes under arbitrary fragmentation and closes at explicit end", async () => {
  const bridge = startBridge();
  try {
    const opened = bridge.events.expect(
      (event) => event.type === "stream-open",
      "stream open",
    );
    const response = await request(`${bridge.url}/stream`);
    await opened;
    const body = bounded(response.text(), "SSE end");
    const message = bridge.data.messages.get(FIRST_ROOM_ID)?.[0];
    if (!message) throw new Error("Missing synthetic message");
    await bridge.command(() => {
      bridge.emit("message", { ok: true, message }, [1, 2, 7, 3]);
      bridge.emit(
        "cursor",
        { ok: true, cursor: { [FIRST_ROOM_ID]: message.id } },
        [1],
      );
    });
    const closed = bridge.events.expect(
      (event) => event.type === "stream-close",
      "stream close",
    );
    bridge.endStreams();
    await closed;
    const frames = (await body)
      .trim()
      .split("\n\n")
      .map((frame) => {
        const [event, data] = frame.split("\n");
        return {
          name: event?.slice(7),
          payload: JSON.parse(data?.slice(6) ?? "null"),
        };
      });
    expect(frames.map((frame) => frame.name)).toEqual([
      "ready",
      "message",
      "cursor",
    ]);
    expect(frames[1]?.payload.message).toEqual(message);
    expect(bridge.activeStreams).toBe(0);
  } finally {
    await bridge.stop();
  }
});
