// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
import type { components } from "./decoded";
import { validateStreamReady, validateStreamMessage, validateStreamCursor, validateStreamPing, validateErrorEnvelope } from "./validators.js";

export const sseEventSchemas = {
  "ready": "StreamReady",
  "message": "StreamMessage",
  "cursor": "StreamCursor",
  "ping": "StreamPing",
  "error": "ErrorEnvelope"
} as const;

export type SseEventName = keyof typeof sseEventSchemas;
export type SsePayloads = { [Name in SseEventName]: components["schemas"][(typeof sseEventSchemas)[Name]] };

export const sseValidators = {
  "ready": validateStreamReady,
  "message": validateStreamMessage,
  "cursor": validateStreamCursor,
  "ping": validateStreamPing,
  "error": validateErrorEnvelope,
} as const;
