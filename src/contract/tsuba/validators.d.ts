// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
import type { ValidateFunction } from "ajv";
import type { components, paths } from "./decoded";

export const validatePositiveInteger: ValidateFunction<components["schemas"]["PositiveInteger"]>;
export const validateErrorCode: ValidateFunction<components["schemas"]["ErrorCode"]>;
export const validateErrorEnvelope: ValidateFunction<components["schemas"]["ErrorEnvelope"]>;
export const validateHealth: ValidateFunction<components["schemas"]["Health"]>;
export const validateCapabilities: ValidateFunction<components["schemas"]["Capabilities"]>;
export const validateFeatures: ValidateFunction<components["schemas"]["Features"]>;
export const validateRoom: ValidateFunction<components["schemas"]["Room"]>;
export const validateRoomsAnswer: ValidateFunction<components["schemas"]["RoomsAnswer"]>;
export const validateMessage: ValidateFunction<components["schemas"]["Message"]>;
export const validateMessagesAnswer: ValidateFunction<components["schemas"]["MessagesAnswer"]>;
export const validateCursor: ValidateFunction<components["schemas"]["Cursor"]>;
export const validateStreamReady: ValidateFunction<components["schemas"]["StreamReady"]>;
export const validateStreamMessage: ValidateFunction<components["schemas"]["StreamMessage"]>;
export const validateStreamCursor: ValidateFunction<components["schemas"]["StreamCursor"]>;
export const validateStreamPing: ValidateFunction<components["schemas"]["StreamPing"]>;
export const validateSendRequest: ValidateFunction<components["schemas"]["SendRequest"]>;
export const validateSendAnswer: ValidateFunction<components["schemas"]["SendAnswer"]>;
