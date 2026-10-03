import { expect, test } from "bun:test";
import { selectedPeriod } from "../src/features/piratetalk/model-assistance";

test("selected period preserves inclusive seconds and unbounded history", () => {
  expect(
    selectedPeriod("2023-11-14T22:13:20Z", "2023-11-14T22:13:20Z", false),
  ).toEqual({ from: 1700000000, to: 1700000000 });
  expect(selectedPeriod("", "2023-11-14T22:13:20Z", true)).toEqual({
    from: 0,
    to: 1700000000,
  });
  expect(
    selectedPeriod("2023-11-15T00:00:00Z", "2023-11-14T00:00:00Z", false),
  ).toBeNull();
  expect(selectedPeriod("", "", false)).toBeNull();
});
