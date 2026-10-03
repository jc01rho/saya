import type { components } from "../../../contract/piratetalk/decoded";

export type AuthoringSchemas = components["schemas"];
export type RichSend = AuthoringSchemas["SendRequest"];
export type Mention = AuthoringSchemas["Mention"];
export type ReplyTarget = Readonly<{
  roomId: string;
  messageId: string;
  text: string;
}>;
export type TextDecoration = Readonly<{
  roomId: string;
  reply?: ReplyTarget;
  threadRoot?: string;
  mentions: readonly Mention[];
  mentionEveryone: boolean;
}>;

export function insertMention(
  text: string,
  start: number,
  end: number,
  person: AuthoringSchemas["Person"],
  mentions: readonly Mention[],
) {
  const name = person.name?.trim();
  const boundary = (offset: number) =>
    offset >= 0 &&
    offset <= text.length &&
    !(
      offset > 0 &&
      offset < text.length &&
      /[\uDC00-\uDFFF]/u.test(text[offset] ?? "")
    );
  if (
    !name ||
    name.includes("@") ||
    !boundary(start) ||
    !boundary(end) ||
    end < start
  )
    return null;
  const label = `@${name}`;
  const delta = label.length + 1 - (end - start);
  const preserved = mentions
    .filter(
      (mention) =>
        mention.start + mention.length <= start || mention.start >= end,
    )
    .map((mention) =>
      mention.start >= end
        ? { ...mention, start: mention.start + delta }
        : mention,
    );
  return {
    text: `${text.slice(0, start)}${label} ${text.slice(end)}`,
    caret: start + label.length + 1,
    mentions: [
      ...preserved,
      { userId: person.userId, start, length: label.length },
    ].sort((a, b) => a.start - b.start),
  };
}

export function editMentions(
  before: string,
  after: string,
  mentions: readonly Mention[],
): Mention[] {
  let prefix = 0;
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  )
    prefix++;
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - suffix - 1] === after[after.length - suffix - 1]
  )
    suffix++;
  const oldEnd = before.length - suffix;
  const delta = after.length - before.length;
  return mentions.flatMap((mention) => {
    if (mention.start + mention.length <= prefix) return [mention];
    if (mention.start >= oldEnd)
      return [{ ...mention, start: mention.start + delta }];
    return [];
  });
}

export function richTextRequest(
  roomId: string,
  text: string,
  decoration: TextDecoration,
): RichSend | null {
  if (
    roomId !== decoration.roomId ||
    (decoration.reply && decoration.reply.roomId !== roomId)
  )
    return null;
  return {
    roomId,
    kind: "text",
    text,
    ...(decoration.reply ? { replyTo: decoration.reply.messageId } : {}),
    ...(decoration.threadRoot ? { threadRoot: decoration.threadRoot } : {}),
    ...(decoration.mentions.length
      ? { mentions: [...decoration.mentions] }
      : {}),
    ...(decoration.mentionEveryone ? { mentionEveryone: true } : {}),
  };
}

export function hasDecoration(value: TextDecoration): boolean {
  return (
    !!value.reply ||
    !!value.threadRoot ||
    value.mentions.length > 0 ||
    value.mentionEveryone
  );
}

export interface AuthoringActions {
  members(
    roomId: string,
    cursor: string | undefined,
    signal: AbortSignal,
  ): Promise<AuthoringSchemas["MembersResponse"]>;
  thread(
    roomId: string,
    messageId: string,
    cursor: string | undefined,
    signal: AbortSignal,
  ): Promise<AuthoringSchemas["ThreadResponse"]>;
  stickers(
    cursor: string | undefined,
    signal: AbortSignal,
  ): Promise<AuthoringSchemas["StickersResponse"]>;
  upload(
    roomId: string,
    file: File,
    signal: AbortSignal,
  ): Promise<AuthoringSchemas["UploadResponse"]>;
  cancelUpload(roomId: string, uploadId: string): Promise<void>;
  resourceUrl(resource: string): string;
  submit(request: RichSend): Promise<void>;
}
