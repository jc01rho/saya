import { describe, expect, test } from "bun:test";
import type {
  AdapterConnection,
  AdapterIndexState,
  AdapterTabsState,
} from "../../src/app/adapterTabs";
import { nothingConnected } from "../../src/app/nothingConnected";
import { parseHash } from "../../src/app/routes";

function state(
  index: AdapterIndexState,
  connections: AdapterConnection[] = [],
): AdapterTabsState {
  return {
    index,
    tabs: connections.map((connection, i) => ({
      id: `synthetic-${i}`,
      name: `Synthetic ${i}`,
      unread: null,
      connection,
    })),
  };
}
const connected: AdapterConnection = {
  kind: "connected",
  capabilities: {
    ok: true,
    contract: { version: "0.2.4" },
    adapter: { name: "synthetic", version: "0.0.0" },
    provider: { id: "synthetic", name: "Synthetic" },
    account: { kind: "user" },
    revision: "0123456789abcdef",
    features: {},
  },
};

describe("nothing connected", () => {
  for (const core of ["failed", "unreachable", "over-capacity"] as const) {
    for (const index of ["unconfigured", "unreachable", "listed"] as const) {
      test(`${core} core and settled ${index} index`, () => {
        expect(nothingConnected(core, state(index))).toBe(true);
      });
    }
  }
  test("core loading and ready never count", () => {
    for (const core of ["loading", "ready"] as const)
      expect(nothingConnected(core, state("unconfigured"))).toBe(false);
  });
  test("index or any first adapter check still loading never counts", () => {
    expect(nothingConnected("failed", state("checking"))).toBe(false);
    expect(
      nothingConnected(
        "failed",
        state("listed", [{ kind: "unreachable" }, { kind: "checking" }]),
      ),
    ).toBe(false);
  });
  test("one connected adapter suppresses the screen", () => {
    expect(
      nothingConnected(
        "failed",
        state("listed", [{ kind: "unreachable" }, connected]),
      ),
    ).toBe(false);
  });
  test("every failure including authentication and incompatible versions counts", () => {
    expect(
      nothingConnected(
        "failed",
        state("listed", [
          { kind: "unreachable" },
          { kind: "protocol" },
          { kind: "refused", status: 401, code: "UNAUTHORIZED" },
          { kind: "refused", status: 403, code: "FORBIDDEN" },
          { kind: "incompatible", version: "0.3.0" },
        ]),
      ),
    ).toBe(true);
  });
});

test("default, unknown and malformed hashes land on all; Kakao stays explicit", () => {
  for (const hash of [
    "",
    "#",
    "#/unknown",
    "#/room/%",
    "#/list/%",
    "#/adapters/%/room",
  ])
    expect(parseHash(hash)).toEqual({ kind: "all" });
  expect(parseHash("#/all")).toEqual({ kind: "all" });
  expect(parseHash("#/rooms")).toEqual({ kind: "rooms" });
  expect(parseHash("#/room/18491246151592761")).toEqual({
    kind: "room",
    roomId: "18491246151592761",
  });
});
