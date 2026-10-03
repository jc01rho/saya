import type {
  ExtensionResult,
  PirateTalkTransport,
} from "../../../transport/piratetalk";
import type { AuthoringActions, RichSend } from "./model";

function data<T>(result: ExtensionResult<T>): T {
  switch (result.kind) {
    case "success":
      return result.data;
    case "failure":
      throw new Error(result.error.detail);
    case "cancelled":
      throw new DOMException("Request cancelled", "AbortError");
  }
}

export function authoringActions(
  transport: PirateTalkTransport,
  submit: (request: RichSend) => Promise<void>,
  cancelUpload: (roomId: string, uploadId: string) => Promise<void>,
): AuthoringActions {
  return {
    async members(roomId, _cursor, signal) {
      return data(await transport.members({ roomId }, signal));
    },
    async thread(roomId, messageId, cursor, signal) {
      return data(
        await transport.thread(
          { roomId, messageId, limit: 50, ...(cursor ? { cursor } : {}) },
          signal,
        ),
      );
    },
    async stickers(cursor, signal) {
      return data(
        await transport.stickers(
          { limit: 50, ...(cursor ? { cursor } : {}) },
          signal,
        ),
      );
    },
    async upload(roomId, file, signal) {
      return data(await transport.upload(roomId, file, signal));
    },
    resourceUrl(resource) {
      if (
        !/^\/extensions\/piratetalk\/v1\/sticker-resource\?itemId=[1-9][0-9]*(?:%3A|:)[1-9][0-9]*$/u.test(
          resource,
        )
      )
        throw new Error("Invalid sticker resource");
      return `/api${resource}`;
    },
    cancelUpload,
    submit,
  };
}
