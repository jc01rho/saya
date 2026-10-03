import type {
  ExtensionResult,
  PirateTalkTransport,
} from "../../../transport/piratetalk";
import type { Load, Schema } from "./state";

export function loaded<T>(result: ExtensionResult<T>): Load<T> | null {
  switch (result.kind) {
    case "success":
      return { kind: "ready", value: result.data };
    case "failure":
      return { kind: "unavailable", detail: result.error.detail };
    case "cancelled":
      return null;
  }
}

export class PeopleClient {
  private sequence = 0;
  private controller: AbortController | null = null;

  constructor(private readonly transport: PirateTalkTransport) {}

  cancel(): void {
    this.sequence++;
    this.controller?.abort();
    this.controller = null;
  }

  async friends(
    request: Schema["FriendsRequest"],
    update: (state: Load<Schema["FriendsResponse"]>) => void,
  ): Promise<void> {
    const { signal, sequence } = this.begin();
    update({ kind: "loading" });
    const result = loaded(await this.transport.friends(request, signal));
    if (sequence === this.sequence && result) update(result);
  }

  async members(
    roomId: string,
    update: (state: Load<Schema["MembersResponse"]>) => void,
  ): Promise<void> {
    const { signal, sequence } = this.begin();
    update({ kind: "loading" });
    const result = loaded(await this.transport.members({ roomId }, signal));
    if (sequence === this.sequence && result) update(result);
  }

  async profile(
    userId: string,
    update: (state: Load<Schema["ProfileResponse"]>) => void,
  ): Promise<void> {
    const { signal, sequence } = this.begin();
    update({ kind: "loading" });
    const result = loaded(await this.transport.profile({ userId }, signal));
    if (sequence === this.sequence && result) update(result);
  }

  private begin(): { readonly sequence: number; readonly signal: AbortSignal } {
    this.cancel();
    this.controller = new AbortController();
    return { sequence: this.sequence, signal: this.controller.signal };
  }
}
