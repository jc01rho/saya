// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
import type { ValidateFunction } from "ajv";
import type { components, paths } from "./decoded";

export const validatePositiveInteger: ValidateFunction<components["schemas"]["PositiveInteger"]>;
export const validateErrorCode: ValidateFunction<components["schemas"]["ErrorCode"]>;
export const validateErrorEnvelope: ValidateFunction<components["schemas"]["ErrorEnvelope"]>;
export const validateHealth: ValidateFunction<components["schemas"]["Health"]>;
export const validateCapabilities: ValidateFunction<components["schemas"]["Capabilities"]>;
export const validateFeatures: ValidateFunction<components["schemas"]["Features"]>;
