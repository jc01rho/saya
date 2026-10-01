// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
import type { components } from "./decoded";
import { validateStreamReady, validateStreamMessage, validateStreamCursor, validateStreamMessagesDeleted, validateStreamReactionsUpdated, validateStreamPing, validateErrorEnvelope } from "./validators.js";

export const sseEventSchemas = {
  "ready": "StreamReady",
  "message": "StreamMessage",
  "cursor": "StreamCursor",
  "message.edited": "StreamMessage",
  "message.deleted": "StreamMessagesDeleted",
  "reactions.updated": "StreamReactionsUpdated",
  "ping": "StreamPing",
  "error": "ErrorEnvelope"
} as const;

export type SseEventName = keyof typeof sseEventSchemas;
export type SsePayloads = { [Name in SseEventName]: components["schemas"][(typeof sseEventSchemas)[Name]] };

export const sseValidators = {
  "ready": validateStreamReady,
  "message": validateStreamMessage,
  "cursor": validateStreamCursor,
  "message.edited": validateStreamMessage,
  "message.deleted": validateStreamMessagesDeleted,
  "reactions.updated": validateStreamReactionsUpdated,
  "ping": validateStreamPing,
  "error": validateErrorEnvelope,
} as const;
