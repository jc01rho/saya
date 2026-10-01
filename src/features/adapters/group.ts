import type { AdapterMessage } from "../../transport/adapters";

/** Only adjacent members in the loaded window belong to an album. */
export function groupMessages(
  messages: readonly AdapterMessage[],
): AdapterMessage[][] {
  const groups: AdapterMessage[][] = [];
  for (const message of messages) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    if (
      group &&
      previous &&
      message.groupId !== undefined &&
      previous.groupId === message.groupId &&
      message.kind !== "service" &&
      previous.kind !== "service" &&
      message.fromMe === previous.fromMe &&
      (message.senderId ?? message.sender) ===
        (previous.senderId ?? previous.sender)
    ) {
      group.push(message);
    } else groups.push([message]);
  }
  return groups;
}

/** The main door targets the first caption's member, otherwise the first.
 * Other members retain their own labelled doors and reaction targets. */
export function actionMember(
  members: readonly AdapterMessage[],
): AdapterMessage {
  // groupMessages produces nonempty groups; callers pass one of those groups.
  return (members.find((message) => message.text) ??
    members[0]) as AdapterMessage;
}
