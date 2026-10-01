// Generated from contracts/tsuba.openapi.json by bun run contract:generate. Do not edit.
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

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatNames = exports.fastFormats = exports.fullFormats = undefined;
  function fmtDef(validate, compare) {
    return { validate, compare };
  }
  exports.fullFormats = {
    date: fmtDef(date, compareDate),
    time: fmtDef(getTime(true), compareTime),
    "date-time": fmtDef(getDateTime(true), compareDateTime),
    "iso-time": fmtDef(getTime(), compareIsoTime),
    "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex,
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    byte,
    int32: { type: "number", validate: validateInt32 },
    int64: { type: "number", validate: validateInt64 },
    float: { type: "number", validate: validateNumber },
    double: { type: "number", validate: validateNumber },
    password: true,
    binary: true
  };
  exports.fastFormats = {
    ...exports.fullFormats,
    date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
    time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
    "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
    "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
    "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  };
  exports.formatNames = Object.keys(exports.fullFormats);
  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function date(str) {
    const matches = DATE.exec(str);
    if (!matches)
      return false;
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  }
  function compareDate(d1, d2) {
    if (!(d1 && d2))
      return;
    if (d1 > d2)
      return 1;
    if (d1 < d2)
      return -1;
    return 0;
  }
  var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function getTime(strictTimeZone) {
    return function time(str) {
      const matches = TIME.exec(str);
      if (!matches)
        return false;
      const hr = +matches[1];
      const min = +matches[2];
      const sec = +matches[3];
      const tz = matches[4];
      const tzSign = matches[5] === "-" ? -1 : 1;
      const tzH = +(matches[6] || 0);
      const tzM = +(matches[7] || 0);
      if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
        return false;
      if (hr <= 23 && min <= 59 && sec < 60)
        return true;
      const utcMin = min - tzM * tzSign;
      const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
      return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
    };
  }
  function compareTime(s1, s2) {
    if (!(s1 && s2))
      return;
    const t1 = new Date("2020-01-01T" + s1).valueOf();
    const t2 = new Date("2020-01-01T" + s2).valueOf();
    if (!(t1 && t2))
      return;
    return t1 - t2;
  }
  function compareIsoTime(t1, t2) {
    if (!(t1 && t2))
      return;
    const a1 = TIME.exec(t1);
    const a2 = TIME.exec(t2);
    if (!(a1 && a2))
      return;
    t1 = a1[1] + a1[2] + a1[3];
    t2 = a2[1] + a2[2] + a2[3];
    if (t1 > t2)
      return 1;
    if (t1 < t2)
      return -1;
    return 0;
  }
  var DATE_TIME_SEPARATOR = /t|\s/i;
  function getDateTime(strictTimeZone) {
    const time = getTime(strictTimeZone);
    return function date_time(str) {
      const dateTime = str.split(DATE_TIME_SEPARATOR);
      return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
    };
  }
  function compareDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const d1 = new Date(dt1).valueOf();
    const d2 = new Date(dt2).valueOf();
    if (!(d1 && d2))
      return;
    return d1 - d2;
  }
  function compareIsoDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
    const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
    const res = compareDate(d1, d2);
    if (res === undefined)
      return;
    return res || compareTime(t1, t2);
  }
  var NOT_URI_FRAGMENT = /\/|:/;
  var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function uri(str) {
    return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  }
  var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function byte(str) {
    BYTE.lastIndex = 0;
    return BYTE.test(str);
  }
  var MIN_INT32 = -(2 ** 31);
  var MAX_INT32 = 2 ** 31 - 1;
  function validateInt32(value) {
    return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  }
  function validateInt64(value) {
    return Number.isInteger(value);
  }
  function validateNumber() {
    return true;
  }
  var Z_ANCHOR = /[^\\]\\Z/;
  function regex(str) {
    if (Z_ANCHOR.test(str))
      return false;
    try {
      new RegExp(str);
      return true;
    } catch (e) {
      return false;
    }
  }
});

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
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate59.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate59.errors = vErrors;
  return errors === 0;
}
validate59.evaluated = { dynamicProps: false, dynamicItems: false };
function validate61(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate61.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.paging === undefined && (missing0 = "paging") || data.maxLimit === undefined && (missing0 = "maxLimit")) {
        validate61.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.paging !== undefined) {
          const _errs1 = errors;
          if (typeof data.paging !== "string") {
            validate61.errors = [{ instancePath: instancePath + "/paging", schemaPath: "#/properties/paging/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.maxLimit !== undefined) {
            const _errs3 = errors;
            if (!validate52(data.maxLimit, { instancePath: instancePath + "/maxLimit", parentData: data, parentDataProperty: "maxLimit", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate61.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate61.errors = vErrors;
  return errors === 0;
}
validate61.evaluated = { props: { paging: true, maxLimit: true }, dynamicProps: false, dynamicItems: false };
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
      if (data.resume === undefined && (missing0 = "resume")) {
        validate64.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.resume !== undefined) {
          if (typeof data.resume !== "string") {
            validate64.errors = [{ instancePath: instancePath + "/resume", schemaPath: "#/properties/resume/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
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
validate64.evaluated = { props: { resume: true }, dynamicProps: false, dynamicItems: false };
function validate66(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate66.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.maxLength === undefined && (missing0 = "maxLength") || data.receipt === undefined && (missing0 = "receipt")) {
        validate66.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.maxLength !== undefined) {
          const _errs1 = errors;
          if (!validate52(data.maxLength, { instancePath: instancePath + "/maxLength", parentData: data, parentDataProperty: "maxLength", rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.receipt !== undefined) {
            const _errs2 = errors;
            if (typeof data.receipt !== "string") {
              validate66.errors = [{ instancePath: instancePath + "/receipt", schemaPath: "#/properties/receipt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate66.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate66.errors = vErrors;
  return errors === 0;
}
validate66.evaluated = { props: { maxLength: true, receipt: true }, dynamicProps: false, dynamicItems: false };
function validate69(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate69.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate69.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate69.errors = vErrors;
  return errors === 0;
}
validate69.evaluated = { dynamicProps: false, dynamicItems: false };
function validate71(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate71.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.maxAgeSeconds !== undefined) {
        if (!validate52(data.maxAgeSeconds, { instancePath: instancePath + "/maxAgeSeconds", parentData: data, parentDataProperty: "maxAgeSeconds", rootData, dynamicAnchors })) {
          vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
          errors = vErrors.length;
        }
      }
    } else {
      validate71.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate71.errors = vErrors;
  return errors === 0;
}
validate71.evaluated = { props: { maxAgeSeconds: true }, dynamicProps: false, dynamicItems: false };
function validate74(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate74.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.forEveryone === undefined && (missing0 = "forEveryone")) {
        validate74.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.forEveryone !== undefined) {
          if (typeof data.forEveryone !== "boolean") {
            validate74.errors = [{ instancePath: instancePath + "/forEveryone", schemaPath: "#/properties/forEveryone/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
            return false;
          }
        }
      }
    } else {
      validate74.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate74.errors = vErrors;
  return errors === 0;
}
validate74.evaluated = { props: { forEveryone: true }, dynamicProps: false, dynamicItems: false };
function validate76(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate76.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate76.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate76.errors = vErrors;
  return errors === 0;
}
validate76.evaluated = { dynamicProps: false, dynamicItems: false };
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
      if (data.maxPerMessage !== undefined) {
        if (!validate52(data.maxPerMessage, { instancePath: instancePath + "/maxPerMessage", parentData: data, parentDataProperty: "maxPerMessage", rootData, dynamicAnchors })) {
          vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
          errors = vErrors.length;
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
validate78.evaluated = { props: { maxPerMessage: true }, dynamicProps: false, dynamicItems: false };
function validate81(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate81.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate81.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate81.errors = vErrors;
  return errors === 0;
}
validate81.evaluated = { dynamicProps: false, dynamicItems: false };
function validate83(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate83.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate83.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate83.errors = vErrors;
  return errors === 0;
}
validate83.evaluated = { dynamicProps: false, dynamicItems: false };
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
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate85.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate85.errors = vErrors;
  return errors === 0;
}
validate85.evaluated = { dynamicProps: false, dynamicItems: false };
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
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate87.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
    return false;
  }
  validate87.errors = vErrors;
  return errors === 0;
}
validate87.evaluated = { dynamicProps: false, dynamicItems: false };
function validate89(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate89.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.maxBytes === undefined && (missing0 = "maxBytes") || data.caption === undefined && (missing0 = "caption")) {
        validate89.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.maxBytes !== undefined) {
          const _errs1 = errors;
          if (!validate52(data.maxBytes, { instancePath: instancePath + "/maxBytes", parentData: data, parentDataProperty: "maxBytes", rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.caption !== undefined) {
            const _errs2 = errors;
            if (typeof data.caption !== "boolean") {
              validate89.errors = [{ instancePath: instancePath + "/caption", schemaPath: "#/properties/caption/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate89.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate89.errors = vErrors;
  return errors === 0;
}
validate89.evaluated = { props: { maxBytes: true, caption: true }, dynamicProps: false, dynamicItems: false };
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
        const _errs1 = errors;
        if (!validate59(data["rooms.list"], { instancePath: instancePath + "/rooms.list", parentData: data, parentDataProperty: "rooms.list", rootData, dynamicAnchors })) {
          vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
          errors = vErrors.length;
        }
        var valid0 = _errs1 === errors;
      } else {
        var valid0 = true;
      }
      if (valid0) {
        if (data["messages.read"] !== undefined) {
          const _errs2 = errors;
          if (!validate61(data["messages.read"], { instancePath: instancePath + "/messages.read", parentData: data, parentDataProperty: "messages.read", rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate61.errors : vErrors.concat(validate61.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data["messages.stream"] !== undefined) {
            const _errs3 = errors;
            if (!validate64(data["messages.stream"], { instancePath: instancePath + "/messages.stream", parentData: data, parentDataProperty: "messages.stream", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data["messages.send"] !== undefined) {
              const _errs4 = errors;
              if (!validate66(data["messages.send"], { instancePath: instancePath + "/messages.send", parentData: data, parentDataProperty: "messages.send", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data["messages.reply"] !== undefined) {
                const _errs5 = errors;
                if (!validate69(data["messages.reply"], { instancePath: instancePath + "/messages.reply", parentData: data, parentDataProperty: "messages.reply", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
                  errors = vErrors.length;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data["messages.edit"] !== undefined) {
                  const _errs6 = errors;
                  if (!validate71(data["messages.edit"], { instancePath: instancePath + "/messages.edit", parentData: data, parentDataProperty: "messages.edit", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data["messages.delete"] !== undefined) {
                    const _errs7 = errors;
                    if (!validate74(data["messages.delete"], { instancePath: instancePath + "/messages.delete", parentData: data, parentDataProperty: "messages.delete", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate74.errors : vErrors.concat(validate74.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs7 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data["reactions.read"] !== undefined) {
                      const _errs8 = errors;
                      if (!validate76(data["reactions.read"], { instancePath: instancePath + "/reactions.read", parentData: data, parentDataProperty: "reactions.read", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs8 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data["reactions.send"] !== undefined) {
                        const _errs9 = errors;
                        if (!validate78(data["reactions.send"], { instancePath: instancePath + "/reactions.send", parentData: data, parentDataProperty: "reactions.send", rootData, dynamicAnchors })) {
                          vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
                          errors = vErrors.length;
                        }
                        var valid0 = _errs9 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data["read.mark"] !== undefined) {
                          const _errs10 = errors;
                          if (!validate81(data["read.mark"], { instancePath: instancePath + "/read.mark", parentData: data, parentDataProperty: "read.mark", rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate81.errors : vErrors.concat(validate81.errors);
                            errors = vErrors.length;
                          }
                          var valid0 = _errs10 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data["typing.send"] !== undefined) {
                            const _errs11 = errors;
                            if (!validate83(data["typing.send"], { instancePath: instancePath + "/typing.send", parentData: data, parentDataProperty: "typing.send", rootData, dynamicAnchors })) {
                              vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
                              errors = vErrors.length;
                            }
                            var valid0 = _errs11 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data["threads.read"] !== undefined) {
                              const _errs12 = errors;
                              if (!validate85(data["threads.read"], { instancePath: instancePath + "/threads.read", parentData: data, parentDataProperty: "threads.read", rootData, dynamicAnchors })) {
                                vErrors = vErrors === null ? validate85.errors : vErrors.concat(validate85.errors);
                                errors = vErrors.length;
                              }
                              var valid0 = _errs12 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data["attachments.read"] !== undefined) {
                                const _errs13 = errors;
                                if (!validate87(data["attachments.read"], { instancePath: instancePath + "/attachments.read", parentData: data, parentDataProperty: "attachments.read", rootData, dynamicAnchors })) {
                                  vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
                                  errors = vErrors.length;
                                }
                                var valid0 = _errs13 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data["attachments.send"] !== undefined) {
                                  const _errs14 = errors;
                                  if (!validate89(data["attachments.send"], { instancePath: instancePath + "/attachments.send", parentData: data, parentDataProperty: "attachments.send", rootData, dynamicAnchors })) {
                                    vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid0 = _errs14 === errors;
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
                                      let data14 = data[key0];
                                      if (!(data14 && typeof data14 == "object" && !Array.isArray(data14))) {
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
var validateFeatureRoomsList = validate59;
var validateFeatureMessagesRead = validate61;
var validateFeatureMessagesStream = validate64;
var validateFeatureMessagesSend = validate66;
var validateFeatureMessagesReply = validate69;
var validateFeatureMessagesEdit = validate71;
var validateFeatureMessagesDelete = validate74;
var validateFeatureReactionsRead = validate76;
var validateFeatureReactionsSend = validate78;
var validateFeatureReadMark = validate81;
var validateFeatureTypingSend = validate83;
var validateFeatureThreadsRead = validate85;
var validateFeatureAttachmentsRead = validate87;
var validateFeatureAttachmentsSend = validate89;
var validateRoomFeatures = validate93;
function validate93(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate93.evaluated;
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
        const _errs2 = errors;
        let valid1 = false;
        const _errs3 = errors;
        if (data0 !== false) {
          const err0 = { instancePath: instancePath + "/rooms.list", schemaPath: "#/properties/rooms.list/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
          if (vErrors === null) {
            vErrors = [err0];
          } else {
            vErrors.push(err0);
          }
          errors++;
        }
        var _valid0 = _errs3 === errors;
        valid1 = valid1 || _valid0;
        const _errs4 = errors;
        if (!validate59(data0, { instancePath: instancePath + "/rooms.list", parentData: data, parentDataProperty: "rooms.list", rootData, dynamicAnchors })) {
          vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
          errors = vErrors.length;
        }
        var _valid0 = _errs4 === errors;
        valid1 = valid1 || _valid0;
        if (!valid1) {
          const err1 = { instancePath: instancePath + "/rooms.list", schemaPath: "#/properties/rooms.list/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
          validate93.errors = vErrors;
          return false;
        } else {
          errors = _errs2;
          if (vErrors !== null) {
            if (_errs2) {
              vErrors.length = _errs2;
            } else {
              vErrors = null;
            }
          }
        }
        var valid0 = _errs1 === errors;
      } else {
        var valid0 = true;
      }
      if (valid0) {
        if (data["messages.read"] !== undefined) {
          let data1 = data["messages.read"];
          const _errs5 = errors;
          const _errs6 = errors;
          let valid2 = false;
          const _errs7 = errors;
          if (data1 !== false) {
            const err2 = { instancePath: instancePath + "/messages.read", schemaPath: "#/properties/messages.read/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          var _valid1 = _errs7 === errors;
          valid2 = valid2 || _valid1;
          const _errs8 = errors;
          if (!validate61(data1, { instancePath: instancePath + "/messages.read", parentData: data, parentDataProperty: "messages.read", rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate61.errors : vErrors.concat(validate61.errors);
            errors = vErrors.length;
          }
          var _valid1 = _errs8 === errors;
          valid2 = valid2 || _valid1;
          if (_valid1) {
            var props0 = {};
            props0.paging = true;
            props0.maxLimit = true;
          }
          if (!valid2) {
            const err3 = { instancePath: instancePath + "/messages.read", schemaPath: "#/properties/messages.read/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
            validate93.errors = vErrors;
            return false;
          } else {
            errors = _errs6;
            if (vErrors !== null) {
              if (_errs6) {
                vErrors.length = _errs6;
              } else {
                vErrors = null;
              }
            }
          }
          var valid0 = _errs5 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data["messages.stream"] !== undefined) {
            let data2 = data["messages.stream"];
            const _errs9 = errors;
            const _errs10 = errors;
            let valid3 = false;
            const _errs11 = errors;
            if (data2 !== false) {
              const err4 = { instancePath: instancePath + "/messages.stream", schemaPath: "#/properties/messages.stream/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            var _valid2 = _errs11 === errors;
            valid3 = valid3 || _valid2;
            const _errs12 = errors;
            if (!validate64(data2, { instancePath: instancePath + "/messages.stream", parentData: data, parentDataProperty: "messages.stream", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
              errors = vErrors.length;
            }
            var _valid2 = _errs12 === errors;
            valid3 = valid3 || _valid2;
            if (_valid2) {
              var props1 = {};
              props1.resume = true;
            }
            if (!valid3) {
              const err5 = { instancePath: instancePath + "/messages.stream", schemaPath: "#/properties/messages.stream/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
              validate93.errors = vErrors;
              return false;
            } else {
              errors = _errs10;
              if (vErrors !== null) {
                if (_errs10) {
                  vErrors.length = _errs10;
                } else {
                  vErrors = null;
                }
              }
            }
            var valid0 = _errs9 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data["messages.send"] !== undefined) {
              let data3 = data["messages.send"];
              const _errs13 = errors;
              const _errs14 = errors;
              let valid4 = false;
              const _errs15 = errors;
              if (data3 !== false) {
                const err6 = { instancePath: instancePath + "/messages.send", schemaPath: "#/properties/messages.send/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err6];
                } else {
                  vErrors.push(err6);
                }
                errors++;
              }
              var _valid3 = _errs15 === errors;
              valid4 = valid4 || _valid3;
              const _errs16 = errors;
              if (!validate66(data3, { instancePath: instancePath + "/messages.send", parentData: data, parentDataProperty: "messages.send", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
                errors = vErrors.length;
              }
              var _valid3 = _errs16 === errors;
              valid4 = valid4 || _valid3;
              if (_valid3) {
                var props2 = {};
                props2.maxLength = true;
                props2.receipt = true;
              }
              if (!valid4) {
                const err7 = { instancePath: instancePath + "/messages.send", schemaPath: "#/properties/messages.send/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
                validate93.errors = vErrors;
                return false;
              } else {
                errors = _errs14;
                if (vErrors !== null) {
                  if (_errs14) {
                    vErrors.length = _errs14;
                  } else {
                    vErrors = null;
                  }
                }
              }
              var valid0 = _errs13 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data["messages.reply"] !== undefined) {
                let data4 = data["messages.reply"];
                const _errs17 = errors;
                const _errs18 = errors;
                let valid5 = false;
                const _errs19 = errors;
                if (data4 !== false) {
                  const err8 = { instancePath: instancePath + "/messages.reply", schemaPath: "#/properties/messages.reply/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                var _valid4 = _errs19 === errors;
                valid5 = valid5 || _valid4;
                const _errs20 = errors;
                if (!validate69(data4, { instancePath: instancePath + "/messages.reply", parentData: data, parentDataProperty: "messages.reply", rootData, dynamicAnchors })) {
                  vErrors = vErrors === null ? validate69.errors : vErrors.concat(validate69.errors);
                  errors = vErrors.length;
                }
                var _valid4 = _errs20 === errors;
                valid5 = valid5 || _valid4;
                if (!valid5) {
                  const err9 = { instancePath: instancePath + "/messages.reply", schemaPath: "#/properties/messages.reply/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                  validate93.errors = vErrors;
                  return false;
                } else {
                  errors = _errs18;
                  if (vErrors !== null) {
                    if (_errs18) {
                      vErrors.length = _errs18;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs17 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data["messages.edit"] !== undefined) {
                  let data5 = data["messages.edit"];
                  const _errs21 = errors;
                  const _errs22 = errors;
                  let valid6 = false;
                  const _errs23 = errors;
                  if (data5 !== false) {
                    const err10 = { instancePath: instancePath + "/messages.edit", schemaPath: "#/properties/messages.edit/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                    if (vErrors === null) {
                      vErrors = [err10];
                    } else {
                      vErrors.push(err10);
                    }
                    errors++;
                  }
                  var _valid5 = _errs23 === errors;
                  valid6 = valid6 || _valid5;
                  const _errs24 = errors;
                  if (!validate71(data5, { instancePath: instancePath + "/messages.edit", parentData: data, parentDataProperty: "messages.edit", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
                    errors = vErrors.length;
                  }
                  var _valid5 = _errs24 === errors;
                  valid6 = valid6 || _valid5;
                  if (_valid5) {
                    var props3 = {};
                    props3.maxAgeSeconds = true;
                  }
                  if (!valid6) {
                    const err11 = { instancePath: instancePath + "/messages.edit", schemaPath: "#/properties/messages.edit/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                    if (vErrors === null) {
                      vErrors = [err11];
                    } else {
                      vErrors.push(err11);
                    }
                    errors++;
                    validate93.errors = vErrors;
                    return false;
                  } else {
                    errors = _errs22;
                    if (vErrors !== null) {
                      if (_errs22) {
                        vErrors.length = _errs22;
                      } else {
                        vErrors = null;
                      }
                    }
                  }
                  var valid0 = _errs21 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data["messages.delete"] !== undefined) {
                    let data6 = data["messages.delete"];
                    const _errs25 = errors;
                    const _errs26 = errors;
                    let valid7 = false;
                    const _errs27 = errors;
                    if (data6 !== false) {
                      const err12 = { instancePath: instancePath + "/messages.delete", schemaPath: "#/properties/messages.delete/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                      if (vErrors === null) {
                        vErrors = [err12];
                      } else {
                        vErrors.push(err12);
                      }
                      errors++;
                    }
                    var _valid6 = _errs27 === errors;
                    valid7 = valid7 || _valid6;
                    const _errs28 = errors;
                    if (!validate74(data6, { instancePath: instancePath + "/messages.delete", parentData: data, parentDataProperty: "messages.delete", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate74.errors : vErrors.concat(validate74.errors);
                      errors = vErrors.length;
                    }
                    var _valid6 = _errs28 === errors;
                    valid7 = valid7 || _valid6;
                    if (_valid6) {
                      var props4 = {};
                      props4.forEveryone = true;
                    }
                    if (!valid7) {
                      const err13 = { instancePath: instancePath + "/messages.delete", schemaPath: "#/properties/messages.delete/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                      if (vErrors === null) {
                        vErrors = [err13];
                      } else {
                        vErrors.push(err13);
                      }
                      errors++;
                      validate93.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs26;
                      if (vErrors !== null) {
                        if (_errs26) {
                          vErrors.length = _errs26;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid0 = _errs25 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data["reactions.read"] !== undefined) {
                      let data7 = data["reactions.read"];
                      const _errs29 = errors;
                      const _errs30 = errors;
                      let valid8 = false;
                      const _errs31 = errors;
                      if (data7 !== false) {
                        const err14 = { instancePath: instancePath + "/reactions.read", schemaPath: "#/properties/reactions.read/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                        if (vErrors === null) {
                          vErrors = [err14];
                        } else {
                          vErrors.push(err14);
                        }
                        errors++;
                      }
                      var _valid7 = _errs31 === errors;
                      valid8 = valid8 || _valid7;
                      const _errs32 = errors;
                      if (!validate76(data7, { instancePath: instancePath + "/reactions.read", parentData: data, parentDataProperty: "reactions.read", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
                        errors = vErrors.length;
                      }
                      var _valid7 = _errs32 === errors;
                      valid8 = valid8 || _valid7;
                      if (!valid8) {
                        const err15 = { instancePath: instancePath + "/reactions.read", schemaPath: "#/properties/reactions.read/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                        if (vErrors === null) {
                          vErrors = [err15];
                        } else {
                          vErrors.push(err15);
                        }
                        errors++;
                        validate93.errors = vErrors;
                        return false;
                      } else {
                        errors = _errs30;
                        if (vErrors !== null) {
                          if (_errs30) {
                            vErrors.length = _errs30;
                          } else {
                            vErrors = null;
                          }
                        }
                      }
                      var valid0 = _errs29 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data["reactions.send"] !== undefined) {
                        let data8 = data["reactions.send"];
                        const _errs33 = errors;
                        const _errs34 = errors;
                        let valid9 = false;
                        const _errs35 = errors;
                        if (data8 !== false) {
                          const err16 = { instancePath: instancePath + "/reactions.send", schemaPath: "#/properties/reactions.send/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                          if (vErrors === null) {
                            vErrors = [err16];
                          } else {
                            vErrors.push(err16);
                          }
                          errors++;
                        }
                        var _valid8 = _errs35 === errors;
                        valid9 = valid9 || _valid8;
                        const _errs36 = errors;
                        if (!validate78(data8, { instancePath: instancePath + "/reactions.send", parentData: data, parentDataProperty: "reactions.send", rootData, dynamicAnchors })) {
                          vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
                          errors = vErrors.length;
                        }
                        var _valid8 = _errs36 === errors;
                        valid9 = valid9 || _valid8;
                        if (_valid8) {
                          var props5 = {};
                          props5.maxPerMessage = true;
                        }
                        if (!valid9) {
                          const err17 = { instancePath: instancePath + "/reactions.send", schemaPath: "#/properties/reactions.send/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                          if (vErrors === null) {
                            vErrors = [err17];
                          } else {
                            vErrors.push(err17);
                          }
                          errors++;
                          validate93.errors = vErrors;
                          return false;
                        } else {
                          errors = _errs34;
                          if (vErrors !== null) {
                            if (_errs34) {
                              vErrors.length = _errs34;
                            } else {
                              vErrors = null;
                            }
                          }
                        }
                        var valid0 = _errs33 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data["read.mark"] !== undefined) {
                          let data9 = data["read.mark"];
                          const _errs37 = errors;
                          const _errs38 = errors;
                          let valid10 = false;
                          const _errs39 = errors;
                          if (data9 !== false) {
                            const err18 = { instancePath: instancePath + "/read.mark", schemaPath: "#/properties/read.mark/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                            if (vErrors === null) {
                              vErrors = [err18];
                            } else {
                              vErrors.push(err18);
                            }
                            errors++;
                          }
                          var _valid9 = _errs39 === errors;
                          valid10 = valid10 || _valid9;
                          const _errs40 = errors;
                          if (!validate81(data9, { instancePath: instancePath + "/read.mark", parentData: data, parentDataProperty: "read.mark", rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate81.errors : vErrors.concat(validate81.errors);
                            errors = vErrors.length;
                          }
                          var _valid9 = _errs40 === errors;
                          valid10 = valid10 || _valid9;
                          if (!valid10) {
                            const err19 = { instancePath: instancePath + "/read.mark", schemaPath: "#/properties/read.mark/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                            if (vErrors === null) {
                              vErrors = [err19];
                            } else {
                              vErrors.push(err19);
                            }
                            errors++;
                            validate93.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs38;
                            if (vErrors !== null) {
                              if (_errs38) {
                                vErrors.length = _errs38;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid0 = _errs37 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data["typing.send"] !== undefined) {
                            let data10 = data["typing.send"];
                            const _errs41 = errors;
                            const _errs42 = errors;
                            let valid11 = false;
                            const _errs43 = errors;
                            if (data10 !== false) {
                              const err20 = { instancePath: instancePath + "/typing.send", schemaPath: "#/properties/typing.send/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                              if (vErrors === null) {
                                vErrors = [err20];
                              } else {
                                vErrors.push(err20);
                              }
                              errors++;
                            }
                            var _valid10 = _errs43 === errors;
                            valid11 = valid11 || _valid10;
                            const _errs44 = errors;
                            if (!validate83(data10, { instancePath: instancePath + "/typing.send", parentData: data, parentDataProperty: "typing.send", rootData, dynamicAnchors })) {
                              vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
                              errors = vErrors.length;
                            }
                            var _valid10 = _errs44 === errors;
                            valid11 = valid11 || _valid10;
                            if (!valid11) {
                              const err21 = { instancePath: instancePath + "/typing.send", schemaPath: "#/properties/typing.send/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                              if (vErrors === null) {
                                vErrors = [err21];
                              } else {
                                vErrors.push(err21);
                              }
                              errors++;
                              validate93.errors = vErrors;
                              return false;
                            } else {
                              errors = _errs42;
                              if (vErrors !== null) {
                                if (_errs42) {
                                  vErrors.length = _errs42;
                                } else {
                                  vErrors = null;
                                }
                              }
                            }
                            var valid0 = _errs41 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data["threads.read"] !== undefined) {
                              let data11 = data["threads.read"];
                              const _errs45 = errors;
                              const _errs46 = errors;
                              let valid12 = false;
                              const _errs47 = errors;
                              if (data11 !== false) {
                                const err22 = { instancePath: instancePath + "/threads.read", schemaPath: "#/properties/threads.read/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                                if (vErrors === null) {
                                  vErrors = [err22];
                                } else {
                                  vErrors.push(err22);
                                }
                                errors++;
                              }
                              var _valid11 = _errs47 === errors;
                              valid12 = valid12 || _valid11;
                              const _errs48 = errors;
                              if (!validate85(data11, { instancePath: instancePath + "/threads.read", parentData: data, parentDataProperty: "threads.read", rootData, dynamicAnchors })) {
                                vErrors = vErrors === null ? validate85.errors : vErrors.concat(validate85.errors);
                                errors = vErrors.length;
                              }
                              var _valid11 = _errs48 === errors;
                              valid12 = valid12 || _valid11;
                              if (!valid12) {
                                const err23 = { instancePath: instancePath + "/threads.read", schemaPath: "#/properties/threads.read/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                if (vErrors === null) {
                                  vErrors = [err23];
                                } else {
                                  vErrors.push(err23);
                                }
                                errors++;
                                validate93.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs46;
                                if (vErrors !== null) {
                                  if (_errs46) {
                                    vErrors.length = _errs46;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid0 = _errs45 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data["attachments.read"] !== undefined) {
                                let data12 = data["attachments.read"];
                                const _errs49 = errors;
                                const _errs50 = errors;
                                let valid13 = false;
                                const _errs51 = errors;
                                if (data12 !== false) {
                                  const err24 = { instancePath: instancePath + "/attachments.read", schemaPath: "#/properties/attachments.read/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                                  if (vErrors === null) {
                                    vErrors = [err24];
                                  } else {
                                    vErrors.push(err24);
                                  }
                                  errors++;
                                }
                                var _valid12 = _errs51 === errors;
                                valid13 = valid13 || _valid12;
                                const _errs52 = errors;
                                if (!validate87(data12, { instancePath: instancePath + "/attachments.read", parentData: data, parentDataProperty: "attachments.read", rootData, dynamicAnchors })) {
                                  vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
                                  errors = vErrors.length;
                                }
                                var _valid12 = _errs52 === errors;
                                valid13 = valid13 || _valid12;
                                if (!valid13) {
                                  const err25 = { instancePath: instancePath + "/attachments.read", schemaPath: "#/properties/attachments.read/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                  if (vErrors === null) {
                                    vErrors = [err25];
                                  } else {
                                    vErrors.push(err25);
                                  }
                                  errors++;
                                  validate93.errors = vErrors;
                                  return false;
                                } else {
                                  errors = _errs50;
                                  if (vErrors !== null) {
                                    if (_errs50) {
                                      vErrors.length = _errs50;
                                    } else {
                                      vErrors = null;
                                    }
                                  }
                                }
                                var valid0 = _errs49 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data["attachments.send"] !== undefined) {
                                  let data13 = data["attachments.send"];
                                  const _errs53 = errors;
                                  const _errs54 = errors;
                                  let valid14 = false;
                                  const _errs55 = errors;
                                  if (data13 !== false) {
                                    const err26 = { instancePath: instancePath + "/attachments.send", schemaPath: "#/properties/attachments.send/anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                                    if (vErrors === null) {
                                      vErrors = [err26];
                                    } else {
                                      vErrors.push(err26);
                                    }
                                    errors++;
                                  }
                                  var _valid13 = _errs55 === errors;
                                  valid14 = valid14 || _valid13;
                                  const _errs56 = errors;
                                  if (!validate89(data13, { instancePath: instancePath + "/attachments.send", parentData: data, parentDataProperty: "attachments.send", rootData, dynamicAnchors })) {
                                    vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
                                    errors = vErrors.length;
                                  }
                                  var _valid13 = _errs56 === errors;
                                  valid14 = valid14 || _valid13;
                                  if (_valid13) {
                                    var props6 = {};
                                    props6.maxBytes = true;
                                    props6.caption = true;
                                  }
                                  if (!valid14) {
                                    const err27 = { instancePath: instancePath + "/attachments.send", schemaPath: "#/properties/attachments.send/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                    if (vErrors === null) {
                                      vErrors = [err27];
                                    } else {
                                      vErrors.push(err27);
                                    }
                                    errors++;
                                    validate93.errors = vErrors;
                                    return false;
                                  } else {
                                    errors = _errs54;
                                    if (vErrors !== null) {
                                      if (_errs54) {
                                        vErrors.length = _errs54;
                                      } else {
                                        vErrors = null;
                                      }
                                    }
                                  }
                                  var valid0 = _errs53 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  var props7 = {};
                                  props7["rooms.list"] = true;
                                  props7["messages.read"] = true;
                                  props7["messages.stream"] = true;
                                  props7["messages.send"] = true;
                                  props7["messages.reply"] = true;
                                  props7["messages.edit"] = true;
                                  props7["messages.delete"] = true;
                                  props7["reactions.read"] = true;
                                  props7["reactions.send"] = true;
                                  props7["read.mark"] = true;
                                  props7["typing.send"] = true;
                                  props7["threads.read"] = true;
                                  props7["attachments.read"] = true;
                                  props7["attachments.send"] = true;
                                  for (const key0 in data) {
                                    if (pattern5.test(key0)) {
                                      let data14 = data[key0];
                                      const _errs58 = errors;
                                      let valid16 = false;
                                      const _errs59 = errors;
                                      if (data14 !== false) {
                                        const err28 = { instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/patternProperties/%5Ex-%5Ba-z%5D%5Ba-z0-9-%5D*%5C./anyOf/0/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" };
                                        if (vErrors === null) {
                                          vErrors = [err28];
                                        } else {
                                          vErrors.push(err28);
                                        }
                                        errors++;
                                      }
                                      var _valid14 = _errs59 === errors;
                                      valid16 = valid16 || _valid14;
                                      const _errs60 = errors;
                                      if (!(data14 && typeof data14 == "object" && !Array.isArray(data14))) {
                                        const err29 = { instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/patternProperties/%5Ex-%5Ba-z%5D%5Ba-z0-9-%5D*%5C./anyOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                        if (vErrors === null) {
                                          vErrors = [err29];
                                        } else {
                                          vErrors.push(err29);
                                        }
                                        errors++;
                                      }
                                      var _valid14 = _errs60 === errors;
                                      valid16 = valid16 || _valid14;
                                      if (!valid16) {
                                        const err30 = { instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/patternProperties/%5Ex-%5Ba-z%5D%5Ba-z0-9-%5D*%5C./anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                        if (vErrors === null) {
                                          vErrors = [err30];
                                        } else {
                                          vErrors.push(err30);
                                        }
                                        errors++;
                                        validate93.errors = vErrors;
                                        return false;
                                      } else {
                                        errors = _errs58;
                                        if (vErrors !== null) {
                                          if (_errs58) {
                                            vErrors.length = _errs58;
                                          } else {
                                            vErrors = null;
                                          }
                                        }
                                      }
                                      props7[key0] = true;
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
      validate93.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate93.errors = vErrors;
  evaluated0.props = props7;
  return errors === 0;
}
validate93.evaluated = { dynamicProps: true, dynamicItems: false };
var validateRoom = validate108;
var func1 = require_ucs2length().default;
var formats0 = require_formats().fullFormats["date-time"];
function validate108(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate108.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.id === undefined && (missing0 = "id") || data.title === undefined && (missing0 = "title") || data.kind === undefined && (missing0 = "kind") || data.unread === undefined && (missing0 = "unread")) {
        validate108.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          let data0 = data.id;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate108.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate108.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.title !== undefined) {
            const _errs3 = errors;
            if (typeof data.title !== "string") {
              validate108.errors = [{ instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.kind !== undefined) {
              const _errs5 = errors;
              if (typeof data.kind !== "string") {
                validate108.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.unread !== undefined) {
                let data3 = data.unread;
                const _errs7 = errors;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  validate108.errors = [{ instancePath: instancePath + "/unread", schemaPath: "#/properties/unread/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs7) {
                  if (typeof data3 == "number" && isFinite(data3)) {
                    if (data3 < 0 || isNaN(data3)) {
                      validate108.errors = [{ instancePath: instancePath + "/unread", schemaPath: "#/properties/unread/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                      return false;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.lastActivityAt !== undefined) {
                  let data4 = data.lastActivityAt;
                  const _errs9 = errors;
                  if (errors === _errs9) {
                    if (errors === _errs9) {
                      if (typeof data4 === "string") {
                        if (!formats0.validate(data4)) {
                          validate108.errors = [{ instancePath: instancePath + "/lastActivityAt", schemaPath: "#/properties/lastActivityAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                          return false;
                        }
                      } else {
                        validate108.errors = [{ instancePath: instancePath + "/lastActivityAt", schemaPath: "#/properties/lastActivityAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.lastMessage !== undefined) {
                    let data5 = data.lastMessage;
                    const _errs11 = errors;
                    if (errors === _errs11) {
                      if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                        let missing1;
                        if (data5.text === undefined && (missing1 = "text") || data5.fromMe === undefined && (missing1 = "fromMe")) {
                          validate108.errors = [{ instancePath: instancePath + "/lastMessage", schemaPath: "#/properties/lastMessage/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                          return false;
                        } else {
                          if (data5.text !== undefined) {
                            const _errs13 = errors;
                            if (typeof data5.text !== "string") {
                              validate108.errors = [{ instancePath: instancePath + "/lastMessage/text", schemaPath: "#/properties/lastMessage/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                            var valid1 = _errs13 === errors;
                          } else {
                            var valid1 = true;
                          }
                          if (valid1) {
                            if (data5.fromMe !== undefined) {
                              const _errs15 = errors;
                              if (typeof data5.fromMe !== "boolean") {
                                validate108.errors = [{ instancePath: instancePath + "/lastMessage/fromMe", schemaPath: "#/properties/lastMessage/properties/fromMe/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                                return false;
                              }
                              var valid1 = _errs15 === errors;
                            } else {
                              var valid1 = true;
                            }
                          }
                        }
                      } else {
                        validate108.errors = [{ instancePath: instancePath + "/lastMessage", schemaPath: "#/properties/lastMessage/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.features !== undefined) {
                      const _errs17 = errors;
                      if (!validate93(data.features, { instancePath: instancePath + "/features", parentData: data, parentDataProperty: "features", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs17 === errors;
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
      validate108.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate108.errors = vErrors;
  return errors === 0;
}
validate108.evaluated = { props: { id: true, title: true, kind: true, unread: true, lastActivityAt: true, lastMessage: true, features: true }, dynamicProps: false, dynamicItems: false };
var validateRoomsAnswer = validate110;
function validate110(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate110.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.rooms === undefined && (missing0 = "rooms") || data.complete === undefined && (missing0 = "complete")) {
        validate110.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate110.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.rooms !== undefined) {
            let data1 = data.rooms;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data1)) {
                var valid1 = true;
                const len0 = data1.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate108(data1[i0], { instancePath: instancePath + "/rooms/" + i0, parentData: data1, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate108.errors : vErrors.concat(validate108.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate110.errors = [{ instancePath: instancePath + "/rooms", schemaPath: "#/properties/rooms/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.complete !== undefined) {
              const _errs5 = errors;
              if (typeof data.complete !== "boolean") {
                validate110.errors = [{ instancePath: instancePath + "/complete", schemaPath: "#/properties/complete/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
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
      validate110.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate110.errors = vErrors;
  return errors === 0;
}
validate110.evaluated = { props: { ok: true, rooms: true, complete: true }, dynamicProps: false, dynamicItems: false };
var validateAttachment = validate112;
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
      if (data.id === undefined && (missing0 = "id") || data.kind === undefined && (missing0 = "kind")) {
        validate112.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          let data0 = data.id;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) > 512) {
                validate112.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/maxLength", keyword: "maxLength", params: { limit: 512 }, message: "must NOT have more than 512 characters" }];
                return false;
              } else {
                if (func1(data0) < 1) {
                  validate112.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              }
            } else {
              validate112.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.kind !== undefined) {
            const _errs3 = errors;
            if (typeof data.kind !== "string") {
              validate112.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.name !== undefined) {
              const _errs5 = errors;
              if (typeof data.name !== "string") {
                validate112.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.mimeType !== undefined) {
                const _errs7 = errors;
                if (typeof data.mimeType !== "string") {
                  validate112.errors = [{ instancePath: instancePath + "/mimeType", schemaPath: "#/properties/mimeType/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.size !== undefined) {
                  let data4 = data.size;
                  const _errs9 = errors;
                  if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                    validate112.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                    return false;
                  }
                  if (errors === _errs9) {
                    if (typeof data4 == "number" && isFinite(data4)) {
                      if (data4 < 0 || isNaN(data4)) {
                        validate112.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.width !== undefined) {
                    const _errs11 = errors;
                    if (!validate52(data.width, { instancePath: instancePath + "/width", parentData: data, parentDataProperty: "width", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.height !== undefined) {
                      const _errs12 = errors;
                      if (!validate52(data.height, { instancePath: instancePath + "/height", parentData: data, parentDataProperty: "height", rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
                        errors = vErrors.length;
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.durationSeconds !== undefined) {
                        let data7 = data.durationSeconds;
                        const _errs13 = errors;
                        if (errors === _errs13) {
                          if (typeof data7 == "number" && isFinite(data7)) {
                            if (data7 < 0 || isNaN(data7)) {
                              validate112.errors = [{ instancePath: instancePath + "/durationSeconds", schemaPath: "#/properties/durationSeconds/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                              return false;
                            }
                          } else {
                            validate112.errors = [{ instancePath: instancePath + "/durationSeconds", schemaPath: "#/properties/durationSeconds/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                        }
                        var valid0 = _errs13 === errors;
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
      validate112.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate112.errors = vErrors;
  return errors === 0;
}
validate112.evaluated = { props: { id: true, kind: true, name: true, mimeType: true, size: true, width: true, height: true, durationSeconds: true }, dynamicProps: false, dynamicItems: false };
var validateMessage = validate115;
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
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.id === undefined && (missing0 = "id") || data.roomId === undefined && (missing0 = "roomId") || data.sender === undefined && (missing0 = "sender") || data.text === undefined && (missing0 = "text") || data.kind === undefined && (missing0 = "kind") || data.sentAt === undefined && (missing0 = "sentAt") || data.fromMe === undefined && (missing0 = "fromMe")) {
        validate115.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          let data0 = data.id;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate115.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate115.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.roomId !== undefined) {
            let data1 = data.roomId;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (typeof data1 === "string") {
                if (func1(data1) < 1) {
                  validate115.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              } else {
                validate115.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.senderId !== undefined) {
              let data2 = data.senderId;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (typeof data2 === "string") {
                  if (func1(data2) < 1) {
                    validate115.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate115.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.sender !== undefined) {
                const _errs7 = errors;
                if (typeof data.sender !== "string") {
                  validate115.errors = [{ instancePath: instancePath + "/sender", schemaPath: "#/properties/sender/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.text !== undefined) {
                  const _errs9 = errors;
                  if (typeof data.text !== "string") {
                    validate115.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.kind !== undefined) {
                    const _errs11 = errors;
                    if (typeof data.kind !== "string") {
                      validate115.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.sentAt !== undefined) {
                      let data6 = data.sentAt;
                      const _errs13 = errors;
                      if (errors === _errs13) {
                        if (errors === _errs13) {
                          if (typeof data6 === "string") {
                            if (!formats0.validate(data6)) {
                              validate115.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                              return false;
                            }
                          } else {
                            validate115.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                        }
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.editedAt !== undefined) {
                        let data7 = data.editedAt;
                        const _errs15 = errors;
                        if (errors === _errs15) {
                          if (errors === _errs15) {
                            if (typeof data7 === "string") {
                              if (!formats0.validate(data7)) {
                                validate115.errors = [{ instancePath: instancePath + "/editedAt", schemaPath: "#/properties/editedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                                return false;
                              }
                            } else {
                              validate115.errors = [{ instancePath: instancePath + "/editedAt", schemaPath: "#/properties/editedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                          }
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.fromMe !== undefined) {
                          const _errs17 = errors;
                          if (typeof data.fromMe !== "boolean") {
                            validate115.errors = [{ instancePath: instancePath + "/fromMe", schemaPath: "#/properties/fromMe/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                            return false;
                          }
                          var valid0 = _errs17 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.replyTo !== undefined) {
                            let data9 = data.replyTo;
                            const _errs19 = errors;
                            if (errors === _errs19) {
                              if (typeof data9 === "string") {
                                if (func1(data9) < 1) {
                                  validate115.errors = [{ instancePath: instancePath + "/replyTo", schemaPath: "#/properties/replyTo/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                  return false;
                                }
                              } else {
                                validate115.errors = [{ instancePath: instancePath + "/replyTo", schemaPath: "#/properties/replyTo/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                return false;
                              }
                            }
                            var valid0 = _errs19 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.attachments !== undefined) {
                              let data10 = data.attachments;
                              const _errs21 = errors;
                              if (errors === _errs21) {
                                if (Array.isArray(data10)) {
                                  if (data10.length < 1) {
                                    validate115.errors = [{ instancePath: instancePath + "/attachments", schemaPath: "#/properties/attachments/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                    return false;
                                  } else {
                                    var valid1 = true;
                                    const len0 = data10.length;
                                    for (let i0 = 0;i0 < len0; i0++) {
                                      const _errs23 = errors;
                                      if (!validate112(data10[i0], { instancePath: instancePath + "/attachments/" + i0, parentData: data10, parentDataProperty: i0, rootData, dynamicAnchors })) {
                                        vErrors = vErrors === null ? validate112.errors : vErrors.concat(validate112.errors);
                                        errors = vErrors.length;
                                      }
                                      var valid1 = _errs23 === errors;
                                      if (!valid1) {
                                        break;
                                      }
                                    }
                                  }
                                } else {
                                  validate115.errors = [{ instancePath: instancePath + "/attachments", schemaPath: "#/properties/attachments/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                  return false;
                                }
                              }
                              var valid0 = _errs21 === errors;
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
    } else {
      validate115.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate115.errors = vErrors;
  return errors === 0;
}
validate115.evaluated = { props: { id: true, roomId: true, senderId: true, sender: true, text: true, kind: true, sentAt: true, editedAt: true, fromMe: true, replyTo: true, attachments: true }, dynamicProps: false, dynamicItems: false };
var validateMessagesAnswer = validate117;
function validate117(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate117.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.messages === undefined && (missing0 = "messages") || data.hasEarlier === undefined && (missing0 = "hasEarlier")) {
        validate117.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate117.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.messages !== undefined) {
            let data1 = data.messages;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data1)) {
                var valid1 = true;
                const len0 = data1.length;
                for (let i0 = 0;i0 < len0; i0++) {
                  const _errs4 = errors;
                  if (!validate115(data1[i0], { instancePath: instancePath + "/messages/" + i0, parentData: data1, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate117.errors = [{ instancePath: instancePath + "/messages", schemaPath: "#/properties/messages/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hasEarlier !== undefined) {
              const _errs5 = errors;
              if (typeof data.hasEarlier !== "boolean") {
                validate117.errors = [{ instancePath: instancePath + "/hasEarlier", schemaPath: "#/properties/hasEarlier/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
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
      validate117.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate117.errors = vErrors;
  return errors === 0;
}
validate117.evaluated = { props: { ok: true, messages: true, hasEarlier: true }, dynamicProps: false, dynamicItems: false };
var validateCursor = validate119;
function validate119(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate119.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      for (const key0 in data) {
        const _errs2 = errors;
        if (typeof data[key0] !== "string") {
          validate119.errors = [{ instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
          return false;
        }
        var valid0 = _errs2 === errors;
        if (!valid0) {
          break;
        }
      }
    } else {
      validate119.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate119.errors = vErrors;
  return errors === 0;
}
validate119.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStreamReady = validate120;
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
      if (data.ok === undefined && (missing0 = "ok") || data.resumed === undefined && (missing0 = "resumed") || data.cursor === undefined && (missing0 = "cursor")) {
        validate120.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate120.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.resumed !== undefined) {
            const _errs2 = errors;
            if (typeof data.resumed !== "boolean") {
              validate120.errors = [{ instancePath: instancePath + "/resumed", schemaPath: "#/properties/resumed/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.cursor !== undefined) {
              const _errs4 = errors;
              if (!validate119(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate119.errors : vErrors.concat(validate119.errors);
                errors = vErrors.length;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
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
validate120.evaluated = { props: { ok: true, resumed: true, cursor: true }, dynamicProps: false, dynamicItems: false };
var validateStreamMessage = validate122;
function validate122(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate122.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.message === undefined && (missing0 = "message")) {
        validate122.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate122.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.message !== undefined) {
            const _errs2 = errors;
            if (!validate115(data.message, { instancePath: instancePath + "/message", parentData: data, parentDataProperty: "message", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate122.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate122.errors = vErrors;
  return errors === 0;
}
validate122.evaluated = { props: { ok: true, message: true }, dynamicProps: false, dynamicItems: false };
var validateStreamCursor = validate124;
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
      if (data.ok === undefined && (missing0 = "ok") || data.cursor === undefined && (missing0 = "cursor")) {
        validate124.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate124.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.cursor !== undefined) {
            const _errs2 = errors;
            if (!validate119(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate119.errors : vErrors.concat(validate119.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
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
validate124.evaluated = { props: { ok: true, cursor: true }, dynamicProps: false, dynamicItems: false };
var validateStreamPing = validate126;
function validate126(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate126.evaluated;
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
        validate126.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          if (data.ok !== true) {
            validate126.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
        }
      }
    } else {
      validate126.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate126.errors = vErrors;
  return errors === 0;
}
validate126.evaluated = { props: { ok: true }, dynamicProps: false, dynamicItems: false };
var validateSendRequest = validate127;
function validate127(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate127.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.roomId === undefined && (missing0 = "roomId") || data.text === undefined && (missing0 = "text")) {
        validate127.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.roomId !== undefined) {
          let data0 = data.roomId;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate127.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate127.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.text !== undefined) {
            let data1 = data.text;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (typeof data1 === "string") {
                if (func1(data1) < 1) {
                  validate127.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              } else {
                validate127.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate127.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate127.errors = vErrors;
  return errors === 0;
}
validate127.evaluated = { props: { roomId: true, text: true }, dynamicProps: false, dynamicItems: false };
var validateSendAnswer = validate128;
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
      if (data.ok === undefined && (missing0 = "ok") || data.message === undefined && (missing0 = "message")) {
        validate128.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate128.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.message !== undefined) {
            const _errs2 = errors;
            if (!validate115(data.message, { instancePath: instancePath + "/message", parentData: data, parentDataProperty: "message", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
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
validate128.evaluated = { props: { ok: true, message: true }, dynamicProps: false, dynamicItems: false };
export {
  validateAttachment,
  validateCapabilities,
  validateCursor,
  validateErrorCode,
  validateErrorEnvelope,
  validateFeatureAttachmentsRead,
  validateFeatureAttachmentsSend,
  validateFeatureMessagesDelete,
  validateFeatureMessagesEdit,
  validateFeatureMessagesRead,
  validateFeatureMessagesReply,
  validateFeatureMessagesSend,
  validateFeatureMessagesStream,
  validateFeatureReactionsRead,
  validateFeatureReactionsSend,
  validateFeatureReadMark,
  validateFeatureRoomsList,
  validateFeatureThreadsRead,
  validateFeatureTypingSend,
  validateFeatures,
  validateHealth,
  validateMessage,
  validateMessagesAnswer,
  validatePositiveInteger,
  validateRoom,
  validateRoomFeatures,
  validateRoomsAnswer,
  validateSendAnswer,
  validateSendRequest,
  validateStreamCursor,
  validateStreamMessage,
  validateStreamPing,
  validateStreamReady
};
