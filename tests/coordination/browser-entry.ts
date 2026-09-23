import { Coordinator } from "../../src/coordination/coordinator";
import { browserPlatform } from "../../src/coordination/platform";

const platform = browserPlatform();
const counts = { applied: 0, hints: 0, responses: 0 };
const coordinator = new Coordinator({
  platform,
  apply(records) {
    counts.applied += records.length;
    publish();
  },
});
function publish() {
  const status = coordinator.status.getSnapshot();
  document.body.textContent = status.label;
  const notify = Reflect.get(window, "coordinationEvent") as
    | ((event: unknown) => void)
    | undefined;
  notify?.({ ...status, ...counts, nonce: coordinator.nonce });
}
coordinator.status.subscribe(publish);
Reflect.set(window, "coordination", { coordinator, counts, publish });
Reflect.set(window, "startCoordination", () => coordinator.start());
// Count actual deliveries, including hints that arrive while the application is paused.
const original = BroadcastChannel.prototype.postMessage;
BroadcastChannel.prototype.postMessage = function (message: unknown) {
  const notify = Reflect.get(window, "coordinationTraffic") as
    | ((event: unknown) => void)
    | undefined;
  notify?.({ channel: this.name, message });
  return original.call(this, message);
};
