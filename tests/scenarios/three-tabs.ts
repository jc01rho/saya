import { exercise } from "../coordination/browser";
import type { Scenario } from "../harness/runner";
export const scenario: Scenario = {
  id: "three-tabs",
  run: (context) => exercise(context, 0),
};
