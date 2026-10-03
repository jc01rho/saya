import { expect } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Schema } from "../../src/features/piratetalk/state-people";
import {
  FriendsView,
  MembersView,
  ProfileView,
  safeResource,
} from "../../src/features/piratetalk/state-people";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "piratetalk-people",
  async run({ log }) {
    const coverage: Schema["Coverage"] = {
      source: "cache",
      complete: false,
      stale: true,
    };
    const person: Schema["Person"] = {
      userId: "42",
      name: "Synthetic person",
      roomId: "100",
      image: "https://untrusted.invalid/image",
    };
    const nav = { onRoom: (_id: string) => {}, onProfile: (_id: string) => {} };
    const friends = renderToStaticMarkup(
      createElement(FriendsView, {
        state: {
          kind: "ready",
          value: {
            items: [person],
            hasMore: false,
            nextCursor: null,
            coverage,
          },
        },
        section: "all",
        onSection: () => {},
        onMore: () => {},
        ...nav,
      }),
    );
    expect(friends).toContain('data-user-id="42"');
    expect(friends).not.toContain("untrusted.invalid");
    const unavailable = renderToStaticMarkup(
      createElement(MembersView, {
        state: { kind: "unavailable", detail: "source_unavailable" },
        ...nav,
      }),
    );
    expect(unavailable).toContain('role="status"');
    expect(unavailable).not.toContain("data-user-id=");
    const missing = renderToStaticMarkup(
      createElement(ProfileView, {
        state: { kind: "ready", value: { profile: null, coverage } },
        onRoom: nav.onRoom,
      }),
    );
    expect(missing).toContain('data-ui="piratetalk-profile"');
    expect(missing).not.toContain("<img");
    for (const resource of [
      "//outside.invalid/a",
      "/\\outside.invalid/a",
      "/%2foutside.invalid/a",
      "/../outside",
      "https://outside.invalid/a",
    ])
      expect(safeResource(resource)).toBeUndefined();
    expect(safeResource("/resources/avatar/42")).toBe(
      "/api/resources/avatar/42",
    );
    log("people-model", {
      externalImages: 0,
      unavailableExplicit: true,
      missingProfileSafe: true,
    });
  },
};
