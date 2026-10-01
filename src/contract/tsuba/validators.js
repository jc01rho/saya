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
var validateRoom = validate65;
var func1 = require_ucs2length().default;
var formats0 = require_formats().fullFormats["date-time"];
function validate65(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate65.evaluated;
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
        validate65.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          let data0 = data.id;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate65.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate65.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
              validate65.errors = [{ instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                validate65.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                  validate65.errors = [{ instancePath: instancePath + "/unread", schemaPath: "#/properties/unread/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs7) {
                  if (typeof data3 == "number" && isFinite(data3)) {
                    if (data3 < 0 || isNaN(data3)) {
                      validate65.errors = [{ instancePath: instancePath + "/unread", schemaPath: "#/properties/unread/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
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
                          validate65.errors = [{ instancePath: instancePath + "/lastActivityAt", schemaPath: "#/properties/lastActivityAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                          return false;
                        }
                      } else {
                        validate65.errors = [{ instancePath: instancePath + "/lastActivityAt", schemaPath: "#/properties/lastActivityAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                          validate65.errors = [{ instancePath: instancePath + "/lastMessage", schemaPath: "#/properties/lastMessage/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                          return false;
                        } else {
                          if (data5.text !== undefined) {
                            const _errs13 = errors;
                            if (typeof data5.text !== "string") {
                              validate65.errors = [{ instancePath: instancePath + "/lastMessage/text", schemaPath: "#/properties/lastMessage/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                                validate65.errors = [{ instancePath: instancePath + "/lastMessage/fromMe", schemaPath: "#/properties/lastMessage/properties/fromMe/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                                return false;
                              }
                              var valid1 = _errs15 === errors;
                            } else {
                              var valid1 = true;
                            }
                          }
                        }
                      } else {
                        validate65.errors = [{ instancePath: instancePath + "/lastMessage", schemaPath: "#/properties/lastMessage/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
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
    } else {
      validate65.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate65.errors = vErrors;
  return errors === 0;
}
validate65.evaluated = { props: { id: true, title: true, kind: true, unread: true, lastActivityAt: true, lastMessage: true }, dynamicProps: false, dynamicItems: false };
var validateRoomsAnswer = validate66;
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
      if (data.ok === undefined && (missing0 = "ok") || data.rooms === undefined && (missing0 = "rooms") || data.complete === undefined && (missing0 = "complete")) {
        validate66.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate66.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
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
                  if (!validate65(data1[i0], { instancePath: instancePath + "/rooms/" + i0, parentData: data1, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate65.errors : vErrors.concat(validate65.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate66.errors = [{ instancePath: instancePath + "/rooms", schemaPath: "#/properties/rooms/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
                validate66.errors = [{ instancePath: instancePath + "/complete", schemaPath: "#/properties/complete/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
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
      validate66.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate66.errors = vErrors;
  return errors === 0;
}
validate66.evaluated = { props: { ok: true, rooms: true, complete: true }, dynamicProps: false, dynamicItems: false };
var validateMessage = validate68;
function validate68(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate68.evaluated;
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
        validate68.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          let data0 = data.id;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate68.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate68.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                  validate68.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              } else {
                validate68.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                    validate68.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate68.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                  validate68.errors = [{ instancePath: instancePath + "/sender", schemaPath: "#/properties/sender/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                    validate68.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                      validate68.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                              validate68.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                              return false;
                            }
                          } else {
                            validate68.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                                validate68.errors = [{ instancePath: instancePath + "/editedAt", schemaPath: "#/properties/editedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                                return false;
                              }
                            } else {
                              validate68.errors = [{ instancePath: instancePath + "/editedAt", schemaPath: "#/properties/editedAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                            validate68.errors = [{ instancePath: instancePath + "/fromMe", schemaPath: "#/properties/fromMe/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
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
                                  validate68.errors = [{ instancePath: instancePath + "/replyTo", schemaPath: "#/properties/replyTo/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                  return false;
                                }
                              } else {
                                validate68.errors = [{ instancePath: instancePath + "/replyTo", schemaPath: "#/properties/replyTo/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                return false;
                              }
                            }
                            var valid0 = _errs19 === errors;
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
      validate68.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate68.errors = vErrors;
  return errors === 0;
}
validate68.evaluated = { props: { id: true, roomId: true, senderId: true, sender: true, text: true, kind: true, sentAt: true, editedAt: true, fromMe: true, replyTo: true }, dynamicProps: false, dynamicItems: false };
var validateMessagesAnswer = validate69;
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
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.messages === undefined && (missing0 = "messages") || data.hasEarlier === undefined && (missing0 = "hasEarlier")) {
        validate69.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate69.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
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
                  if (!validate68(data1[i0], { instancePath: instancePath + "/messages/" + i0, parentData: data1, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate69.errors = [{ instancePath: instancePath + "/messages", schemaPath: "#/properties/messages/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
                validate69.errors = [{ instancePath: instancePath + "/hasEarlier", schemaPath: "#/properties/hasEarlier/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
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
      validate69.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate69.errors = vErrors;
  return errors === 0;
}
validate69.evaluated = { props: { ok: true, messages: true, hasEarlier: true }, dynamicProps: false, dynamicItems: false };
var validateCursor = validate71;
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
      for (const key0 in data) {
        const _errs2 = errors;
        if (typeof data[key0] !== "string") {
          validate71.errors = [{ instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
          return false;
        }
        var valid0 = _errs2 === errors;
        if (!valid0) {
          break;
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
validate71.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateStreamReady = validate72;
function validate72(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate72.evaluated;
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
        validate72.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate72.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
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
              validate72.errors = [{ instancePath: instancePath + "/resumed", schemaPath: "#/properties/resumed/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.cursor !== undefined) {
              const _errs4 = errors;
              if (!validate71(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
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
      validate72.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate72.errors = vErrors;
  return errors === 0;
}
validate72.evaluated = { props: { ok: true, resumed: true, cursor: true }, dynamicProps: false, dynamicItems: false };
var validateStreamMessage = validate74;
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
      if (data.ok === undefined && (missing0 = "ok") || data.message === undefined && (missing0 = "message")) {
        validate74.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate74.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.message !== undefined) {
            const _errs2 = errors;
            if (!validate68(data.message, { instancePath: instancePath + "/message", parentData: data, parentDataProperty: "message", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
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
validate74.evaluated = { props: { ok: true, message: true }, dynamicProps: false, dynamicItems: false };
var validateStreamCursor = validate76;
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
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.cursor === undefined && (missing0 = "cursor")) {
        validate76.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate76.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.cursor !== undefined) {
            const _errs2 = errors;
            if (!validate71(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate76.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate76.errors = vErrors;
  return errors === 0;
}
validate76.evaluated = { props: { ok: true, cursor: true }, dynamicProps: false, dynamicItems: false };
var validateStreamPing = validate78;
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
      if (data.ok === undefined && (missing0 = "ok")) {
        validate78.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          if (data.ok !== true) {
            validate78.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
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
validate78.evaluated = { props: { ok: true }, dynamicProps: false, dynamicItems: false };
var validateSendRequest = validate79;
function validate79(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate79.evaluated;
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
        validate79.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.roomId !== undefined) {
          let data0 = data.roomId;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate79.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate79.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                  validate79.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              } else {
                validate79.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
      validate79.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate79.errors = vErrors;
  return errors === 0;
}
validate79.evaluated = { props: { roomId: true, text: true }, dynamicProps: false, dynamicItems: false };
var validateSendAnswer = validate80;
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
      if (data.ok === undefined && (missing0 = "ok") || data.message === undefined && (missing0 = "message")) {
        validate80.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate80.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.message !== undefined) {
            const _errs2 = errors;
            if (!validate68(data.message, { instancePath: instancePath + "/message", parentData: data, parentDataProperty: "message", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
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
validate80.evaluated = { props: { ok: true, message: true }, dynamicProps: false, dynamicItems: false };
export {
  validateCapabilities,
  validateCursor,
  validateErrorCode,
  validateErrorEnvelope,
  validateFeatures,
  validateHealth,
  validateMessage,
  validateMessagesAnswer,
  validatePositiveInteger,
  validateRoom,
  validateRoomsAnswer,
  validateSendAnswer,
  validateSendRequest,
  validateStreamCursor,
  validateStreamMessage,
  validateStreamPing,
  validateStreamReady
};
