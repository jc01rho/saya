import { exercise } from "../coordination/browser";
import type { Scenario } from "../harness/runner";
export const scenario: Scenario = {
  id: "leader-paused-follower",
  run: (context) => exercise(context, 5),
};
