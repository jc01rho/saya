// Generated from contracts/piratetalk-extension.openapi.json by bun run extension:generate. Do not edit.
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
      length++;
      value = str.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319 && pos < len) {
        value = str.charCodeAt(pos);
        if ((value & 64512) === 56320)
          pos++;
      }
    }
    return length;
  }
  exports.default = ucs2length;
  ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
});

// contract:validators
var validateStoredStickerResourceRequest = validate52;
var pattern3 = new RegExp("^(?:-?(?:[1-9][0-9]{0,17}|[1-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6]|9223372036854775807)|-9223372036854775808)$", "u");
function validate53(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate53.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (typeof data === "string") {
      if (!pattern3.test(data)) {
        validate53.errors = [{ instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^(?:-?(?:[1-9][0-9]{0,17}|[1-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6]|9223372036854775807)|-9223372036854775808)$" }, message: 'must match pattern "' + "^(?:-?(?:[1-9][0-9]{0,17}|[1-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6]|9223372036854775807)|-9223372036854775808)$" + '"' }];
        return false;
      }
    } else {
      validate53.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
      return false;
    }
  }
  validate53.errors = vErrors;
  return errors === 0;
}
validate53.evaluated = { dynamicProps: false, dynamicItems: false };
var pattern4 = new RegExp("^(?:[1-9][0-9]{0,17}|[1-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6]|9223372036854775807)$", "u");
function validate55(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate55.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (typeof data === "string") {
      if (!pattern4.test(data)) {
        validate55.errors = [{ instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^(?:[1-9][0-9]{0,17}|[1-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6]|9223372036854775807)$" }, message: 'must match pattern "' + "^(?:[1-9][0-9]{0,17}|[1-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6]|9223372036854775807)$" + '"' }];
        return false;
      }
    } else {
      validate55.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
      return false;
    }
  }
  validate55.errors = vErrors;
  return errors === 0;
}
validate55.evaluated = { dynamicProps: false, dynamicItems: false };
function validate52(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate52.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.messageId === undefined && (missing0 = "messageId")) {
        validate52.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "messageId")) {
            validate52.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate52.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate52.errors = vErrors;
  return errors === 0;
}
validate52.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateId = validate55;
var validateRoomId = validate53;
var validateCursor = validate57;
var func1 = require_ucs2length().default;
var pattern5 = new RegExp("^[A-Za-z0-9_-]+$", "u");
function validate57(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate57.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (typeof data === "string") {
      if (func1(data) > 2048) {
        validate57.errors = [{ instancePath, schemaPath: "#/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" }];
        return false;
      } else {
        if (func1(data) < 1) {
          validate57.errors = [{ instancePath, schemaPath: "#/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
          return false;
        } else {
          if (!pattern5.test(data)) {
            validate57.errors = [{ instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]+$" }, message: 'must match pattern "' + "^[A-Za-z0-9_-]+$" + '"' }];
            return false;
          }
        }
      }
    } else {
      validate57.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
      return false;
    }
  }
  validate57.errors = vErrors;
  return errors === 0;
}
validate57.evaluated = { dynamicProps: false, dynamicItems: false };
var validateCoverage = validate58;
var schema23 = { type: "object", properties: { source: { type: "string", enum: ["live", "archive", "live+archive", "cache"] }, complete: { type: "boolean" }, stale: { type: "boolean" }, reason: { type: "string", minLength: 1 } }, required: ["source", "complete", "stale"], additionalProperties: false };
function validate58(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate58.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.source === undefined && (missing0 = "source") || data.complete === undefined && (missing0 = "complete") || data.stale === undefined && (missing0 = "stale")) {
        validate58.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "source" || key0 === "complete" || key0 === "stale" || key0 === "reason")) {
            validate58.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.source !== undefined) {
            let data0 = data.source;
            const _errs2 = errors;
            if (typeof data0 !== "string") {
              validate58.errors = [{ instancePath: instancePath + "/source", schemaPath: "#/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            if (!(data0 === "live" || data0 === "archive" || data0 === "live+archive" || data0 === "cache")) {
              validate58.errors = [{ instancePath: instancePath + "/source", schemaPath: "#/properties/source/enum", keyword: "enum", params: { allowedValues: schema23.properties.source.enum }, message: "must be equal to one of the allowed values" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.complete !== undefined) {
              const _errs4 = errors;
              if (typeof data.complete !== "boolean") {
                validate58.errors = [{ instancePath: instancePath + "/complete", schemaPath: "#/properties/complete/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.stale !== undefined) {
                const _errs6 = errors;
                if (typeof data.stale !== "boolean") {
                  validate58.errors = [{ instancePath: instancePath + "/stale", schemaPath: "#/properties/stale/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.reason !== undefined) {
                  let data3 = data.reason;
                  const _errs8 = errors;
                  if (errors === _errs8) {
                    if (typeof data3 === "string") {
                      if (func1(data3) < 1) {
                        validate58.errors = [{ instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                        return false;
                      }
                    } else {
                      validate58.errors = [{ instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate58.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate58.errors = vErrors;
  return errors === 0;
}
validate58.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateError = validate59;
var pattern6 = new RegExp("^[a-z][a-z0-9_]*$", "u");
function validate59(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate59.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.code === undefined && (missing0 = "code") || data.detail === undefined && (missing0 = "detail")) {
        validate59.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "code" || key0 === "detail")) {
            validate59.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.code !== undefined) {
            let data0 = data.code;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func1(data0) < 1) {
                  validate59.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                } else {
                  if (!pattern6.test(data0)) {
                    validate59.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9_]*$" }, message: 'must match pattern "' + "^[a-z][a-z0-9_]*$" + '"' }];
                    return false;
                  }
                }
              } else {
                validate59.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.detail !== undefined) {
              let data1 = data.detail;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === "string") {
                  if (func1(data1) < 1) {
                    validate59.errors = [{ instancePath: instancePath + "/detail", schemaPath: "#/properties/detail/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate59.errors = [{ instancePath: instancePath + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate59.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate59.errors = vErrors;
  return errors === 0;
}
validate59.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateErrorResponse = validate60;
function validate60(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate60.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.error === undefined && (missing0 = "error")) {
        validate60.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "ok" || key0 === "error")) {
            validate60.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.ok !== undefined) {
            const _errs2 = errors;
            if (data.ok !== false) {
              validate60.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.error !== undefined) {
              const _errs3 = errors;
              if (!validate59(data.error, { instancePath: instancePath + "/error", parentData: data, parentDataProperty: "error", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate60.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate60.errors = vErrors;
  return errors === 0;
}
validate60.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateFeature = validate62;
function validate62(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate62.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.available === undefined && (missing0 = "available")) {
        validate62.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "available" || key0 === "reason")) {
            validate62.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.available !== undefined) {
            const _errs2 = errors;
            if (typeof data.available !== "boolean") {
              validate62.errors = [{ instancePath: instancePath + "/available", schemaPath: "#/properties/available/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.reason !== undefined) {
              let data1 = data.reason;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === "string") {
                  if (func1(data1) < 1) {
                    validate62.errors = [{ instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate62.errors = [{ instancePath: instancePath + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate62.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate62.errors = vErrors;
  return errors === 0;
}
validate62.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateCapabilitiesRequest = validate63;
function validate63(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate63.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      for (const key0 in data) {
        validate63.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
        return false;
        break;
      }
    } else {
      validate63.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate63.errors = vErrors;
  return errors === 0;
}
validate63.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateCapabilitiesResponse = validate64;
var schema28 = { type: "object", properties: { version: { const: "1.0.0" }, features: { type: "object", properties: { reply: { $ref: "#/components/schemas/Feature" }, thread: { $ref: "#/components/schemas/Feature" }, mentions: { $ref: "#/components/schemas/Feature" }, media: { $ref: "#/components/schemas/Feature" }, stickers: { $ref: "#/components/schemas/Feature" }, storedStickers: { $ref: "#/components/schemas/Feature" }, reactions: { $ref: "#/components/schemas/Feature" }, history: { $ref: "#/components/schemas/Feature" }, search: { $ref: "#/components/schemas/Feature" }, readLocal: { $ref: "#/components/schemas/Feature" }, people: { $ref: "#/components/schemas/Feature" }, summary: { $ref: "#/components/schemas/Feature" }, question: { $ref: "#/components/schemas/Feature" } }, required: ["reply", "thread", "mentions", "media", "stickers", "reactions", "history", "search", "readLocal", "people", "summary", "question"], additionalProperties: false }, models: { type: "array", items: { type: "string", minLength: 1 } }, uploadPolicy: { type: "object", properties: { maxBytes: { type: "null" }, maxFiles: { const: 1 }, kinds: { type: "array", items: { type: "string", enum: ["photo", "video", "file"] } } }, required: ["maxBytes", "maxFiles", "kinds"], additionalProperties: false } }, required: ["version", "features", "models", "uploadPolicy"], additionalProperties: false };
var func7 = Object.prototype.hasOwnProperty;
function validate64(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate64.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.version === undefined && (missing0 = "version") || data.features === undefined && (missing0 = "features") || data.models === undefined && (missing0 = "models") || data.uploadPolicy === undefined && (missing0 = "uploadPolicy")) {
        validate64.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "version" || key0 === "features" || key0 === "models" || key0 === "uploadPolicy")) {
            validate64.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.version !== undefined) {
            const _errs2 = errors;
            if (data.version !== "1.0.0") {
              validate64.errors = [{ instancePath: instancePath + "/version", schemaPath: "#/properties/version/const", keyword: "const", params: { allowedValue: "1.0.0" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.features !== undefined) {
              let data1 = data.features;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                  let missing1;
                  if (data1.reply === undefined && (missing1 = "reply") || data1.thread === undefined && (missing1 = "thread") || data1.mentions === undefined && (missing1 = "mentions") || data1.media === undefined && (missing1 = "media") || data1.stickers === undefined && (missing1 = "stickers") || data1.reactions === undefined && (missing1 = "reactions") || data1.history === undefined && (missing1 = "history") || data1.search === undefined && (missing1 = "search") || data1.readLocal === undefined && (missing1 = "readLocal") || data1.people === undefined && (missing1 = "people") || data1.summary === undefined && (missing1 = "summary") || data1.question === undefined && (missing1 = "question")) {
                    validate64.errors = [{ instancePath: instancePath + "/features", schemaPath: "#/properties/features/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                    return false;
                  } else {
                    const _errs5 = errors;
                    for (const key1 in data1) {
                      if (!func7.call(schema28.properties.features.properties, key1)) {
                        validate64.errors = [{ instancePath: instancePath + "/features", schemaPath: "#/properties/features/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" }];
                        return false;
                        break;
                      }
                    }
                    if (_errs5 === errors) {
                      if (data1.reply !== undefined) {
                        const _errs6 = errors;
                        if (!validate62(data1.reply, { instancePath: instancePath + "/features/reply", parentData: data1, parentDataProperty: "reply", rootData, dynamicAnchors })) {
                          vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                          errors = vErrors.length;
                        }
                        var valid1 = _errs6 === errors;
                      } else {
                        var valid1 = true;
                      }
                      if (valid1) {
                        if (data1.thread !== undefined) {
                          const _errs7 = errors;
                          if (!validate62(data1.thread, { instancePath: instancePath + "/features/thread", parentData: data1, parentDataProperty: "thread", rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                            errors = vErrors.length;
                          }
                          var valid1 = _errs7 === errors;
                        } else {
                          var valid1 = true;
                        }
                        if (valid1) {
                          if (data1.mentions !== undefined) {
                            const _errs8 = errors;
                            if (!validate62(data1.mentions, { instancePath: instancePath + "/features/mentions", parentData: data1, parentDataProperty: "mentions", rootData, dynamicAnchors })) {
                              vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                              errors = vErrors.length;
                            }
                            var valid1 = _errs8 === errors;
                          } else {
                            var valid1 = true;
                          }
                          if (valid1) {
                            if (data1.media !== undefined) {
                              const _errs9 = errors;
                              if (!validate62(data1.media, { instancePath: instancePath + "/features/media", parentData: data1, parentDataProperty: "media", rootData, dynamicAnchors })) {
                                vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                errors = vErrors.length;
                              }
                              var valid1 = _errs9 === errors;
                            } else {
                              var valid1 = true;
                            }
                            if (valid1) {
                              if (data1.stickers !== undefined) {
                                const _errs10 = errors;
                                if (!validate62(data1.stickers, { instancePath: instancePath + "/features/stickers", parentData: data1, parentDataProperty: "stickers", rootData, dynamicAnchors })) {
                                  vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                  errors = vErrors.length;
                                }
                                var valid1 = _errs10 === errors;
                              } else {
                                var valid1 = true;
                              }
                              if (valid1) {
                                if (data1.storedStickers !== undefined) {
                                  const _errs11 = errors;
                                  if (!validate62(data1.storedStickers, { instancePath: instancePath + "/features/storedStickers", parentData: data1, parentDataProperty: "storedStickers", rootData, dynamicAnchors })) {
                                    vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid1 = _errs11 === errors;
                                } else {
                                  var valid1 = true;
                                }
                                if (valid1) {
                                  if (data1.reactions !== undefined) {
                                    const _errs12 = errors;
                                    if (!validate62(data1.reactions, { instancePath: instancePath + "/features/reactions", parentData: data1, parentDataProperty: "reactions", rootData, dynamicAnchors })) {
                                      vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                      errors = vErrors.length;
                                    }
                                    var valid1 = _errs12 === errors;
                                  } else {
                                    var valid1 = true;
                                  }
                                  if (valid1) {
                                    if (data1.history !== undefined) {
                                      const _errs13 = errors;
                                      if (!validate62(data1.history, { instancePath: instancePath + "/features/history", parentData: data1, parentDataProperty: "history", rootData, dynamicAnchors })) {
                                        vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                        errors = vErrors.length;
                                      }
                                      var valid1 = _errs13 === errors;
                                    } else {
                                      var valid1 = true;
                                    }
                                    if (valid1) {
                                      if (data1.search !== undefined) {
                                        const _errs14 = errors;
                                        if (!validate62(data1.search, { instancePath: instancePath + "/features/search", parentData: data1, parentDataProperty: "search", rootData, dynamicAnchors })) {
                                          vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                          errors = vErrors.length;
                                        }
                                        var valid1 = _errs14 === errors;
                                      } else {
                                        var valid1 = true;
                                      }
                                      if (valid1) {
                                        if (data1.readLocal !== undefined) {
                                          const _errs15 = errors;
                                          if (!validate62(data1.readLocal, { instancePath: instancePath + "/features/readLocal", parentData: data1, parentDataProperty: "readLocal", rootData, dynamicAnchors })) {
                                            vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                            errors = vErrors.length;
                                          }
                                          var valid1 = _errs15 === errors;
                                        } else {
                                          var valid1 = true;
                                        }
                                        if (valid1) {
                                          if (data1.people !== undefined) {
                                            const _errs16 = errors;
                                            if (!validate62(data1.people, { instancePath: instancePath + "/features/people", parentData: data1, parentDataProperty: "people", rootData, dynamicAnchors })) {
                                              vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                              errors = vErrors.length;
                                            }
                                            var valid1 = _errs16 === errors;
                                          } else {
                                            var valid1 = true;
                                          }
                                          if (valid1) {
                                            if (data1.summary !== undefined) {
                                              const _errs17 = errors;
                                              if (!validate62(data1.summary, { instancePath: instancePath + "/features/summary", parentData: data1, parentDataProperty: "summary", rootData, dynamicAnchors })) {
                                                vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                                errors = vErrors.length;
                                              }
                                              var valid1 = _errs17 === errors;
                                            } else {
                                              var valid1 = true;
                                            }
                                            if (valid1) {
                                              if (data1.question !== undefined) {
                                                const _errs18 = errors;
                                                if (!validate62(data1.question, { instancePath: instancePath + "/features/question", parentData: data1, parentDataProperty: "question", rootData, dynamicAnchors })) {
                                                  vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                                  errors = vErrors.length;
                                                }
                                                var valid1 = _errs18 === errors;
                                              } else {
                                                var valid1 = true;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                } else {
                  validate64.errors = [{ instancePath: instancePath + "/features", schemaPath: "#/properties/features/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.models !== undefined) {
                let data15 = data.models;
                const _errs19 = errors;
                if (errors === _errs19) {
                  if (Array.isArray(data15)) {
                    var valid2 = true;
                    const len0 = data15.length;
                    for (let i0 = 0;i0 < len0; i0++) {
                      let data16 = data15[i0];
                      const _errs21 = errors;
                      if (errors === _errs21) {
                        if (typeof data16 === "string") {
                          if (func1(data16) < 1) {
                            validate64.errors = [{ instancePath: instancePath + "/models/" + i0, schemaPath: "#/properties/models/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                            return false;
                          }
                        } else {
                          validate64.errors = [{ instancePath: instancePath + "/models/" + i0, schemaPath: "#/properties/models/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                      }
                      var valid2 = _errs21 === errors;
                      if (!valid2) {
                        break;
                      }
                    }
                  } else {
                    validate64.errors = [{ instancePath: instancePath + "/models", schemaPath: "#/properties/models/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs19 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.uploadPolicy !== undefined) {
                  let data17 = data.uploadPolicy;
                  const _errs23 = errors;
                  if (errors === _errs23) {
                    if (data17 && typeof data17 == "object" && !Array.isArray(data17)) {
                      let missing2;
                      if (data17.maxBytes === undefined && (missing2 = "maxBytes") || data17.maxFiles === undefined && (missing2 = "maxFiles") || data17.kinds === undefined && (missing2 = "kinds")) {
                        validate64.errors = [{ instancePath: instancePath + "/uploadPolicy", schemaPath: "#/properties/uploadPolicy/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                        return false;
                      } else {
                        const _errs25 = errors;
                        for (const key2 in data17) {
                          if (!(key2 === "maxBytes" || key2 === "maxFiles" || key2 === "kinds")) {
                            validate64.errors = [{ instancePath: instancePath + "/uploadPolicy", schemaPath: "#/properties/uploadPolicy/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" }];
                            return false;
                            break;
                          }
                        }
                        if (_errs25 === errors) {
                          if (data17.maxBytes !== undefined) {
                            const _errs26 = errors;
                            if (data17.maxBytes !== null) {
                              validate64.errors = [{ instancePath: instancePath + "/uploadPolicy/maxBytes", schemaPath: "#/properties/uploadPolicy/properties/maxBytes/type", keyword: "type", params: { type: "null" }, message: "must be null" }];
                              return false;
                            }
                            var valid3 = _errs26 === errors;
                          } else {
                            var valid3 = true;
                          }
                          if (valid3) {
                            if (data17.maxFiles !== undefined) {
                              const _errs28 = errors;
                              if (data17.maxFiles !== 1) {
                                validate64.errors = [{ instancePath: instancePath + "/uploadPolicy/maxFiles", schemaPath: "#/properties/uploadPolicy/properties/maxFiles/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" }];
                                return false;
                              }
                              var valid3 = _errs28 === errors;
                            } else {
                              var valid3 = true;
                            }
                            if (valid3) {
                              if (data17.kinds !== undefined) {
                                let data20 = data17.kinds;
                                const _errs29 = errors;
                                if (errors === _errs29) {
                                  if (Array.isArray(data20)) {
                                    var valid4 = true;
                                    const len1 = data20.length;
                                    for (let i1 = 0;i1 < len1; i1++) {
                                      let data21 = data20[i1];
                                      const _errs31 = errors;
                                      if (typeof data21 !== "string") {
                                        validate64.errors = [{ instancePath: instancePath + "/uploadPolicy/kinds/" + i1, schemaPath: "#/properties/uploadPolicy/properties/kinds/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                      if (!(data21 === "photo" || data21 === "video" || data21 === "file")) {
                                        validate64.errors = [{ instancePath: instancePath + "/uploadPolicy/kinds/" + i1, schemaPath: "#/properties/uploadPolicy/properties/kinds/items/enum", keyword: "enum", params: { allowedValues: schema28.properties.uploadPolicy.properties.kinds.items.enum }, message: "must be equal to one of the allowed values" }];
                                        return false;
                                      }
                                      var valid4 = _errs31 === errors;
                                      if (!valid4) {
                                        break;
                                      }
                                    }
                                  } else {
                                    validate64.errors = [{ instancePath: instancePath + "/uploadPolicy/kinds", schemaPath: "#/properties/uploadPolicy/properties/kinds/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                    return false;
                                  }
                                }
                                var valid3 = _errs29 === errors;
                              } else {
                                var valid3 = true;
                              }
                            }
                          }
                        }
                      }
                    } else {
                      validate64.errors = [{ instancePath: instancePath + "/uploadPolicy", schemaPath: "#/properties/uploadPolicy/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid0 = _errs23 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate64.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate64.errors = vErrors;
  return errors === 0;
}
validate64.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateMention = validate78;
function validate78(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate78.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.userId === undefined && (missing0 = "userId") || data.start === undefined && (missing0 = "start") || data.length === undefined && (missing0 = "length")) {
        validate78.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "userId" || key0 === "start" || key0 === "length")) {
            validate78.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.userId !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.userId, { instancePath: instancePath + "/userId", parentData: data, parentDataProperty: "userId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.start !== undefined) {
              let data1 = data.start;
              const _errs3 = errors;
              if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
                validate78.errors = [{ instancePath: instancePath + "/start", schemaPath: "#/properties/start/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                return false;
              }
              if (errors === _errs3) {
                if (typeof data1 == "number" && isFinite(data1)) {
                  if (data1 > 9007199254740991 || isNaN(data1)) {
                    validate78.errors = [{ instancePath: instancePath + "/start", schemaPath: "#/properties/start/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                    return false;
                  } else {
                    if (data1 < 0 || isNaN(data1)) {
                      validate78.errors = [{ instancePath: instancePath + "/start", schemaPath: "#/properties/start/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                      return false;
                    }
                  }
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.length !== undefined) {
                let data2 = data.length;
                const _errs5 = errors;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  validate78.errors = [{ instancePath: instancePath + "/length", schemaPath: "#/properties/length/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs5) {
                  if (typeof data2 == "number" && isFinite(data2)) {
                    if (data2 > 9007199254740991 || isNaN(data2)) {
                      validate78.errors = [{ instancePath: instancePath + "/length", schemaPath: "#/properties/length/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                      return false;
                    } else {
                      if (data2 < 1 || isNaN(data2)) {
                        validate78.errors = [{ instancePath: instancePath + "/length", schemaPath: "#/properties/length/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                        return false;
                      }
                    }
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate78.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate78.errors = vErrors;
  return errors === 0;
}
validate78.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateTextSend = validate80;
var pattern7 = new RegExp("\\S", "u");
function validate80(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate80.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.kind === undefined && (missing0 = "kind") || data.text === undefined && (missing0 = "text")) {
        validate80.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "kind" || key0 === "text" || key0 === "replyTo" || key0 === "threadRoot" || key0 === "mentions" || key0 === "mentionEveryone")) {
            validate80.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.kind !== undefined) {
              const _errs3 = errors;
              if (data.kind !== "text") {
                validate80.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "text" }, message: "must be equal to constant" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.text !== undefined) {
                let data2 = data.text;
                const _errs4 = errors;
                if (errors === _errs4) {
                  if (typeof data2 === "string") {
                    if (func1(data2) < 1) {
                      validate80.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                      return false;
                    } else {
                      if (!pattern7.test(data2)) {
                        validate80.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "' + "\\S" + '"' }];
                        return false;
                      }
                    }
                  } else {
                    validate80.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.replyTo !== undefined) {
                  const _errs6 = errors;
                  if (!validate55(data.replyTo, { instancePath: instancePath + "/replyTo", parentData: data, parentDataProperty: "replyTo", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.threadRoot !== undefined) {
                    const _errs7 = errors;
                    if (!validate55(data.threadRoot, { instancePath: instancePath + "/threadRoot", parentData: data, parentDataProperty: "threadRoot", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.mentions !== undefined) {
                      let data5 = data.mentions;
                      const _errs8 = errors;
                      if (errors === _errs8) {
                        if (Array.isArray(data5)) {
                          var valid1 = true;
                          const len0 = data5.length;
                          for (let i0 = 0;i0 < len0; i0++) {
                            const _errs10 = errors;
                            if (!validate78(data5[i0], { instancePath: instancePath + "/mentions/" + i0, parentData: data5, parentDataProperty: i0, rootData, dynamicAnchors })) {
                              vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
                              errors = vErrors.length;
                            }
                            var valid1 = _errs10 === errors;
                            if (!valid1) {
                              break;
                            }
                          }
                        } else {
                          validate80.errors = [{ instancePath: instancePath + "/mentions", schemaPath: "#/properties/mentions/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs8 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.mentionEveryone !== undefined) {
                        const _errs11 = errors;
                        if (typeof data.mentionEveryone !== "boolean") {
                          validate80.errors = [{ instancePath: instancePath + "/mentionEveryone", schemaPath: "#/properties/mentionEveryone/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                          return false;
                        }
                        var valid0 = _errs11 === errors;
                      } else {
                        var valid0 = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate80.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate80.errors = vErrors;
  return errors === 0;
}
validate80.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateMediaSend = validate85;
var pattern8 = new RegExp("^[A-Za-z0-9_-]{16,128}$", "u");
function validate85(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate85.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.kind === undefined && (missing0 = "kind") || data.uploadId === undefined && (missing0 = "uploadId")) {
        validate85.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "kind" || key0 === "uploadId")) {
            validate85.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.kind !== undefined) {
              const _errs3 = errors;
              if (data.kind !== "media") {
                validate85.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "media" }, message: "must be equal to constant" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.uploadId !== undefined) {
                let data2 = data.uploadId;
                const _errs4 = errors;
                if (errors === _errs4) {
                  if (typeof data2 === "string") {
                    if (func1(data2) < 1) {
                      validate85.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                      return false;
                    } else {
                      if (!pattern8.test(data2)) {
                        validate85.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]{16,128}$" }, message: 'must match pattern "' + "^[A-Za-z0-9_-]{16,128}$" + '"' }];
                        return false;
                      }
                    }
                  } else {
                    validate85.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate85.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate85.errors = vErrors;
  return errors === 0;
}
validate85.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStickerId = validate87;
var pattern9 = new RegExp("^[1-9][0-9]*:[1-9][0-9]*$", "u");
function validate87(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate87.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (typeof data === "string") {
      if (func1(data) < 1) {
        validate87.errors = [{ instancePath, schemaPath: "#/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
        return false;
      } else {
        if (!pattern9.test(data)) {
          validate87.errors = [{ instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*:[1-9][0-9]*$" }, message: 'must match pattern "' + "^[1-9][0-9]*:[1-9][0-9]*$" + '"' }];
          return false;
        }
      }
    } else {
      validate87.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
      return false;
    }
  }
  validate87.errors = vErrors;
  return errors === 0;
}
validate87.evaluated = { dynamicProps: false, dynamicItems: false };
var validateStickerSend = validate88;
function validate88(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate88.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.kind === undefined && (missing0 = "kind") || data.itemId === undefined && (missing0 = "itemId")) {
        validate88.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "kind" || key0 === "itemId")) {
            validate88.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.kind !== undefined) {
              const _errs3 = errors;
              if (data.kind !== "sticker") {
                validate88.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "sticker" }, message: "must be equal to constant" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.itemId !== undefined) {
                const _errs4 = errors;
                if (!validate87(data.itemId, { instancePath: instancePath + "/itemId", parentData: data, parentDataProperty: "itemId", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate88.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate88.errors = vErrors;
  return errors === 0;
}
validate88.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSendRequest = validate91;
function validate91(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate91.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (!validate80(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs2 = errors;
  if (!validate85(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate85.errors : vErrors.concat(validate85.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
    const _errs3 = errors;
    if (!validate88(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
      vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
      errors = vErrors.length;
    }
    var _valid0 = _errs3 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
        if (props0 !== true) {
          props0 = true;
        }
      }
    }
  }
  if (!valid0) {
    const err0 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
    validate91.errors = vErrors;
    return false;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate91.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate91.evaluated = { dynamicProps: true, dynamicItems: false };
var validateConfirmed = validate95;
function validate95(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate95.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.outcome === undefined && (missing0 = "outcome") || data.messageId === undefined && (missing0 = "messageId")) {
        validate95.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "outcome" || key0 === "messageId")) {
            validate95.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.outcome !== undefined) {
            const _errs2 = errors;
            if (data.outcome !== "confirmed") {
              validate95.errors = [{ instancePath: instancePath + "/outcome", schemaPath: "#/properties/outcome/const", keyword: "const", params: { allowedValue: "confirmed" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate95.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate95.errors = vErrors;
  return errors === 0;
}
validate95.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateUnconfirmed = validate97;
function validate97(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate97.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.outcome === undefined && (missing0 = "outcome") || data.error === undefined && (missing0 = "error")) {
        validate97.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "outcome" || key0 === "messageId" || key0 === "error")) {
            validate97.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.outcome !== undefined) {
            const _errs2 = errors;
            if (data.outcome !== "unconfirmed") {
              validate97.errors = [{ instancePath: instancePath + "/outcome", schemaPath: "#/properties/outcome/const", keyword: "const", params: { allowedValue: "unconfirmed" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.error !== undefined) {
                const _errs4 = errors;
                if (!validate59(data.error, { instancePath: instancePath + "/error", parentData: data, parentDataProperty: "error", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate97.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate97.errors = vErrors;
  return errors === 0;
}
validate97.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateRejected = validate100;
function validate100(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate100.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.outcome === undefined && (missing0 = "outcome") || data.error === undefined && (missing0 = "error")) {
        validate100.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "outcome" || key0 === "error")) {
            validate100.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.outcome !== undefined) {
            const _errs2 = errors;
            if (data.outcome !== "rejected") {
              validate100.errors = [{ instancePath: instancePath + "/outcome", schemaPath: "#/properties/outcome/const", keyword: "const", params: { allowedValue: "rejected" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.error !== undefined) {
              const _errs3 = errors;
              if (!validate59(data.error, { instancePath: instancePath + "/error", parentData: data, parentDataProperty: "error", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate100.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate100.errors = vErrors;
  return errors === 0;
}
validate100.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateMutationResponse = validate102;
function validate102(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate102.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (!validate95(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate95.errors : vErrors.concat(validate95.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs2 = errors;
  if (!validate97(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
    vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
    const _errs3 = errors;
    if (!validate100(data, { instancePath, parentData, parentDataProperty, rootData, dynamicAnchors })) {
      vErrors = vErrors === null ? validate100.errors : vErrors.concat(validate100.errors);
      errors = vErrors.length;
    }
    var _valid0 = _errs3 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
        if (props0 !== true) {
          props0 = true;
        }
      }
    }
  }
  if (!valid0) {
    const err0 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
    validate102.errors = vErrors;
    return false;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate102.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate102.evaluated = { dynamicProps: true, dynamicItems: false };
var validateReactionRequest = validate106;
function validate106(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate106.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.messageId === undefined && (missing0 = "messageId") || data.code === undefined && (missing0 = "code") || data.selected === undefined && (missing0 = "selected")) {
        validate106.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "messageId" || key0 === "code" || key0 === "selected")) {
            validate106.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.code !== undefined) {
                let data2 = data.code;
                const _errs4 = errors;
                if (errors === _errs4) {
                  if (typeof data2 === "string") {
                    if (func1(data2) < 1) {
                      validate106.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                      return false;
                    } else {
                      if (!pattern7.test(data2)) {
                        validate106.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "' + "\\S" + '"' }];
                        return false;
                      }
                    }
                  } else {
                    validate106.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.selected !== undefined) {
                  const _errs6 = errors;
                  if (typeof data.selected !== "boolean") {
                    validate106.errors = [{ instancePath: instancePath + "/selected", schemaPath: "#/properties/selected/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate106.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate106.errors = vErrors;
  return errors === 0;
}
validate106.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateReadRequest = validate109;
function validate109(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate109.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.messageId === undefined && (missing0 = "messageId")) {
        validate109.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "messageId")) {
            validate109.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate109.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate109.errors = vErrors;
  return errors === 0;
}
validate109.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateReadResponse = validate112;
function validate112(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate112.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.outcome === undefined && (missing0 = "outcome") || data.scope === undefined && (missing0 = "scope") || data.roomId === undefined && (missing0 = "roomId") || data.messageId === undefined && (missing0 = "messageId")) {
        validate112.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "outcome" || key0 === "scope" || key0 === "roomId" || key0 === "messageId")) {
            validate112.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.outcome !== undefined) {
            const _errs2 = errors;
            if (data.outcome !== "confirmed") {
              validate112.errors = [{ instancePath: instancePath + "/outcome", schemaPath: "#/properties/outcome/const", keyword: "const", params: { allowedValue: "confirmed" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.scope !== undefined) {
              const _errs3 = errors;
              if (data.scope !== "local") {
                validate112.errors = [{ instancePath: instancePath + "/scope", schemaPath: "#/properties/scope/const", keyword: "const", params: { allowedValue: "local" }, message: "must be equal to constant" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.roomId !== undefined) {
                const _errs4 = errors;
                if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.messageId !== undefined) {
                  const _errs5 = errors;
                  if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate112.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate112.errors = vErrors;
  return errors === 0;
}
validate112.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateUnixSeconds = validate115;
function validate115(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate115.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (!(typeof data == "number" && (!(data % 1) && !isNaN(data)) && isFinite(data))) {
    validate115.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
    return false;
  }
  if (errors === 0) {
    if (typeof data == "number" && isFinite(data)) {
      if (data > 9007199254740991 || isNaN(data)) {
        validate115.errors = [{ instancePath, schemaPath: "#/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
        return false;
      } else {
        if (data < 0 || isNaN(data)) {
          validate115.errors = [{ instancePath, schemaPath: "#/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
          return false;
        }
      }
    }
  }
  validate115.errors = vErrors;
  return errors === 0;
}
validate115.evaluated = { dynamicProps: false, dynamicItems: false };
var validateSummaryRequest = validate116;
function validate116(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate116.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.from === undefined && (missing0 = "from") || data.to === undefined && (missing0 = "to")) {
        validate116.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "from" || key0 === "to" || key0 === "model")) {
            validate116.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.from !== undefined) {
              const _errs3 = errors;
              if (!validate115(data.from, { instancePath: instancePath + "/from", parentData: data, parentDataProperty: "from", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.to !== undefined) {
                const _errs4 = errors;
                if (!validate115(data.to, { instancePath: instancePath + "/to", parentData: data, parentDataProperty: "to", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.model !== undefined) {
                  let data3 = data.model;
                  const _errs5 = errors;
                  if (errors === _errs5) {
                    if (typeof data3 === "string") {
                      if (func1(data3) < 1) {
                        validate116.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                        return false;
                      }
                    } else {
                      validate116.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate116.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate116.errors = vErrors;
  return errors === 0;
}
validate116.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateQuestionRequest = validate120;
function validate120(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate120.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.from === undefined && (missing0 = "from") || data.to === undefined && (missing0 = "to") || data.question === undefined && (missing0 = "question")) {
        validate120.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "from" || key0 === "to" || key0 === "model" || key0 === "question")) {
            validate120.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.from !== undefined) {
              const _errs3 = errors;
              if (!validate115(data.from, { instancePath: instancePath + "/from", parentData: data, parentDataProperty: "from", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.to !== undefined) {
                const _errs4 = errors;
                if (!validate115(data.to, { instancePath: instancePath + "/to", parentData: data, parentDataProperty: "to", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.model !== undefined) {
                  let data3 = data.model;
                  const _errs5 = errors;
                  if (errors === _errs5) {
                    if (typeof data3 === "string") {
                      if (func1(data3) < 1) {
                        validate120.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                        return false;
                      }
                    } else {
                      validate120.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.question !== undefined) {
                    let data4 = data.question;
                    const _errs7 = errors;
                    if (errors === _errs7) {
                      if (typeof data4 === "string") {
                        if (func1(data4) < 1) {
                          validate120.errors = [{ instancePath: instancePath + "/question", schemaPath: "#/properties/question/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                          return false;
                        } else {
                          if (!pattern7.test(data4)) {
                            validate120.errors = [{ instancePath: instancePath + "/question", schemaPath: "#/properties/question/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "' + "\\S" + '"' }];
                            return false;
                          }
                        }
                      } else {
                        validate120.errors = [{ instancePath: instancePath + "/question", schemaPath: "#/properties/question/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate120.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate120.errors = vErrors;
  return errors === 0;
}
validate120.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateCitation = validate124;
function validate124(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate124.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.messageId === undefined && (missing0 = "messageId") || data.userId === undefined && (missing0 = "userId") || data.text === undefined && (missing0 = "text") || data.at === undefined && (missing0 = "at")) {
        validate124.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "messageId" || key0 === "userId" || key0 === "text" || key0 === "at")) {
            validate124.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.messageId !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.userId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.userId, { instancePath: instancePath + "/userId", parentData: data, parentDataProperty: "userId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.text !== undefined) {
                const _errs4 = errors;
                if (typeof data.text !== "string") {
                  validate124.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.at !== undefined) {
                  const _errs6 = errors;
                  if (!validate115(data.at, { instancePath: instancePath + "/at", parentData: data, parentDataProperty: "at", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate124.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate124.errors = vErrors;
  return errors === 0;
}
validate124.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSummaryResponse = validate128;
function validate128(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate128.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.from === undefined && (missing0 = "from") || data.to === undefined && (missing0 = "to") || data.model === undefined && (missing0 = "model") || data.summary === undefined && (missing0 = "summary") || data.coverage === undefined && (missing0 = "coverage") || data.messageCount === undefined && (missing0 = "messageCount") || data.chunkCount === undefined && (missing0 = "chunkCount")) {
        validate128.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "from" || key0 === "to" || key0 === "model" || key0 === "summary" || key0 === "coverage" || key0 === "messageCount" || key0 === "chunkCount")) {
            validate128.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.from !== undefined) {
              const _errs3 = errors;
              if (!validate115(data.from, { instancePath: instancePath + "/from", parentData: data, parentDataProperty: "from", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.to !== undefined) {
                const _errs4 = errors;
                if (!validate115(data.to, { instancePath: instancePath + "/to", parentData: data, parentDataProperty: "to", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.model !== undefined) {
                  let data3 = data.model;
                  const _errs5 = errors;
                  if (errors === _errs5) {
                    if (typeof data3 === "string") {
                      if (func1(data3) < 1) {
                        validate128.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                        return false;
                      }
                    } else {
                      validate128.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.summary !== undefined) {
                    let data4 = data.summary;
                    const _errs7 = errors;
                    if (errors === _errs7) {
                      if (typeof data4 === "string") {
                        if (func1(data4) < 1) {
                          validate128.errors = [{ instancePath: instancePath + "/summary", schemaPath: "#/properties/summary/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                          return false;
                        }
                      } else {
                        validate128.errors = [{ instancePath: instancePath + "/summary", schemaPath: "#/properties/summary/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.coverage !== undefined) {
                      const _errs9 = errors;
                      if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs9 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.messageCount !== undefined) {
                        let data6 = data.messageCount;
                        const _errs10 = errors;
                        if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
                          validate128.errors = [{ instancePath: instancePath + "/messageCount", schemaPath: "#/properties/messageCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                          return false;
                        }
                        if (errors === _errs10) {
                          if (typeof data6 == "number" && isFinite(data6)) {
                            if (data6 > 9007199254740991 || isNaN(data6)) {
                              validate128.errors = [{ instancePath: instancePath + "/messageCount", schemaPath: "#/properties/messageCount/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                              return false;
                            } else {
                              if (data6 < 0 || isNaN(data6)) {
                                validate128.errors = [{ instancePath: instancePath + "/messageCount", schemaPath: "#/properties/messageCount/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                return false;
                              }
                            }
                          }
                        }
                        var valid0 = _errs10 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.chunkCount !== undefined) {
                          let data7 = data.chunkCount;
                          const _errs12 = errors;
                          if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)) && isFinite(data7))) {
                            validate128.errors = [{ instancePath: instancePath + "/chunkCount", schemaPath: "#/properties/chunkCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                            return false;
                          }
                          if (errors === _errs12) {
                            if (typeof data7 == "number" && isFinite(data7)) {
                              if (data7 > 9007199254740991 || isNaN(data7)) {
                                validate128.errors = [{ instancePath: instancePath + "/chunkCount", schemaPath: "#/properties/chunkCount/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                                return false;
                              } else {
                                if (data7 < 1 || isNaN(data7)) {
                                  validate128.errors = [{ instancePath: instancePath + "/chunkCount", schemaPath: "#/properties/chunkCount/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                                  return false;
                                }
                              }
                            }
                          }
                          var valid0 = _errs12 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate128.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate128.errors = vErrors;
  return errors === 0;
}
validate128.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateQuestionResponse = validate133;
var schema47 = { type: "object", properties: { roomId: { $ref: "#/components/schemas/RoomId" }, from: { $ref: "#/components/schemas/UnixSeconds" }, to: { $ref: "#/components/schemas/UnixSeconds" }, model: { type: "string", minLength: 1 }, answer: { type: "string", minLength: 1 }, coverage: { $ref: "#/components/schemas/Coverage" }, citations: { type: "array", items: { $ref: "#/components/schemas/Citation" } }, matchCount: { type: "integer", minimum: 0, maximum: 9007199254740991 }, windowCount: { type: "integer", minimum: 0, maximum: 9007199254740991 } }, required: ["roomId", "from", "to", "model", "answer", "coverage", "citations", "matchCount", "windowCount"], additionalProperties: false };
function validate133(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate133.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.from === undefined && (missing0 = "from") || data.to === undefined && (missing0 = "to") || data.model === undefined && (missing0 = "model") || data.answer === undefined && (missing0 = "answer") || data.coverage === undefined && (missing0 = "coverage") || data.citations === undefined && (missing0 = "citations") || data.matchCount === undefined && (missing0 = "matchCount") || data.windowCount === undefined && (missing0 = "windowCount")) {
        validate133.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func7.call(schema47.properties, key0)) {
            validate133.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.from !== undefined) {
              const _errs3 = errors;
              if (!validate115(data.from, { instancePath: instancePath + "/from", parentData: data, parentDataProperty: "from", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.to !== undefined) {
                const _errs4 = errors;
                if (!validate115(data.to, { instancePath: instancePath + "/to", parentData: data, parentDataProperty: "to", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.model !== undefined) {
                  let data3 = data.model;
                  const _errs5 = errors;
                  if (errors === _errs5) {
                    if (typeof data3 === "string") {
                      if (func1(data3) < 1) {
                        validate133.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                        return false;
                      }
                    } else {
                      validate133.errors = [{ instancePath: instancePath + "/model", schemaPath: "#/properties/model/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.answer !== undefined) {
                    let data4 = data.answer;
                    const _errs7 = errors;
                    if (errors === _errs7) {
                      if (typeof data4 === "string") {
                        if (func1(data4) < 1) {
                          validate133.errors = [{ instancePath: instancePath + "/answer", schemaPath: "#/properties/answer/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                          return false;
                        }
                      } else {
                        validate133.errors = [{ instancePath: instancePath + "/answer", schemaPath: "#/properties/answer/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.coverage !== undefined) {
                      const _errs9 = errors;
                      if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs9 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.citations !== undefined) {
                        let data6 = data.citations;
                        const _errs10 = errors;
                        if (errors === _errs10) {
                          if (Array.isArray(data6)) {
                            var valid1 = true;
                            const len0 = data6.length;
                            for (let i0 = 0;i0 < len0; i0++) {
                              const _errs12 = errors;
                              if (!validate124(data6[i0], { instancePath: instancePath + "/citations/" + i0, parentData: data6, parentDataProperty: i0, rootData, dynamicAnchors })) {
                                vErrors = vErrors === null ? validate124.errors : vErrors.concat(validate124.errors);
                                errors = vErrors.length;
                              }
                              var valid1 = _errs12 === errors;
                              if (!valid1) {
                                break;
                              }
                            }
                          } else {
                            validate133.errors = [{ instancePath: instancePath + "/citations", schemaPath: "#/properties/citations/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid0 = _errs10 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.matchCount !== undefined) {
                          let data8 = data.matchCount;
                          const _errs13 = errors;
                          if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)) && isFinite(data8))) {
                            validate133.errors = [{ instancePath: instancePath + "/matchCount", schemaPath: "#/properties/matchCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                            return false;
                          }
                          if (errors === _errs13) {
                            if (typeof data8 == "number" && isFinite(data8)) {
                              if (data8 > 9007199254740991 || isNaN(data8)) {
                                validate133.errors = [{ instancePath: instancePath + "/matchCount", schemaPath: "#/properties/matchCount/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                                return false;
                              } else {
                                if (data8 < 0 || isNaN(data8)) {
                                  validate133.errors = [{ instancePath: instancePath + "/matchCount", schemaPath: "#/properties/matchCount/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                  return false;
                                }
                              }
                            }
                          }
                          var valid0 = _errs13 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.windowCount !== undefined) {
                            let data9 = data.windowCount;
                            const _errs15 = errors;
                            if (!(typeof data9 == "number" && (!(data9 % 1) && !isNaN(data9)) && isFinite(data9))) {
                              validate133.errors = [{ instancePath: instancePath + "/windowCount", schemaPath: "#/properties/windowCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                              return false;
                            }
                            if (errors === _errs15) {
                              if (typeof data9 == "number" && isFinite(data9)) {
                                if (data9 > 9007199254740991 || isNaN(data9)) {
                                  validate133.errors = [{ instancePath: instancePath + "/windowCount", schemaPath: "#/properties/windowCount/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                                  return false;
                                } else {
                                  if (data9 < 0 || isNaN(data9)) {
                                    validate133.errors = [{ instancePath: instancePath + "/windowCount", schemaPath: "#/properties/windowCount/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                    return false;
                                  }
                                }
                              }
                            }
                            var valid0 = _errs15 === errors;
                          } else {
                            var valid0 = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate133.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate133.errors = vErrors;
  return errors === 0;
}
validate133.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateUploadRequest = validate139;
function validate139(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate139.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.file === undefined && (missing0 = "file")) {
        validate139.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "file")) {
            validate139.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.file !== undefined) {
              let data1 = data.file;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (func1(data1) < 1) {
                    validate139.errors = [{ instancePath: instancePath + "/file", schemaPath: "#/properties/file/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate139.errors = [{ instancePath: instancePath + "/file", schemaPath: "#/properties/file/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate139.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate139.errors = vErrors;
  return errors === 0;
}
validate139.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateUploadResponse = validate141;
var schema49 = { type: "object", properties: { roomId: { $ref: "#/components/schemas/RoomId" }, uploadId: { type: "string", minLength: 1, pattern: "^[A-Za-z0-9_-]{16,128}$" }, kind: { type: "string", enum: ["photo", "video", "file"] }, size: { type: "integer", minimum: 1, maximum: 9007199254740991 }, mimeType: { type: "string", minLength: 1 }, expiresAt: { $ref: "#/components/schemas/UnixSeconds" } }, required: ["roomId", "uploadId", "kind", "size", "mimeType", "expiresAt"], additionalProperties: false };
function validate141(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate141.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.uploadId === undefined && (missing0 = "uploadId") || data.kind === undefined && (missing0 = "kind") || data.size === undefined && (missing0 = "size") || data.mimeType === undefined && (missing0 = "mimeType") || data.expiresAt === undefined && (missing0 = "expiresAt")) {
        validate141.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "uploadId" || key0 === "kind" || key0 === "size" || key0 === "mimeType" || key0 === "expiresAt")) {
            validate141.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.uploadId !== undefined) {
              let data1 = data.uploadId;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (func1(data1) < 1) {
                    validate141.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  } else {
                    if (!pattern8.test(data1)) {
                      validate141.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]{16,128}$" }, message: 'must match pattern "' + "^[A-Za-z0-9_-]{16,128}$" + '"' }];
                      return false;
                    }
                  }
                } else {
                  validate141.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.kind !== undefined) {
                let data2 = data.kind;
                const _errs5 = errors;
                if (typeof data2 !== "string") {
                  validate141.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                if (!(data2 === "photo" || data2 === "video" || data2 === "file")) {
                  validate141.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: schema49.properties.kind.enum }, message: "must be equal to one of the allowed values" }];
                  return false;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.size !== undefined) {
                  let data3 = data.size;
                  const _errs7 = errors;
                  if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                    validate141.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                    return false;
                  }
                  if (errors === _errs7) {
                    if (typeof data3 == "number" && isFinite(data3)) {
                      if (data3 > 9007199254740991 || isNaN(data3)) {
                        validate141.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                        return false;
                      } else {
                        if (data3 < 1 || isNaN(data3)) {
                          validate141.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                          return false;
                        }
                      }
                    }
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.mimeType !== undefined) {
                    let data4 = data.mimeType;
                    const _errs9 = errors;
                    if (errors === _errs9) {
                      if (typeof data4 === "string") {
                        if (func1(data4) < 1) {
                          validate141.errors = [{ instancePath: instancePath + "/mimeType", schemaPath: "#/properties/mimeType/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                          return false;
                        }
                      } else {
                        validate141.errors = [{ instancePath: instancePath + "/mimeType", schemaPath: "#/properties/mimeType/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs9 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.expiresAt !== undefined) {
                      const _errs11 = errors;
                      if (!validate115(data.expiresAt, { instancePath: instancePath + "/expiresAt", parentData: data, parentDataProperty: "expiresAt", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs11 === errors;
                    } else {
                      var valid0 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate141.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate141.errors = vErrors;
  return errors === 0;
}
validate141.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateHistoryRequest = validate144;
function validate144(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate144.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId")) {
        validate144.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "beforeId" || key0 === "messageId" || key0 === "limit" || key0 === "cursor")) {
            validate144.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.beforeId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.beforeId, { instancePath: instancePath + "/beforeId", parentData: data, parentDataProperty: "beforeId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.messageId !== undefined) {
                const _errs4 = errors;
                if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.limit !== undefined) {
                  let data3 = data.limit;
                  const _errs5 = errors;
                  if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                    validate144.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                    return false;
                  }
                  if (errors === _errs5) {
                    if (typeof data3 == "number" && isFinite(data3)) {
                      if (data3 > 200 || isNaN(data3)) {
                        validate144.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 }, message: "must be <= 200" }];
                        return false;
                      } else {
                        if (data3 < 1 || isNaN(data3)) {
                          validate144.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                          return false;
                        }
                      }
                    }
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.cursor !== undefined) {
                    const _errs7 = errors;
                    if (!validate57(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate144.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate144.errors = vErrors;
  return errors === 0;
}
validate144.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSearchRequest = validate149;
var schema51 = { type: "object", properties: { roomId: { $ref: "#/components/schemas/RoomId" }, q: { type: "string", minLength: 1, pattern: "\\S" }, scope: { type: "string", enum: ["messages", "names"] }, limit: { type: "integer", minimum: 1, maximum: 200 }, cursor: { $ref: "#/components/schemas/Cursor" } }, required: ["q"], additionalProperties: false };
function validate149(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate149.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.q === undefined && (missing0 = "q")) {
        validate149.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "q" || key0 === "scope" || key0 === "limit" || key0 === "cursor")) {
            validate149.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.q !== undefined) {
              let data1 = data.q;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (func1(data1) < 1) {
                    validate149.errors = [{ instancePath: instancePath + "/q", schemaPath: "#/properties/q/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  } else {
                    if (!pattern7.test(data1)) {
                      validate149.errors = [{ instancePath: instancePath + "/q", schemaPath: "#/properties/q/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "' + "\\S" + '"' }];
                      return false;
                    }
                  }
                } else {
                  validate149.errors = [{ instancePath: instancePath + "/q", schemaPath: "#/properties/q/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.scope !== undefined) {
                let data2 = data.scope;
                const _errs5 = errors;
                if (typeof data2 !== "string") {
                  validate149.errors = [{ instancePath: instancePath + "/scope", schemaPath: "#/properties/scope/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                if (!(data2 === "messages" || data2 === "names")) {
                  validate149.errors = [{ instancePath: instancePath + "/scope", schemaPath: "#/properties/scope/enum", keyword: "enum", params: { allowedValues: schema51.properties.scope.enum }, message: "must be equal to one of the allowed values" }];
                  return false;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.limit !== undefined) {
                  let data3 = data.limit;
                  const _errs7 = errors;
                  if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                    validate149.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                    return false;
                  }
                  if (errors === _errs7) {
                    if (typeof data3 == "number" && isFinite(data3)) {
                      if (data3 > 200 || isNaN(data3)) {
                        validate149.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 }, message: "must be <= 200" }];
                        return false;
                      } else {
                        if (data3 < 1 || isNaN(data3)) {
                          validate149.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                          return false;
                        }
                      }
                    }
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.cursor !== undefined) {
                    const _errs9 = errors;
                    if (!validate57(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs9 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate149.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate149.errors = vErrors;
  return errors === 0;
}
validate149.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateThreadRequest = validate152;
function validate152(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate152.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.messageId === undefined && (missing0 = "messageId")) {
        validate152.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "messageId" || key0 === "limit" || key0 === "cursor")) {
            validate152.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.limit !== undefined) {
                let data2 = data.limit;
                const _errs4 = errors;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  validate152.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs4) {
                  if (typeof data2 == "number" && isFinite(data2)) {
                    if (data2 > 200 || isNaN(data2)) {
                      validate152.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 }, message: "must be <= 200" }];
                      return false;
                    } else {
                      if (data2 < 1 || isNaN(data2)) {
                        validate152.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                        return false;
                      }
                    }
                  }
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.cursor !== undefined) {
                  const _errs6 = errors;
                  if (!validate57(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate152.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate152.errors = vErrors;
  return errors === 0;
}
validate152.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateAttachmentsRequest = validate156;
var schema53 = { type: "object", properties: { roomId: { $ref: "#/components/schemas/RoomId" }, kind: { type: "string", enum: ["photo", "video", "file", "link"] }, limit: { type: "integer", minimum: 1, maximum: 200 }, cursor: { $ref: "#/components/schemas/Cursor" } }, required: ["roomId"], additionalProperties: false };
function validate156(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate156.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId")) {
        validate156.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "kind" || key0 === "limit" || key0 === "cursor")) {
            validate156.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.kind !== undefined) {
              let data1 = data.kind;
              const _errs3 = errors;
              if (typeof data1 !== "string") {
                validate156.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              if (!(data1 === "photo" || data1 === "video" || data1 === "file" || data1 === "link")) {
                validate156.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: schema53.properties.kind.enum }, message: "must be equal to one of the allowed values" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.limit !== undefined) {
                let data2 = data.limit;
                const _errs5 = errors;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  validate156.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs5) {
                  if (typeof data2 == "number" && isFinite(data2)) {
                    if (data2 > 200 || isNaN(data2)) {
                      validate156.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 }, message: "must be <= 200" }];
                      return false;
                    } else {
                      if (data2 < 1 || isNaN(data2)) {
                        validate156.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                        return false;
                      }
                    }
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.cursor !== undefined) {
                  const _errs7 = errors;
                  if (!validate57(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate156.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate156.errors = vErrors;
  return errors === 0;
}
validate156.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateMembersRequest = validate159;
function validate159(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate159.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId")) {
        validate159.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId")) {
            validate159.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
          }
        }
      }
    } else {
      validate159.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate159.errors = vErrors;
  return errors === 0;
}
validate159.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateFriendsRequest = validate161;
var schema55 = { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 200 }, cursor: { $ref: "#/components/schemas/Cursor" }, section: { type: "string", enum: ["all", "favorites", "updated", "channels", "birthday", "hidden", "blocked"] } }, required: [], additionalProperties: false };
function validate161(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate161.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (!(key0 === "limit" || key0 === "cursor" || key0 === "section")) {
          validate161.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
          return false;
          break;
        }
      }
      if (_errs1 === errors) {
        if (data.limit !== undefined) {
          let data0 = data.limit;
          const _errs2 = errors;
          if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)) && isFinite(data0))) {
            validate161.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
            return false;
          }
          if (errors === _errs2) {
            if (typeof data0 == "number" && isFinite(data0)) {
              if (data0 > 200 || isNaN(data0)) {
                validate161.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 }, message: "must be <= 200" }];
                return false;
              } else {
                if (data0 < 1 || isNaN(data0)) {
                  validate161.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                  return false;
                }
              }
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.cursor !== undefined) {
            const _errs4 = errors;
            if (!validate57(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.section !== undefined) {
              let data2 = data.section;
              const _errs5 = errors;
              if (typeof data2 !== "string") {
                validate161.errors = [{ instancePath: instancePath + "/section", schemaPath: "#/properties/section/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              if (!(data2 === "all" || data2 === "favorites" || data2 === "updated" || data2 === "channels" || data2 === "birthday" || data2 === "hidden" || data2 === "blocked")) {
                validate161.errors = [{ instancePath: instancePath + "/section", schemaPath: "#/properties/section/enum", keyword: "enum", params: { allowedValues: schema55.properties.section.enum }, message: "must be equal to one of the allowed values" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate161.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate161.errors = vErrors;
  return errors === 0;
}
validate161.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateProfileRequest = validate163;
function validate163(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate163.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.userId === undefined && (missing0 = "userId")) {
        validate163.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "userId")) {
            validate163.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.userId !== undefined) {
            if (!validate55(data.userId, { instancePath: instancePath + "/userId", parentData: data, parentDataProperty: "userId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
          }
        }
      }
    } else {
      validate163.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate163.errors = vErrors;
  return errors === 0;
}
validate163.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStickersRequest = validate165;
function validate165(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate165.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      const _errs1 = errors;
      for (const key0 in data) {
        if (!(key0 === "limit" || key0 === "cursor")) {
          validate165.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
          return false;
          break;
        }
      }
      if (_errs1 === errors) {
        if (data.limit !== undefined) {
          let data0 = data.limit;
          const _errs2 = errors;
          if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)) && isFinite(data0))) {
            validate165.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
            return false;
          }
          if (errors === _errs2) {
            if (typeof data0 == "number" && isFinite(data0)) {
              if (data0 > 200 || isNaN(data0)) {
                validate165.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 }, message: "must be <= 200" }];
                return false;
              } else {
                if (data0 < 1 || isNaN(data0)) {
                  validate165.errors = [{ instancePath: instancePath + "/limit", schemaPath: "#/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                  return false;
                }
              }
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.cursor !== undefined) {
            const _errs4 = errors;
            if (!validate57(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate165.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate165.errors = vErrors;
  return errors === 0;
}
validate165.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStickerResourceRequest = validate167;
function validate167(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate167.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.itemId === undefined && (missing0 = "itemId")) {
        validate167.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "itemId")) {
            validate167.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.itemId !== undefined) {
            if (!validate87(data.itemId, { instancePath: instancePath + "/itemId", parentData: data, parentDataProperty: "itemId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
              errors = vErrors.length;
            }
          }
        }
      }
    } else {
      validate167.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate167.errors = vErrors;
  return errors === 0;
}
validate167.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateMessage = validate169;
var schema59 = { type: "object", properties: { id: { $ref: "#/components/schemas/Id" }, roomId: { $ref: "#/components/schemas/RoomId" }, userId: { $ref: "#/components/schemas/Id" }, text: { type: "string" }, kind: { type: "string", enum: ["text", "photo", "video", "file", "sticker", "other"] }, at: { $ref: "#/components/schemas/UnixSeconds" }, replyTo: { $ref: "#/components/schemas/Id" }, threadRoot: { $ref: "#/components/schemas/Id" } }, required: ["id", "roomId", "userId", "text", "kind", "at"], additionalProperties: false };
function validate169(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate169.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.id === undefined && (missing0 = "id") || data.roomId === undefined && (missing0 = "roomId") || data.userId === undefined && (missing0 = "userId") || data.text === undefined && (missing0 = "text") || data.kind === undefined && (missing0 = "kind") || data.at === undefined && (missing0 = "at")) {
        validate169.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "id" || key0 === "roomId" || key0 === "userId" || key0 === "text" || key0 === "kind" || key0 === "at" || key0 === "replyTo" || key0 === "threadRoot")) {
            validate169.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.id !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.id, { instancePath: instancePath + "/id", parentData: data, parentDataProperty: "id", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.roomId !== undefined) {
              const _errs3 = errors;
              if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.userId !== undefined) {
                const _errs4 = errors;
                if (!validate55(data.userId, { instancePath: instancePath + "/userId", parentData: data, parentDataProperty: "userId", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.text !== undefined) {
                  const _errs5 = errors;
                  if (typeof data.text !== "string") {
                    validate169.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.kind !== undefined) {
                    let data4 = data.kind;
                    const _errs7 = errors;
                    if (typeof data4 !== "string") {
                      validate169.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    if (!(data4 === "text" || data4 === "photo" || data4 === "video" || data4 === "file" || data4 === "sticker" || data4 === "other")) {
                      validate169.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: schema59.properties.kind.enum }, message: "must be equal to one of the allowed values" }];
                      return false;
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.at !== undefined) {
                      const _errs9 = errors;
                      if (!validate115(data.at, { instancePath: instancePath + "/at", parentData: data, parentDataProperty: "at", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs9 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.replyTo !== undefined) {
                        const _errs10 = errors;
                        if (!validate55(data.replyTo, { instancePath: instancePath + "/replyTo", parentData: data, parentDataProperty: "replyTo", rootData, dynamicAnchors })) {
                          vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                          errors = vErrors.length;
                        }
                        var valid0 = _errs10 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.threadRoot !== undefined) {
                          const _errs11 = errors;
                          if (!validate55(data.threadRoot, { instancePath: instancePath + "/threadRoot", parentData: data, parentDataProperty: "threadRoot", rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                            errors = vErrors.length;
                          }
                          var valid0 = _errs11 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate169.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate169.errors = vErrors;
  return errors === 0;
}
validate169.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSearchHit = validate176;
var schema60 = { type: "object", properties: { roomId: { $ref: "#/components/schemas/RoomId" }, messageId: { $ref: "#/components/schemas/Id" }, userId: { $ref: "#/components/schemas/Id" }, text: { type: "string" }, at: { $ref: "#/components/schemas/UnixSeconds" }, scope: { type: "string", enum: ["messages", "names"] } }, required: ["roomId", "messageId", "userId", "text", "at", "scope"], additionalProperties: false };
function validate176(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate176.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.messageId === undefined && (missing0 = "messageId") || data.userId === undefined && (missing0 = "userId") || data.text === undefined && (missing0 = "text") || data.at === undefined && (missing0 = "at") || data.scope === undefined && (missing0 = "scope")) {
        validate176.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "messageId" || key0 === "userId" || key0 === "text" || key0 === "at" || key0 === "scope")) {
            validate176.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.userId !== undefined) {
                const _errs4 = errors;
                if (!validate55(data.userId, { instancePath: instancePath + "/userId", parentData: data, parentDataProperty: "userId", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.text !== undefined) {
                  const _errs5 = errors;
                  if (typeof data.text !== "string") {
                    validate176.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs5 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.at !== undefined) {
                    const _errs7 = errors;
                    if (!validate115(data.at, { instancePath: instancePath + "/at", parentData: data, parentDataProperty: "at", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.scope !== undefined) {
                      let data5 = data.scope;
                      const _errs8 = errors;
                      if (typeof data5 !== "string") {
                        validate176.errors = [{ instancePath: instancePath + "/scope", schemaPath: "#/properties/scope/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                      if (!(data5 === "messages" || data5 === "names")) {
                        validate176.errors = [{ instancePath: instancePath + "/scope", schemaPath: "#/properties/scope/enum", keyword: "enum", params: { allowedValues: schema60.properties.scope.enum }, message: "must be equal to one of the allowed values" }];
                        return false;
                      }
                      var valid0 = _errs8 === errors;
                    } else {
                      var valid0 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate176.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate176.errors = vErrors;
  return errors === 0;
}
validate176.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateAttachment = validate181;
var schema61 = { type: "object", properties: { id: { type: "string", minLength: 1 }, messageId: { $ref: "#/components/schemas/Id" }, roomId: { $ref: "#/components/schemas/RoomId" }, kind: { type: "string", enum: ["photo", "video", "file", "link"] }, name: { type: "string", minLength: 1 }, mimeType: { type: "string", minLength: 1 }, size: { type: "integer", minimum: 0, maximum: 9007199254740991 } }, required: ["id", "messageId", "roomId", "kind", "name"], additionalProperties: false };
function validate181(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate181.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.id === undefined && (missing0 = "id") || data.messageId === undefined && (missing0 = "messageId") || data.roomId === undefined && (missing0 = "roomId") || data.kind === undefined && (missing0 = "kind") || data.name === undefined && (missing0 = "name")) {
        validate181.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "id" || key0 === "messageId" || key0 === "roomId" || key0 === "kind" || key0 === "name" || key0 === "mimeType" || key0 === "size")) {
            validate181.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.id !== undefined) {
            let data0 = data.id;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func1(data0) < 1) {
                  validate181.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              } else {
                validate181.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs4 = errors;
              if (!validate55(data.messageId, { instancePath: instancePath + "/messageId", parentData: data, parentDataProperty: "messageId", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.roomId !== undefined) {
                const _errs5 = errors;
                if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.kind !== undefined) {
                  let data3 = data.kind;
                  const _errs6 = errors;
                  if (typeof data3 !== "string") {
                    validate181.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  if (!(data3 === "photo" || data3 === "video" || data3 === "file" || data3 === "link")) {
                    validate181.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: schema61.properties.kind.enum }, message: "must be equal to one of the allowed values" }];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.name !== undefined) {
                    let data4 = data.name;
                    const _errs8 = errors;
                    if (errors === _errs8) {
                      if (typeof data4 === "string") {
                        if (func1(data4) < 1) {
                          validate181.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                          return false;
                        }
                      } else {
                        validate181.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.mimeType !== undefined) {
                      let data5 = data.mimeType;
                      const _errs10 = errors;
                      if (errors === _errs10) {
                        if (typeof data5 === "string") {
                          if (func1(data5) < 1) {
                            validate181.errors = [{ instancePath: instancePath + "/mimeType", schemaPath: "#/properties/mimeType/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                            return false;
                          }
                        } else {
                          validate181.errors = [{ instancePath: instancePath + "/mimeType", schemaPath: "#/properties/mimeType/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                      }
                      var valid0 = _errs10 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.size !== undefined) {
                        let data6 = data.size;
                        const _errs12 = errors;
                        if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
                          validate181.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                          return false;
                        }
                        if (errors === _errs12) {
                          if (typeof data6 == "number" && isFinite(data6)) {
                            if (data6 > 9007199254740991 || isNaN(data6)) {
                              validate181.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                              return false;
                            } else {
                              if (data6 < 0 || isNaN(data6)) {
                                validate181.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                return false;
                              }
                            }
                          }
                        }
                        var valid0 = _errs12 === errors;
                      } else {
                        var valid0 = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate181.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate181.errors = vErrors;
  return errors === 0;
}
validate181.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validatePerson = validate184;
var schema62 = { type: "object", properties: { userId: { $ref: "#/components/schemas/Id" }, name: { type: "string" }, status: { type: "string" }, image: { $ref: "#/components/schemas/CoreResourcePath" }, background: { $ref: "#/components/schemas/CoreResourcePath" }, birthday: { type: "string" }, sections: { type: "array", items: { type: "string", enum: ["favorites", "updated", "channels", "birthday", "hidden", "blocked"] } }, roomId: { $ref: "#/components/schemas/RoomId" }, musics: { type: ["string", "null"] }, backgroundColor: { type: ["string", "null"] }, lastUpdatedAt: { anyOf: [{ $ref: "#/components/schemas/UnixSeconds" }, { type: "null" }] } }, required: ["userId", "name"], additionalProperties: false };
var pattern14 = new RegExp("^/(?!/)[^\\\\\\u0000-\\u0020\\u007f]*$", "u");
function validate186(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate186.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (typeof data === "string") {
      if (!pattern14.test(data)) {
        validate186.errors = [{ instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^/(?!/)[^\\\\\\u0000-\\u0020\\u007f]*$" }, message: 'must match pattern "' + "^/(?!/)[^\\\\\\u0000-\\u0020\\u007f]*$" + '"' }];
        return false;
      }
    } else {
      validate186.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
      return false;
    }
  }
  validate186.errors = vErrors;
  return errors === 0;
}
validate186.evaluated = { dynamicProps: false, dynamicItems: false };
function validate184(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate184.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.userId === undefined && (missing0 = "userId") || data.name === undefined && (missing0 = "name")) {
        validate184.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!func7.call(schema62.properties, key0)) {
            validate184.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.userId !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.userId, { instancePath: instancePath + "/userId", parentData: data, parentDataProperty: "userId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.name !== undefined) {
              const _errs3 = errors;
              if (typeof data.name !== "string") {
                validate184.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.status !== undefined) {
                const _errs5 = errors;
                if (typeof data.status !== "string") {
                  validate184.errors = [{ instancePath: instancePath + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.image !== undefined) {
                  const _errs7 = errors;
                  if (!validate186(data.image, { instancePath: instancePath + "/image", parentData: data, parentDataProperty: "image", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate186.errors : vErrors.concat(validate186.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.background !== undefined) {
                    const _errs8 = errors;
                    if (!validate186(data.background, { instancePath: instancePath + "/background", parentData: data, parentDataProperty: "background", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate186.errors : vErrors.concat(validate186.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs8 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.birthday !== undefined) {
                      const _errs9 = errors;
                      if (typeof data.birthday !== "string") {
                        validate184.errors = [{ instancePath: instancePath + "/birthday", schemaPath: "#/properties/birthday/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                      var valid0 = _errs9 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.sections !== undefined) {
                        let data6 = data.sections;
                        const _errs11 = errors;
                        if (errors === _errs11) {
                          if (Array.isArray(data6)) {
                            var valid1 = true;
                            const len0 = data6.length;
                            for (let i0 = 0;i0 < len0; i0++) {
                              let data7 = data6[i0];
                              const _errs13 = errors;
                              if (typeof data7 !== "string") {
                                validate184.errors = [{ instancePath: instancePath + "/sections/" + i0, schemaPath: "#/properties/sections/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                return false;
                              }
                              if (!(data7 === "favorites" || data7 === "updated" || data7 === "channels" || data7 === "birthday" || data7 === "hidden" || data7 === "blocked")) {
                                validate184.errors = [{ instancePath: instancePath + "/sections/" + i0, schemaPath: "#/properties/sections/items/enum", keyword: "enum", params: { allowedValues: schema62.properties.sections.items.enum }, message: "must be equal to one of the allowed values" }];
                                return false;
                              }
                              var valid1 = _errs13 === errors;
                              if (!valid1) {
                                break;
                              }
                            }
                          } else {
                            validate184.errors = [{ instancePath: instancePath + "/sections", schemaPath: "#/properties/sections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid0 = _errs11 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.roomId !== undefined) {
                          const _errs15 = errors;
                          if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
                            errors = vErrors.length;
                          }
                          var valid0 = _errs15 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.musics !== undefined) {
                            let data9 = data.musics;
                            const _errs16 = errors;
                            if (typeof data9 !== "string" && data9 !== null) {
                              validate184.errors = [{ instancePath: instancePath + "/musics", schemaPath: "#/properties/musics/type", keyword: "type", params: { type: schema62.properties.musics.type }, message: "must be string,null" }];
                              return false;
                            }
                            var valid0 = _errs16 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.backgroundColor !== undefined) {
                              let data10 = data.backgroundColor;
                              const _errs18 = errors;
                              if (typeof data10 !== "string" && data10 !== null) {
                                validate184.errors = [{ instancePath: instancePath + "/backgroundColor", schemaPath: "#/properties/backgroundColor/type", keyword: "type", params: { type: schema62.properties.backgroundColor.type }, message: "must be string,null" }];
                                return false;
                              }
                              var valid0 = _errs18 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.lastUpdatedAt !== undefined) {
                                let data11 = data.lastUpdatedAt;
                                const _errs20 = errors;
                                const _errs21 = errors;
                                let valid2 = false;
                                const _errs22 = errors;
                                if (!validate115(data11, { instancePath: instancePath + "/lastUpdatedAt", parentData: data, parentDataProperty: "lastUpdatedAt", rootData, dynamicAnchors })) {
                                  vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                                  errors = vErrors.length;
                                }
                                var _valid0 = _errs22 === errors;
                                valid2 = valid2 || _valid0;
                                const _errs23 = errors;
                                if (data11 !== null) {
                                  const err0 = { instancePath: instancePath + "/lastUpdatedAt", schemaPath: "#/properties/lastUpdatedAt/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                  if (vErrors === null) {
                                    vErrors = [err0];
                                  } else {
                                    vErrors.push(err0);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs23 === errors;
                                valid2 = valid2 || _valid0;
                                if (!valid2) {
                                  const err1 = { instancePath: instancePath + "/lastUpdatedAt", schemaPath: "#/properties/lastUpdatedAt/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                  if (vErrors === null) {
                                    vErrors = [err1];
                                  } else {
                                    vErrors.push(err1);
                                  }
                                  errors++;
                                  validate184.errors = vErrors;
                                  return false;
                                } else {
                                  errors = _errs21;
                                  if (vErrors !== null) {
                                    if (_errs21) {
                                      vErrors.length = _errs21;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                }
                                var valid0 = _errs20 === errors;
                              } else {
                                var valid0 = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate184.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate184.errors = vErrors;
  return errors === 0;
}
validate184.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSticker = validate191;
var pattern15 = new RegExp("^/extensions/piratetalk/v1/sticker-resource\\?itemId=", "u");
function validate191(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate191.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.itemId === undefined && (missing0 = "itemId") || data.name === undefined && (missing0 = "name") || data.resource === undefined && (missing0 = "resource")) {
        validate191.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "itemId" || key0 === "name" || key0 === "resource")) {
            validate191.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.itemId !== undefined) {
            const _errs2 = errors;
            if (!validate87(data.itemId, { instancePath: instancePath + "/itemId", parentData: data, parentDataProperty: "itemId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.name !== undefined) {
              let data1 = data.name;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (func1(data1) < 1) {
                    validate191.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate191.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.resource !== undefined) {
                let data2 = data.resource;
                const _errs5 = errors;
                if (errors === _errs5) {
                  if (typeof data2 === "string") {
                    if (!pattern15.test(data2)) {
                      validate191.errors = [{ instancePath: instancePath + "/resource", schemaPath: "#/properties/resource/pattern", keyword: "pattern", params: { pattern: "^/extensions/piratetalk/v1/sticker-resource\\?itemId=" }, message: 'must match pattern "' + "^/extensions/piratetalk/v1/sticker-resource\\?itemId=" + '"' }];
                      return false;
                    }
                  } else {
                    validate191.errors = [{ instancePath: instancePath + "/resource", schemaPath: "#/properties/resource/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate191.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate191.errors = vErrors;
  return errors === 0;
}
validate191.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateHistoryResponse = validate193;
function validate193(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate193.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.hasMore === undefined && (missing0 = "hasMore") || data.nextCursor === undefined && (missing0 = "nextCursor") || data.coverage === undefined && (missing0 = "coverage")) {
        validate193.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "hasMore" || key0 === "nextCursor" || key0 === "coverage")) {
            validate193.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate169(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate169.errors : vErrors.concat(validate169.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate193.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasMore !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasMore !== "boolean") {
                validate193.errors = [{ instancePath: instancePath + "/hasMore", schemaPath: "#/properties/hasMore/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nextCursor !== undefined) {
                let data3 = data.nextCursor;
                const _errs7 = errors;
                const _errs8 = errors;
                let valid2 = false;
                const _errs9 = errors;
                if (!validate57(data3, { instancePath: instancePath + "/nextCursor", parentData: data, parentDataProperty: "nextCursor", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                valid2 = valid2 || _valid0;
                const _errs10 = errors;
                if (data3 !== null) {
                  const err0 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs10 === errors;
                valid2 = valid2 || _valid0;
                if (!valid2) {
                  const err1 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate193.errors = vErrors;
                  return false;
                } else {
                  errors = _errs8;
                  if (vErrors !== null) {
                    if (_errs8) {
                      vErrors.length = _errs8;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.coverage !== undefined) {
                  const _errs12 = errors;
                  if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate193.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate193.errors = vErrors;
  return errors === 0;
}
validate193.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateSearchResponse = validate197;
function validate197(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate197.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.hasMore === undefined && (missing0 = "hasMore") || data.nextCursor === undefined && (missing0 = "nextCursor") || data.coverage === undefined && (missing0 = "coverage")) {
        validate197.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "hasMore" || key0 === "nextCursor" || key0 === "coverage")) {
            validate197.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate176(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate176.errors : vErrors.concat(validate176.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate197.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasMore !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasMore !== "boolean") {
                validate197.errors = [{ instancePath: instancePath + "/hasMore", schemaPath: "#/properties/hasMore/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nextCursor !== undefined) {
                let data3 = data.nextCursor;
                const _errs7 = errors;
                const _errs8 = errors;
                let valid2 = false;
                const _errs9 = errors;
                if (!validate57(data3, { instancePath: instancePath + "/nextCursor", parentData: data, parentDataProperty: "nextCursor", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                valid2 = valid2 || _valid0;
                const _errs10 = errors;
                if (data3 !== null) {
                  const err0 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs10 === errors;
                valid2 = valid2 || _valid0;
                if (!valid2) {
                  const err1 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate197.errors = vErrors;
                  return false;
                } else {
                  errors = _errs8;
                  if (vErrors !== null) {
                    if (_errs8) {
                      vErrors.length = _errs8;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.coverage !== undefined) {
                  const _errs12 = errors;
                  if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate197.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate197.errors = vErrors;
  return errors === 0;
}
validate197.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateThreadResponse = validate201;
function validate201(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate201.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.hasMore === undefined && (missing0 = "hasMore") || data.nextCursor === undefined && (missing0 = "nextCursor") || data.coverage === undefined && (missing0 = "coverage")) {
        validate201.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "hasMore" || key0 === "nextCursor" || key0 === "coverage")) {
            validate201.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate169(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate169.errors : vErrors.concat(validate169.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate201.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasMore !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasMore !== "boolean") {
                validate201.errors = [{ instancePath: instancePath + "/hasMore", schemaPath: "#/properties/hasMore/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nextCursor !== undefined) {
                let data3 = data.nextCursor;
                const _errs7 = errors;
                const _errs8 = errors;
                let valid2 = false;
                const _errs9 = errors;
                if (!validate57(data3, { instancePath: instancePath + "/nextCursor", parentData: data, parentDataProperty: "nextCursor", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                valid2 = valid2 || _valid0;
                const _errs10 = errors;
                if (data3 !== null) {
                  const err0 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs10 === errors;
                valid2 = valid2 || _valid0;
                if (!valid2) {
                  const err1 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate201.errors = vErrors;
                  return false;
                } else {
                  errors = _errs8;
                  if (vErrors !== null) {
                    if (_errs8) {
                      vErrors.length = _errs8;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.coverage !== undefined) {
                  const _errs12 = errors;
                  if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate201.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate201.errors = vErrors;
  return errors === 0;
}
validate201.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateAttachmentsResponse = validate205;
function validate205(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate205.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.hasMore === undefined && (missing0 = "hasMore") || data.nextCursor === undefined && (missing0 = "nextCursor") || data.coverage === undefined && (missing0 = "coverage")) {
        validate205.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "hasMore" || key0 === "nextCursor" || key0 === "coverage")) {
            validate205.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate181(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate181.errors : vErrors.concat(validate181.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate205.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasMore !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasMore !== "boolean") {
                validate205.errors = [{ instancePath: instancePath + "/hasMore", schemaPath: "#/properties/hasMore/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nextCursor !== undefined) {
                let data3 = data.nextCursor;
                const _errs7 = errors;
                const _errs8 = errors;
                let valid2 = false;
                const _errs9 = errors;
                if (!validate57(data3, { instancePath: instancePath + "/nextCursor", parentData: data, parentDataProperty: "nextCursor", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                valid2 = valid2 || _valid0;
                const _errs10 = errors;
                if (data3 !== null) {
                  const err0 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs10 === errors;
                valid2 = valid2 || _valid0;
                if (!valid2) {
                  const err1 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate205.errors = vErrors;
                  return false;
                } else {
                  errors = _errs8;
                  if (vErrors !== null) {
                    if (_errs8) {
                      vErrors.length = _errs8;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.coverage !== undefined) {
                  const _errs12 = errors;
                  if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate205.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate205.errors = vErrors;
  return errors === 0;
}
validate205.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateFriendsResponse = validate209;
function validate209(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate209.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.hasMore === undefined && (missing0 = "hasMore") || data.nextCursor === undefined && (missing0 = "nextCursor") || data.coverage === undefined && (missing0 = "coverage")) {
        validate209.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "hasMore" || key0 === "nextCursor" || key0 === "coverage")) {
            validate209.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate184(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate184.errors : vErrors.concat(validate184.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate209.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasMore !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasMore !== "boolean") {
                validate209.errors = [{ instancePath: instancePath + "/hasMore", schemaPath: "#/properties/hasMore/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nextCursor !== undefined) {
                let data3 = data.nextCursor;
                const _errs7 = errors;
                const _errs8 = errors;
                let valid2 = false;
                const _errs9 = errors;
                if (!validate57(data3, { instancePath: instancePath + "/nextCursor", parentData: data, parentDataProperty: "nextCursor", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                valid2 = valid2 || _valid0;
                const _errs10 = errors;
                if (data3 !== null) {
                  const err0 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs10 === errors;
                valid2 = valid2 || _valid0;
                if (!valid2) {
                  const err1 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate209.errors = vErrors;
                  return false;
                } else {
                  errors = _errs8;
                  if (vErrors !== null) {
                    if (_errs8) {
                      vErrors.length = _errs8;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.coverage !== undefined) {
                  const _errs12 = errors;
                  if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate209.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate209.errors = vErrors;
  return errors === 0;
}
validate209.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStickersResponse = validate213;
function validate213(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate213.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.hasMore === undefined && (missing0 = "hasMore") || data.nextCursor === undefined && (missing0 = "nextCursor") || data.coverage === undefined && (missing0 = "coverage")) {
        validate213.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "hasMore" || key0 === "nextCursor" || key0 === "coverage")) {
            validate213.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate191(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate191.errors : vErrors.concat(validate191.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate213.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasMore !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasMore !== "boolean") {
                validate213.errors = [{ instancePath: instancePath + "/hasMore", schemaPath: "#/properties/hasMore/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.nextCursor !== undefined) {
                let data3 = data.nextCursor;
                const _errs7 = errors;
                const _errs8 = errors;
                let valid2 = false;
                const _errs9 = errors;
                if (!validate57(data3, { instancePath: instancePath + "/nextCursor", parentData: data, parentDataProperty: "nextCursor", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                valid2 = valid2 || _valid0;
                const _errs10 = errors;
                if (data3 !== null) {
                  const err0 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                var _valid0 = _errs10 === errors;
                valid2 = valid2 || _valid0;
                if (!valid2) {
                  const err1 = { instancePath: instancePath + "/nextCursor", schemaPath: "#/properties/nextCursor/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                  validate213.errors = vErrors;
                  return false;
                } else {
                  errors = _errs8;
                  if (vErrors !== null) {
                    if (_errs8) {
                      vErrors.length = _errs8;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.coverage !== undefined) {
                  const _errs12 = errors;
                  if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate213.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate213.errors = vErrors;
  return errors === 0;
}
validate213.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateMembersResponse = validate217;
function validate217(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate217.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.items === undefined && (missing0 = "items") || data.coverage === undefined && (missing0 = "coverage")) {
        validate217.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "items" || key0 === "coverage")) {
            validate217.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.items !== undefined) {
            let data0 = data.items;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate184(data0[i0], { instancePath: instancePath + "/items/" + i0, parentData: data0, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate184.errors : vErrors.concat(validate184.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate217.errors = [{ instancePath: instancePath + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.coverage !== undefined) {
              const _errs5 = errors;
              if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate217.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate217.errors = vErrors;
  return errors === 0;
}
validate217.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateProfileResponse = validate220;
function validate220(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate220.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.profile === undefined && (missing0 = "profile") || data.coverage === undefined && (missing0 = "coverage")) {
        validate220.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "profile" || key0 === "coverage")) {
            validate220.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.profile !== undefined) {
            let data0 = data.profile;
            const _errs2 = errors;
            const _errs3 = errors;
            let valid1 = false;
            const _errs4 = errors;
            if (!validate184(data0, { instancePath: instancePath + "/profile", parentData: data, parentDataProperty: "profile", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate184.errors : vErrors.concat(validate184.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs4 === errors;
            valid1 = valid1 || _valid0;
            const _errs5 = errors;
            if (data0 !== null) {
              const err0 = { instancePath: instancePath + "/profile", schemaPath: "#/properties/profile/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
              if (vErrors === null) {
                vErrors = [err0];
              } else {
                vErrors.push(err0);
              }
              errors++;
            }
            var _valid0 = _errs5 === errors;
            valid1 = valid1 || _valid0;
            if (!valid1) {
              const err1 = { instancePath: instancePath + "/profile", schemaPath: "#/properties/profile/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
              validate220.errors = vErrors;
              return false;
            } else {
              errors = _errs3;
              if (vErrors !== null) {
                if (_errs3) {
                  vErrors.length = _errs3;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.coverage !== undefined) {
              const _errs7 = errors;
              if (!validate58(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate220.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate220.errors = vErrors;
  return errors === 0;
}
validate220.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStickerResourceResponse = validate223;
function validate223(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate223.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (typeof data === "string") {
      if (func1(data) < 1) {
        validate223.errors = [{ instancePath, schemaPath: "#/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
        return false;
      }
    } else {
      validate223.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
      return false;
    }
  }
  validate223.errors = vErrors;
  return errors === 0;
}
validate223.evaluated = { dynamicProps: false, dynamicItems: false };
var validateCoreResourcePath = validate186;
var validateCancelUploadRequest = validate224;
function validate224(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate224.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.uploadId === undefined && (missing0 = "uploadId")) {
        validate224.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "roomId" || key0 === "uploadId")) {
            validate224.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.roomId !== undefined) {
            const _errs2 = errors;
            if (!validate53(data.roomId, { instancePath: instancePath + "/roomId", parentData: data, parentDataProperty: "roomId", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.uploadId !== undefined) {
              let data1 = data.uploadId;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (func1(data1) > 512) {
                    validate224.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/maxLength", keyword: "maxLength", params: { limit: 512 }, message: "must NOT have more than 512 characters" }];
                    return false;
                  } else {
                    if (func1(data1) < 1) {
                      validate224.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                      return false;
                    }
                  }
                } else {
                  validate224.errors = [{ instancePath: instancePath + "/uploadId", schemaPath: "#/properties/uploadId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate224.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate224.errors = vErrors;
  return errors === 0;
}
validate224.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
export {
  validateAttachment,
  validateAttachmentsRequest,
  validateAttachmentsResponse,
  validateCancelUploadRequest,
  validateCapabilitiesRequest,
  validateCapabilitiesResponse,
  validateCitation,
  validateConfirmed,
  validateCoreResourcePath,
  validateCoverage,
  validateCursor,
  validateError,
  validateErrorResponse,
  validateFeature,
  validateFriendsRequest,
  validateFriendsResponse,
  validateHistoryRequest,
  validateHistoryResponse,
  validateId,
  validateMediaSend,
  validateMembersRequest,
  validateMembersResponse,
  validateMention,
  validateMessage,
  validateMutationResponse,
  validatePerson,
  validateProfileRequest,
  validateProfileResponse,
  validateQuestionRequest,
  validateQuestionResponse,
  validateReactionRequest,
  validateReadRequest,
  validateReadResponse,
  validateRejected,
  validateRoomId,
  validateSearchHit,
  validateSearchRequest,
  validateSearchResponse,
  validateSendRequest,
  validateSticker,
  validateStickerId,
  validateStickerResourceRequest,
  validateStickerResourceResponse,
  validateStickerSend,
  validateStickersRequest,
  validateStickersResponse,
  validateStoredStickerResourceRequest,
  validateSummaryRequest,
  validateSummaryResponse,
  validateTextSend,
  validateThreadRequest,
  validateThreadResponse,
  validateUnconfirmed,
  validateUnixSeconds,
  validateUploadRequest,
  validateUploadResponse
};
