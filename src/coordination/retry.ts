import type { ClockPort } from "./platform";
/** Only metadata register/pull requests use this policy; it accepts no send command. */
export class RetryRequest {
  private timer: unknown;
  private attempts = 0;
  constructor(
    private readonly clock: ClockPort,
    private readonly send: () => void,
    private readonly exhausted: () => void,
  ) {}
  start() {
    this.send();
    this.timer = this.clock.setTimeout(
      () => {
        if (this.attempts === 3) this.exhausted();
        else this.start();
      },
      1000 * 2 ** this.attempts++,
    );
  }
  cancel() {
    this.clock.clearTimeout(this.timer);
  }
}
