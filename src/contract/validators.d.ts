// Generated from openapi.json by bun run contract:generate. Do not edit.
import type { ValidateFunction } from "ajv";
import type { components, paths } from "./decoded";

export const validateErrorCode: ValidateFunction<components["schemas"]["ErrorCode"]>;
export const validateErrorEnvelope: ValidateFunction<components["schemas"]["ErrorEnvelope"]>;
export const validateRoom: ValidateFunction<components["schemas"]["Room"]>;
export const validateMention: ValidateFunction<components["schemas"]["Mention"]>;
export const validateReplySource: ValidateFunction<components["schemas"]["ReplySource"]>;
export const validateMessage: ValidateFunction<components["schemas"]["Message"]>;
export const validateAttention: ValidateFunction<components["schemas"]["Attention"]>;
export const validateCoverage: ValidateFunction<components["schemas"]["Coverage"]>;
export const validateContext: ValidateFunction<components["schemas"]["Context"]>;
export const validateDigestSlice: ValidateFunction<components["schemas"]["DigestSlice"]>;
export const validateDigest: ValidateFunction<components["schemas"]["Digest"]>;
export const validateSendRequest: ValidateFunction<components["schemas"]["SendRequest"]>;
export const validateSendResult: ValidateFunction<components["schemas"]["SendResult"]>;
export const validateStreamReady: ValidateFunction<components["schemas"]["StreamReady"]>;
export const validateStreamMessage: ValidateFunction<components["schemas"]["StreamMessage"]>;
export const validateStreamCursor: ValidateFunction<components["schemas"]["StreamCursor"]>;
export const validateStreamPing: ValidateFunction<components["schemas"]["StreamPing"]>;
export const validateCursor: ValidateFunction<components["schemas"]["Cursor"]>;
export const validateHealthResponse: ValidateFunction<paths["/health"]["get"]["responses"][200]["content"]["application/json"]>;
export const validateRoomsResponse: ValidateFunction<paths["/rooms"]["get"]["responses"][200]["content"]["application/json"]>;
