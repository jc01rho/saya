import { expect, test } from "bun:test";
import {
  COVERED_SETTING_KEY,
  CoveredMessagesState,
} from "../../src/features/covered/state";
import { memoryStorage } from "../theme/fakes";

test("covered messages default off, persist explicit changes, and notify subscribers", () => {
  const storage = memoryStorage();
  const state = new CoveredMessagesState(storage);
  expect(state.getSnapshot()).toBe(false);
  const changes: boolean[] = [];
  const stop = state.subscribe(() => changes.push(state.getSnapshot()));
  state.setEnabled(true);
  state.setEnabled(true);
  expect(storage.getItem(COVERED_SETTING_KEY)).toBe("on");
  expect(new CoveredMessagesState(storage).getSnapshot()).toBe(true);
  state.setEnabled(false);
  expect(new CoveredMessagesState(storage).getSnapshot()).toBe(false);
  expect(changes).toEqual([true, false]);
  stop();
  state.setEnabled(true);
  expect(changes).toEqual([true, false]);
});

test("another tab's withdrawal and storage removal update an open preference", () => {
  const storage = memoryStorage();
  const state = new CoveredMessagesState(storage);
  state.setEnabled(true);
  storage.setItem(COVERED_SETTING_KEY, "off");
  state.sync();
  expect(state.getSnapshot()).toBe(false);
  state.setEnabled(true);
  storage.items.clear();
  state.sync();
  expect(state.getSnapshot()).toBe(false);
});

test("missing, invalid, or blocked storage does not opt in", () => {
  const storage = memoryStorage();
  storage.setItem(COVERED_SETTING_KEY, "true");
  expect(new CoveredMessagesState(storage).getSnapshot()).toBe(false);
  expect(new CoveredMessagesState(null).getSnapshot()).toBe(false);
  const blocked = new CoveredMessagesState(memoryStorage(true));
  expect(blocked.getSnapshot()).toBe(false);
  blocked.setEnabled(true);
  expect(blocked.getSnapshot()).toBe(true);
});
