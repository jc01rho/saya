// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
// contract:validators
var validatePositiveInteger = validate52;
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
  if (!(typeof data == "number" && (!(data % 1) && !isNaN(data)) && isFinite(data))) {
    validate52.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
    return false;
  }
  if (errors === 0) {
    if (typeof data == "number" && isFinite(data)) {
      if (data < 1 || isNaN(data)) {
        validate52.errors = [{ instancePath, schemaPath: "#/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
        return false;
      }
    }
  }
  validate52.errors = vErrors;
  return errors === 0;
}
validate52.evaluated = { dynamicProps: false, dynamicItems: false };
var validateErrorCode = validate53;
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
  if (typeof data !== "string") {
    validate53.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
    return false;
  }
  validate53.errors = vErrors;
  return errors === 0;
}
validate53.evaluated = { dynamicProps: false, dynamicItems: false };
var validateErrorEnvelope = validate54;
function validate54(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate54.evaluated;
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
        validate54.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== false) {
            validate54.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.error !== undefined) {
            let data1 = data.error;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                let missing1;
                if (data1.code === undefined && (missing1 = "code") || data1.message === undefined && (missing1 = "message")) {
                  validate54.errors = [{ instancePath: instancePath + "/error", schemaPath: "#/properties/error/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  if (data1.code !== undefined) {
                    const _errs4 = errors;
                    if (!validate53(data1.code, { instancePath: instancePath + "/error/code", parentData: data1, parentDataProperty: "code", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate53.errors : vErrors.concat(validate53.errors);
                      errors = vErrors.length;
                    }
                    var valid1 = _errs4 === errors;
                  } else {
                    var valid1 = true;
                  }
                  if (valid1) {
                    if (data1.message !== undefined) {
                      const _errs5 = errors;
                      if (typeof data1.message !== "string") {
                        validate54.errors = [{ instancePath: instancePath + "/error/message", schemaPath: "#/properties/error/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                      var valid1 = _errs5 === errors;
                    } else {
                      var valid1 = true;
                    }
                  }
                }
              } else {
                validate54.errors = [{ instancePath: instancePath + "/error", schemaPath: "#/properties/error/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate54.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate54.errors = vErrors;
  return errors === 0;
}
validate54.evaluated = { props: { ok: true, error: true }, dynamicProps: false, dynamicItems: false };
var validateHealth = validate56;
function validate56(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate56.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok")) {
        validate56.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          if (data.ok !== true) {
            validate56.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
        }
      }
    } else {
      validate56.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate56.errors = vErrors;
  return errors === 0;
}
validate56.evaluated = { props: { ok: true }, dynamicProps: false, dynamicItems: false };
var validateCapabilities = validate57;
var pattern3 = new RegExp("^[a-z][a-z0-9-]*$", "u");
var pattern4 = new RegExp("^[0-9a-f]{16}$", "u");
var pattern5 = new RegExp("^x-[a-z][a-z0-9-]*\\.", "u");
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
      if (data["rooms.list"] !== undefined) {
        let data0 = data["rooms.list"];
        const _errs1 = errors;
        if (!(data0 && typeof data0 == "object" && !Array.isArray(data0))) {
          validate58.errors = [{ instancePath: instancePath + "/rooms.list", schemaPath: "#/properties/rooms.list/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
          return false;
        }
        var valid0 = _errs1 === errors;
      } else {
        var valid0 = true;
      }
      if (valid0) {
        if (data["messages.read"] !== undefined) {
          let data1 = data["messages.read"];
          const _errs3 = errors;
          if (errors === _errs3) {
            if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
              let missing0;
              if (data1.paging === undefined && (missing0 = "paging") || data1.maxLimit === undefined && (missing0 = "maxLimit")) {
                validate58.errors = [{ instancePath: instancePath + "/messages.read", schemaPath: "#/properties/messages.read/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
                return false;
              } else {
                if (data1.paging !== undefined) {
                  const _errs5 = errors;
                  if (typeof data1.paging !== "string") {
                    validate58.errors = [{ instancePath: instancePath + "/messages.read/paging", schemaPath: "#/properties/messages.read/properties/paging/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid1 = _errs5 === errors;
                } else {
                  var valid1 = true;
                }
                if (valid1) {
                  if (data1.maxLimit !== undefined) {
                    const _errs7 = errors;
                    if (!validate52(data1.maxLimit, { instancePath: instancePath + "/messages.read/maxLimit", parentData: data1, parentDataProperty: "maxLimit", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                      errors = vErrors.length;
                    }
                    var valid1 = _errs7 === errors;
                  } else {
                    var valid1 = true;
                  }
                }
              }
            } else {
              validate58.errors = [{ instancePath: instancePath + "/messages.read", schemaPath: "#/properties/messages.read/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
              return false;
            }
          }
          var valid0 = _errs3 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data["messages.stream"] !== undefined) {
            let data4 = data["messages.stream"];
            const _errs8 = errors;
            if (errors === _errs8) {
              if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                let missing1;
                if (data4.resume === undefined && (missing1 = "resume")) {
                  validate58.errors = [{ instancePath: instancePath + "/messages.stream", schemaPath: "#/properties/messages.stream/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  if (data4.resume !== undefined) {
                    if (typeof data4.resume !== "string") {
                      validate58.errors = [{ instancePath: instancePath + "/messages.stream/resume", schemaPath: "#/properties/messages.stream/properties/resume/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                }
              } else {
                validate58.errors = [{ instancePath: instancePath + "/messages.stream", schemaPath: "#/properties/messages.stream/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs8 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data["messages.send"] !== undefined) {
              let data6 = data["messages.send"];
              const _errs12 = errors;
              if (errors === _errs12) {
                if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                  let missing2;
                  if (data6.maxLength === undefined && (missing2 = "maxLength") || data6.receipt === undefined && (missing2 = "receipt")) {
                    validate58.errors = [{ instancePath: instancePath + "/messages.send", schemaPath: "#/properties/messages.send/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                    return false;
                  } else {
                    if (data6.maxLength !== undefined) {
                      const _errs14 = errors;
                      if (!validate52(data6.maxLength, { instancePath: instancePath + "/messages.send/maxLength", parentData: data6, parentDataProperty: "maxLength", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                        errors = vErrors.length;
                      }
                      var valid3 = _errs14 === errors;
                    } else {
                      var valid3 = true;
                    }
                    if (valid3) {
                      if (data6.receipt !== undefined) {
                        const _errs15 = errors;
                        if (typeof data6.receipt !== "string") {
                          validate58.errors = [{ instancePath: instancePath + "/messages.send/receipt", schemaPath: "#/properties/messages.send/properties/receipt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                        var valid3 = _errs15 === errors;
                      } else {
                        var valid3 = true;
                      }
                    }
                  }
                } else {
                  validate58.errors = [{ instancePath: instancePath + "/messages.send", schemaPath: "#/properties/messages.send/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid0 = _errs12 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data["messages.reply"] !== undefined) {
                let data9 = data["messages.reply"];
                const _errs17 = errors;
                if (!(data9 && typeof data9 == "object" && !Array.isArray(data9))) {
                  validate58.errors = [{ instancePath: instancePath + "/messages.reply", schemaPath: "#/properties/messages.reply/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
                var valid0 = _errs17 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data["messages.edit"] !== undefined) {
                  let data10 = data["messages.edit"];
                  const _errs19 = errors;
                  if (errors === _errs19) {
                    if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
                      if (data10.maxAgeSeconds !== undefined) {
                        if (!validate52(data10.maxAgeSeconds, { instancePath: instancePath + "/messages.edit/maxAgeSeconds", parentData: data10, parentDataProperty: "maxAgeSeconds", rootData, dynamicAnchors })) {
                          vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                          errors = vErrors.length;
                        }
                      }
                    } else {
                      validate58.errors = [{ instancePath: instancePath + "/messages.edit", schemaPath: "#/properties/messages.edit/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid0 = _errs19 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data["messages.delete"] !== undefined) {
                    let data12 = data["messages.delete"];
                    const _errs22 = errors;
                    if (errors === _errs22) {
                      if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
                        let missing3;
                        if (data12.forEveryone === undefined && (missing3 = "forEveryone")) {
                          validate58.errors = [{ instancePath: instancePath + "/messages.delete", schemaPath: "#/properties/messages.delete/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                          return false;
                        } else {
                          if (data12.forEveryone !== undefined) {
                            if (typeof data12.forEveryone !== "boolean") {
                              validate58.errors = [{ instancePath: instancePath + "/messages.delete/forEveryone", schemaPath: "#/properties/messages.delete/properties/forEveryone/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                              return false;
                            }
                          }
                        }
                      } else {
                        validate58.errors = [{ instancePath: instancePath + "/messages.delete", schemaPath: "#/properties/messages.delete/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
                    }
                    var valid0 = _errs22 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data["reactions.read"] !== undefined) {
                      let data14 = data["reactions.read"];
                      const _errs26 = errors;
                      if (!(data14 && typeof data14 == "object" && !Array.isArray(data14))) {
                        validate58.errors = [{ instancePath: instancePath + "/reactions.read", schemaPath: "#/properties/reactions.read/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
                      var valid0 = _errs26 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data["reactions.send"] !== undefined) {
                        let data15 = data["reactions.send"];
                        const _errs28 = errors;
                        if (errors === _errs28) {
                          if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
                            if (data15.maxPerMessage !== undefined) {
                              if (!validate52(data15.maxPerMessage, { instancePath: instancePath + "/reactions.send/maxPerMessage", parentData: data15, parentDataProperty: "maxPerMessage", rootData, dynamicAnchors })) {
                                vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                                errors = vErrors.length;
                              }
                            }
                          } else {
                            validate58.errors = [{ instancePath: instancePath + "/reactions.send", schemaPath: "#/properties/reactions.send/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid0 = _errs28 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data["read.mark"] !== undefined) {
                          let data17 = data["read.mark"];
                          const _errs31 = errors;
                          if (!(data17 && typeof data17 == "object" && !Array.isArray(data17))) {
                            validate58.errors = [{ instancePath: instancePath + "/read.mark", schemaPath: "#/properties/read.mark/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                          var valid0 = _errs31 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data["typing.send"] !== undefined) {
                            let data18 = data["typing.send"];
                            const _errs33 = errors;
                            if (!(data18 && typeof data18 == "object" && !Array.isArray(data18))) {
                              validate58.errors = [{ instancePath: instancePath + "/typing.send", schemaPath: "#/properties/typing.send/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                            var valid0 = _errs33 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data["threads.read"] !== undefined) {
                              let data19 = data["threads.read"];
                              const _errs35 = errors;
                              if (!(data19 && typeof data19 == "object" && !Array.isArray(data19))) {
                                validate58.errors = [{ instancePath: instancePath + "/threads.read", schemaPath: "#/properties/threads.read/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                return false;
                              }
                              var valid0 = _errs35 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data["attachments.read"] !== undefined) {
                                let data20 = data["attachments.read"];
                                const _errs37 = errors;
                                if (!(data20 && typeof data20 == "object" && !Array.isArray(data20))) {
                                  validate58.errors = [{ instancePath: instancePath + "/attachments.read", schemaPath: "#/properties/attachments.read/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                  return false;
                                }
                                var valid0 = _errs37 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data["attachments.send"] !== undefined) {
                                  let data21 = data["attachments.send"];
                                  const _errs39 = errors;
                                  if (errors === _errs39) {
                                    if (data21 && typeof data21 == "object" && !Array.isArray(data21)) {
                                      let missing4;
                                      if (data21.maxBytes === undefined && (missing4 = "maxBytes") || data21.caption === undefined && (missing4 = "caption")) {
                                        validate58.errors = [{ instancePath: instancePath + "/attachments.send", schemaPath: "#/properties/attachments.send/required", keyword: "required", params: { missingProperty: missing4 }, message: "must have required property '" + missing4 + "'" }];
                                        return false;
                                      } else {
                                        if (data21.maxBytes !== undefined) {
                                          const _errs41 = errors;
                                          if (!validate52(data21.maxBytes, { instancePath: instancePath + "/attachments.send/maxBytes", parentData: data21, parentDataProperty: "maxBytes", rootData, dynamicAnchors })) {
                                            vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                                            errors = vErrors.length;
                                          }
                                          var valid7 = _errs41 === errors;
                                        } else {
                                          var valid7 = true;
                                        }
                                        if (valid7) {
                                          if (data21.caption !== undefined) {
                                            const _errs42 = errors;
                                            if (typeof data21.caption !== "boolean") {
                                              validate58.errors = [{ instancePath: instancePath + "/attachments.send/caption", schemaPath: "#/properties/attachments.send/properties/caption/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                                              return false;
                                            }
                                            var valid7 = _errs42 === errors;
                                          } else {
                                            var valid7 = true;
                                          }
                                        }
                                      }
                                    } else {
                                      validate58.errors = [{ instancePath: instancePath + "/attachments.send", schemaPath: "#/properties/attachments.send/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                      return false;
                                    }
                                  }
                                  var valid0 = _errs39 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  var props0 = {};
                                  props0["rooms.list"] = true;
                                  props0["messages.read"] = true;
                                  props0["messages.stream"] = true;
                                  props0["messages.send"] = true;
                                  props0["messages.reply"] = true;
                                  props0["messages.edit"] = true;
                                  props0["messages.delete"] = true;
                                  props0["reactions.read"] = true;
                                  props0["reactions.send"] = true;
                                  props0["read.mark"] = true;
                                  props0["typing.send"] = true;
                                  props0["threads.read"] = true;
                                  props0["attachments.read"] = true;
                                  props0["attachments.send"] = true;
                                  for (const key0 in data) {
                                    if (pattern5.test(key0)) {
                                      let data24 = data[key0];
                                      if (!(data24 && typeof data24 == "object" && !Array.isArray(data24))) {
                                        validate58.errors = [{ instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/patternProperties/%5Ex-%5Ba-z%5D%5Ba-z0-9-%5D*%5C./type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                        return false;
                                      }
                                      props0[key0] = true;
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
      }
    } else {
      validate58.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate58.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate58.evaluated = { dynamicProps: true, dynamicItems: false };
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
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.contract === undefined && (missing0 = "contract") || data.adapter === undefined && (missing0 = "adapter") || data.provider === undefined && (missing0 = "provider") || data.account === undefined && (missing0 = "account") || data.revision === undefined && (missing0 = "revision") || data.features === undefined && (missing0 = "features")) {
        validate57.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate57.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.contract !== undefined) {
            let data1 = data.contract;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                let missing1;
                if (data1.version === undefined && (missing1 = "version")) {
                  validate57.errors = [{ instancePath: instancePath + "/contract", schemaPath: "#/properties/contract/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  if (data1.version !== undefined) {
                    if (typeof data1.version !== "string") {
                      validate57.errors = [{ instancePath: instancePath + "/contract/version", schemaPath: "#/properties/contract/properties/version/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                }
              } else {
                validate57.errors = [{ instancePath: instancePath + "/contract", schemaPath: "#/properties/contract/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.adapter !== undefined) {
              let data3 = data.adapter;
              const _errs6 = errors;
              if (errors === _errs6) {
                if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                  let missing2;
                  if (data3.name === undefined && (missing2 = "name") || data3.version === undefined && (missing2 = "version")) {
                    validate57.errors = [{ instancePath: instancePath + "/adapter", schemaPath: "#/properties/adapter/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                    return false;
                  } else {
                    if (data3.name !== undefined) {
                      const _errs8 = errors;
                      if (typeof data3.name !== "string") {
                        validate57.errors = [{ instancePath: instancePath + "/adapter/name", schemaPath: "#/properties/adapter/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                      var valid2 = _errs8 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data3.version !== undefined) {
                        const _errs10 = errors;
                        if (typeof data3.version !== "string") {
                          validate57.errors = [{ instancePath: instancePath + "/adapter/version", schemaPath: "#/properties/adapter/properties/version/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                        var valid2 = _errs10 === errors;
                      } else {
                        var valid2 = true;
                      }
                    }
                  }
                } else {
                  validate57.errors = [{ instancePath: instancePath + "/adapter", schemaPath: "#/properties/adapter/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.provider !== undefined) {
                let data6 = data.provider;
                const _errs12 = errors;
                if (errors === _errs12) {
                  if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                    let missing3;
                    if (data6.id === undefined && (missing3 = "id") || data6.name === undefined && (missing3 = "name")) {
                      validate57.errors = [{ instancePath: instancePath + "/provider", schemaPath: "#/properties/provider/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                      return false;
                    } else {
                      if (data6.id !== undefined) {
                        let data7 = data6.id;
                        const _errs14 = errors;
                        if (errors === _errs14) {
                          if (typeof data7 === "string") {
                            if (!pattern3.test(data7)) {
                              validate57.errors = [{ instancePath: instancePath + "/provider/id", schemaPath: "#/properties/provider/properties/id/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9-]*$" }, message: 'must match pattern "' + "^[a-z][a-z0-9-]*$" + '"' }];
                              return false;
                            }
                          } else {
                            validate57.errors = [{ instancePath: instancePath + "/provider/id", schemaPath: "#/properties/provider/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                        }
                        var valid3 = _errs14 === errors;
                      } else {
                        var valid3 = true;
                      }
                      if (valid3) {
                        if (data6.name !== undefined) {
                          const _errs16 = errors;
                          if (typeof data6.name !== "string") {
                            validate57.errors = [{ instancePath: instancePath + "/provider/name", schemaPath: "#/properties/provider/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                          var valid3 = _errs16 === errors;
                        } else {
                          var valid3 = true;
                        }
                      }
                    }
                  } else {
                    validate57.errors = [{ instancePath: instancePath + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                    return false;
                  }
                }
                var valid0 = _errs12 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.account !== undefined) {
                  let data9 = data.account;
                  const _errs18 = errors;
                  if (errors === _errs18) {
                    if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                      let missing4;
                      if (data9.kind === undefined && (missing4 = "kind")) {
                        validate57.errors = [{ instancePath: instancePath + "/account", schemaPath: "#/properties/account/required", keyword: "required", params: { missingProperty: missing4 }, message: "must have required property '" + missing4 + "'" }];
                        return false;
                      } else {
                        if (data9.kind !== undefined) {
                          if (typeof data9.kind !== "string") {
                            validate57.errors = [{ instancePath: instancePath + "/account/kind", schemaPath: "#/properties/account/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                        }
                      }
                    } else {
                      validate57.errors = [{ instancePath: instancePath + "/account", schemaPath: "#/properties/account/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid0 = _errs18 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.revision !== undefined) {
                    let data11 = data.revision;
                    const _errs22 = errors;
                    if (errors === _errs22) {
                      if (typeof data11 === "string") {
                        if (!pattern4.test(data11)) {
                          validate57.errors = [{ instancePath: instancePath + "/revision", schemaPath: "#/properties/revision/pattern", keyword: "pattern", params: { pattern: "^[0-9a-f]{16}$" }, message: 'must match pattern "' + "^[0-9a-f]{16}$" + '"' }];
                          return false;
                        }
                      } else {
                        validate57.errors = [{ instancePath: instancePath + "/revision", schemaPath: "#/properties/revision/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs22 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.features !== undefined) {
                      const _errs24 = errors;
                      if (!validate58(data.features, { instancePath: instancePath + "/features", parentData: data, parentDataProperty: "features", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs24 === errors;
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
      validate57.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate57.errors = vErrors;
  return errors === 0;
}
validate57.evaluated = { props: { ok: true, contract: true, adapter: true, provider: true, account: true, revision: true, features: true }, dynamicProps: false, dynamicItems: false };
var validateFeatures = validate58;
export {
  validateCapabilities,
  validateErrorCode,
  validateErrorEnvelope,
  validateFeatures,
  validateHealth,
  validatePositiveInteger
};
