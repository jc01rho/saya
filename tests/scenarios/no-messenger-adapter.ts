import { checkNoMessenger } from "../harness/noMessenger";
import type { Scenario } from "../harness/runner";

export const scenario: Scenario = {
  id: "no-messenger-adapter",
  run: (context) => checkNoMessenger(context, true),
};
