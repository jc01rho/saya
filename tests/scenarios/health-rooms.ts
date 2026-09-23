import {
  validateHealthResponse,
  validateRoomsResponse,
} from "../../src/contract/validators.js";
import { responseBarrier } from "../harness/browser-barriers";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "health-rooms",
  async run({ page, bridge, url, log, screenshot }) {
    await page.goto(`${url}/#/rooms`, { waitUntil: "load" });

    const healthResponse = responseBarrier(page, "/api/health");
    const healthServed = bridge.events.expect(
      (event) => event.type === "response" && event.path === "/health",
      "fixture health response",
    );
    const health = await page.evaluate(async () =>
      (await fetch("/api/health")).json(),
    );
    await Promise.all([healthResponse, healthServed]);
    if (!validateHealthResponse(health))
      throw new Error("Health did not return a valid envelope");

    const roomsResponse = responseBarrier(page, "/api/rooms");
    const roomsServed = bridge.events.expect(
      (event) => event.type === "response" && event.path === "/rooms",
      "fixture rooms response",
    );
    const rooms = await page.evaluate(async () =>
      (await fetch("/api/rooms")).json(),
    );
    await Promise.all([roomsResponse, roomsServed]);
    if (!validateRoomsResponse(rooms))
      throw new Error("Rooms did not return a valid envelope");

    log("health-and-rooms-validated", { roomCount: rooms.rooms.length });
    await screenshot("health-rooms-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot("health-rooms-mobile");
  },
};
