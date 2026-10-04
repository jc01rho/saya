// Generated from contracts/kakao.openapi.json by bun run contract:generate. Do not edit.
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

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
var validateErrorCode = validate52;
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
  if (typeof data !== "string") {
    validate52.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
    return false;
  }
  validate52.errors = vErrors;
  return errors === 0;
}
validate52.evaluated = { dynamicProps: false, dynamicItems: false };
var validateErrorEnvelope = validate53;
var schema21 = { type: "object", required: ["id", "title", "kind", "type", "memberCount", "unread", "lastMessageId", "lastActivityAt", "readable"], properties: { id: { type: "string" }, title: { type: "string" }, kind: { type: "string" }, type: { type: "string" }, memberCount: { type: "integer" }, unread: { type: "integer" }, lastMessageId: { type: ["string", "null"] }, lastActivityAt: { type: ["string", "null"], format: "date-time" }, readable: { type: "boolean" }, typeCode: { type: "integer" }, images: { type: "array", maxItems: 4, items: { type: "string", format: "uri" } } } };
var formats0 = require_formats().fullFormats["date-time"];
var formats2 = require_formats().fullFormats.uri;
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
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.id === undefined && (missing0 = "id") || data.title === undefined && (missing0 = "title") || data.kind === undefined && (missing0 = "kind") || data.type === undefined && (missing0 = "type") || data.memberCount === undefined && (missing0 = "memberCount") || data.unread === undefined && (missing0 = "unread") || data.lastMessageId === undefined && (missing0 = "lastMessageId") || data.lastActivityAt === undefined && (missing0 = "lastActivityAt") || data.readable === undefined && (missing0 = "readable")) {
        validate55.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          const _errs1 = errors;
          if (typeof data.id !== "string") {
            validate55.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.title !== undefined) {
            const _errs3 = errors;
            if (typeof data.title !== "string") {
              validate55.errors = [{ instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                validate55.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.type !== undefined) {
                const _errs7 = errors;
                if (typeof data.type !== "string") {
                  validate55.errors = [{ instancePath: instancePath + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.memberCount !== undefined) {
                  let data4 = data.memberCount;
                  const _errs9 = errors;
                  if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                    validate55.errors = [{ instancePath: instancePath + "/memberCount", schemaPath: "#/properties/memberCount/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.unread !== undefined) {
                    let data5 = data.unread;
                    const _errs11 = errors;
                    if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                      validate55.errors = [{ instancePath: instancePath + "/unread", schemaPath: "#/properties/unread/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.lastMessageId !== undefined) {
                      let data6 = data.lastMessageId;
                      const _errs13 = errors;
                      if (typeof data6 !== "string" && data6 !== null) {
                        validate55.errors = [{ instancePath: instancePath + "/lastMessageId", schemaPath: "#/properties/lastMessageId/type", keyword: "type", params: { type: schema21.properties.lastMessageId.type }, message: "must be string,null" }];
                        return false;
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.lastActivityAt !== undefined) {
                        let data7 = data.lastActivityAt;
                        const _errs15 = errors;
                        if (typeof data7 !== "string" && data7 !== null) {
                          validate55.errors = [{ instancePath: instancePath + "/lastActivityAt", schemaPath: "#/properties/lastActivityAt/type", keyword: "type", params: { type: schema21.properties.lastActivityAt.type }, message: "must be string,null" }];
                          return false;
                        }
                        if (errors === _errs15) {
                          if (errors === _errs15) {
                            if (typeof data7 === "string") {
                              if (!formats0.validate(data7)) {
                                validate55.errors = [{ instancePath: instancePath + "/lastActivityAt", schemaPath: "#/properties/lastActivityAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                                return false;
                              }
                            }
                          }
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.readable !== undefined) {
                          const _errs17 = errors;
                          if (typeof data.readable !== "boolean") {
                            validate55.errors = [{ instancePath: instancePath + "/readable", schemaPath: "#/properties/readable/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                            return false;
                          }
                          var valid0 = _errs17 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.typeCode !== undefined) {
                            let data9 = data.typeCode;
                            const _errs19 = errors;
                            if (!(typeof data9 == "number" && (!(data9 % 1) && !isNaN(data9)) && isFinite(data9))) {
                              validate55.errors = [{ instancePath: instancePath + "/typeCode", schemaPath: "#/properties/typeCode/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                              return false;
                            }
                            var valid0 = _errs19 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.images !== undefined) {
                              let data10 = data.images;
                              const _errs21 = errors;
                              if (errors === _errs21) {
                                if (Array.isArray(data10)) {
                                  if (data10.length > 4) {
                                    validate55.errors = [{ instancePath: instancePath + "/images", schemaPath: "#/properties/images/maxItems", keyword: "maxItems", params: { limit: 4 }, message: "must NOT have more than 4 items" }];
                                    return false;
                                  } else {
                                    var valid1 = true;
                                    const len0 = data10.length;
                                    for (let i0 = 0;i0 < len0; i0++) {
                                      let data11 = data10[i0];
                                      const _errs23 = errors;
                                      if (errors === _errs23) {
                                        if (errors === _errs23) {
                                          if (typeof data11 === "string") {
                                            if (!formats2(data11)) {
                                              validate55.errors = [{ instancePath: instancePath + "/images/" + i0, schemaPath: "#/properties/images/items/format", keyword: "format", params: { format: "uri" }, message: 'must match format "' + "uri" + '"' }];
                                              return false;
                                            }
                                          } else {
                                            validate55.errors = [{ instancePath: instancePath + "/images/" + i0, schemaPath: "#/properties/images/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                        }
                                      }
                                      var valid1 = _errs23 === errors;
                                      if (!valid1) {
                                        break;
                                      }
                                    }
                                  }
                                } else {
                                  validate55.errors = [{ instancePath: instancePath + "/images", schemaPath: "#/properties/images/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
      validate55.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate55.errors = vErrors;
  return errors === 0;
}
validate55.evaluated = { props: { id: true, title: true, kind: true, type: true, memberCount: true, unread: true, lastMessageId: true, lastActivityAt: true, readable: true, typeCode: true, images: true }, dynamicProps: false, dynamicItems: false };
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
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.error === undefined && (missing0 = "error")) {
        validate53.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== false) {
            validate53.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: false }, message: "must be equal to constant" }];
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
                  validate53.errors = [{ instancePath: instancePath + "/error", schemaPath: "#/properties/error/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  if (data1.code !== undefined) {
                    const _errs4 = errors;
                    if (!validate52(data1.code, { instancePath: instancePath + "/error/code", parentData: data1, parentDataProperty: "code", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate52.errors : vErrors.concat(validate52.errors);
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
                        validate53.errors = [{ instancePath: instancePath + "/error/message", schemaPath: "#/properties/error/properties/message/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                      var valid1 = _errs5 === errors;
                    } else {
                      var valid1 = true;
                    }
                  }
                }
              } else {
                validate53.errors = [{ instancePath: instancePath + "/error", schemaPath: "#/properties/error/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.candidates !== undefined) {
              let data4 = data.candidates;
              const _errs7 = errors;
              if (errors === _errs7) {
                if (Array.isArray(data4)) {
                  var valid2 = true;
                  const len0 = data4.length;
                  for (let i0 = 0;i0 < len0; i0++) {
                    const _errs9 = errors;
                    if (!validate55(data4[i0], { instancePath: instancePath + "/candidates/" + i0, parentData: data4, parentDataProperty: i0, rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                      errors = vErrors.length;
                    }
                    var valid2 = _errs9 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate53.errors = [{ instancePath: instancePath + "/candidates", schemaPath: "#/properties/candidates/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
    } else {
      validate53.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate53.errors = vErrors;
  return errors === 0;
}
validate53.evaluated = { props: { ok: true, error: true, candidates: true }, dynamicProps: false, dynamicItems: false };
var validateRoom = validate55;
var validateMention = validate57;
var schema22 = { type: "object", required: ["userId", "name", "at", "length"], properties: { userId: { type: "string" }, name: { type: ["string", "null"] }, at: { type: "array", items: { type: "integer" } }, length: { type: "integer" } } };
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
      if (data.userId === undefined && (missing0 = "userId") || data.name === undefined && (missing0 = "name") || data.at === undefined && (missing0 = "at") || data.length === undefined && (missing0 = "length")) {
        validate57.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.userId !== undefined) {
          const _errs1 = errors;
          if (typeof data.userId !== "string") {
            validate57.errors = [{ instancePath: instancePath + "/userId", schemaPath: "#/properties/userId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.name !== undefined) {
            let data1 = data.name;
            const _errs3 = errors;
            if (typeof data1 !== "string" && data1 !== null) {
              validate57.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: schema22.properties.name.type }, message: "must be string,null" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.at !== undefined) {
              let data2 = data.at;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (Array.isArray(data2)) {
                  var valid1 = true;
                  const len0 = data2.length;
                  for (let i0 = 0;i0 < len0; i0++) {
                    let data3 = data2[i0];
                    const _errs7 = errors;
                    if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                      validate57.errors = [{ instancePath: instancePath + "/at/" + i0, schemaPath: "#/properties/at/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                      return false;
                    }
                    var valid1 = _errs7 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate57.errors = [{ instancePath: instancePath + "/at", schemaPath: "#/properties/at/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.length !== undefined) {
                let data4 = data.length;
                const _errs9 = errors;
                if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                  validate57.errors = [{ instancePath: instancePath + "/length", schemaPath: "#/properties/length/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
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
validate57.evaluated = { props: { userId: true, name: true, at: true, length: true }, dynamicProps: false, dynamicItems: false };
var validateReplySource = validate58;
var schema23 = { type: "object", required: ["messageId", "senderId", "sender", "text", "kind"], properties: { messageId: { type: ["string", "null"] }, senderId: { type: ["string", "null"] }, sender: { type: ["string", "null"] }, text: { type: ["string", "null"] }, kind: { type: ["string", "null"] } } };
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
      if (data.messageId === undefined && (missing0 = "messageId") || data.senderId === undefined && (missing0 = "senderId") || data.sender === undefined && (missing0 = "sender") || data.text === undefined && (missing0 = "text") || data.kind === undefined && (missing0 = "kind")) {
        validate58.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.messageId !== undefined) {
          let data0 = data.messageId;
          const _errs1 = errors;
          if (typeof data0 !== "string" && data0 !== null) {
            validate58.errors = [{ instancePath: instancePath + "/messageId", schemaPath: "#/properties/messageId/type", keyword: "type", params: { type: schema23.properties.messageId.type }, message: "must be string,null" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.senderId !== undefined) {
            let data1 = data.senderId;
            const _errs3 = errors;
            if (typeof data1 !== "string" && data1 !== null) {
              validate58.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/type", keyword: "type", params: { type: schema23.properties.senderId.type }, message: "must be string,null" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.sender !== undefined) {
              let data2 = data.sender;
              const _errs5 = errors;
              if (typeof data2 !== "string" && data2 !== null) {
                validate58.errors = [{ instancePath: instancePath + "/sender", schemaPath: "#/properties/sender/type", keyword: "type", params: { type: schema23.properties.sender.type }, message: "must be string,null" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.text !== undefined) {
                let data3 = data.text;
                const _errs7 = errors;
                if (typeof data3 !== "string" && data3 !== null) {
                  validate58.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: schema23.properties.text.type }, message: "must be string,null" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.kind !== undefined) {
                  let data4 = data.kind;
                  const _errs9 = errors;
                  if (typeof data4 !== "string" && data4 !== null) {
                    validate58.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: schema23.properties.kind.type }, message: "must be string,null" }];
                    return false;
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
    } else {
      validate58.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate58.errors = vErrors;
  return errors === 0;
}
validate58.evaluated = { props: { messageId: true, senderId: true, sender: true, text: true, kind: true }, dynamicProps: false, dynamicItems: false };
var validatePhoto = validate59;
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
      if (data.url === undefined && (missing0 = "url") || data.width === undefined && (missing0 = "width") || data.height === undefined && (missing0 = "height")) {
        validate60.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.url !== undefined) {
          let data0 = data.url;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (errors === _errs1) {
              if (typeof data0 === "string") {
                if (!formats2(data0)) {
                  validate60.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "' + "uri" + '"' }];
                  return false;
                }
              } else {
                validate60.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.width !== undefined) {
            let data1 = data.width;
            const _errs3 = errors;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              validate60.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.height !== undefined) {
              let data2 = data.height;
              const _errs5 = errors;
              if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                validate60.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
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
      validate60.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate60.errors = vErrors;
  return errors === 0;
}
validate60.evaluated = { props: { url: true, width: true, height: true }, dynamicProps: false, dynamicItems: false };
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
      if (data.url === undefined && (missing0 = "url") || data.width === undefined && (missing0 = "width") || data.height === undefined && (missing0 = "height") || data.count === undefined && (missing0 = "count") || data.images === undefined && (missing0 = "images")) {
        validate59.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.url !== undefined) {
          let data0 = data.url;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (errors === _errs1) {
              if (typeof data0 === "string") {
                if (!formats2(data0)) {
                  validate59.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "' + "uri" + '"' }];
                  return false;
                }
              } else {
                validate59.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.width !== undefined) {
            let data1 = data.width;
            const _errs3 = errors;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              validate59.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.height !== undefined) {
              let data2 = data.height;
              const _errs5 = errors;
              if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                validate59.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.count !== undefined) {
                let data3 = data.count;
                const _errs7 = errors;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  validate59.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs7) {
                  if (typeof data3 == "number" && isFinite(data3)) {
                    if (data3 < 1 || isNaN(data3)) {
                      validate59.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                      return false;
                    }
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.images !== undefined) {
                  let data4 = data.images;
                  const _errs9 = errors;
                  if (errors === _errs9) {
                    if (Array.isArray(data4)) {
                      if (data4.length < 1) {
                        validate59.errors = [{ instancePath: instancePath + "/images", schemaPath: "#/properties/images/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                        return false;
                      } else {
                        var valid1 = true;
                        const len0 = data4.length;
                        for (let i0 = 0;i0 < len0; i0++) {
                          const _errs11 = errors;
                          if (!validate60(data4[i0], { instancePath: instancePath + "/images/" + i0, parentData: data4, parentDataProperty: i0, rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate60.errors : vErrors.concat(validate60.errors);
                            errors = vErrors.length;
                          }
                          var valid1 = _errs11 === errors;
                          if (!valid1) {
                            break;
                          }
                        }
                      }
                    } else {
                      validate59.errors = [{ instancePath: instancePath + "/images", schemaPath: "#/properties/images/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
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
    } else {
      validate59.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate59.errors = vErrors;
  return errors === 0;
}
validate59.evaluated = { props: { url: true, width: true, height: true, count: true, images: true }, dynamicProps: false, dynamicItems: false };
var validateVideo = validate62;
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
      if (data.url === undefined && (missing0 = "url") || data.width === undefined && (missing0 = "width") || data.height === undefined && (missing0 = "height") || data.duration === undefined && (missing0 = "duration") || data.size === undefined && (missing0 = "size")) {
        validate62.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.url !== undefined) {
          let data0 = data.url;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (errors === _errs1) {
              if (typeof data0 === "string") {
                if (!formats2(data0)) {
                  validate62.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/format", keyword: "format", params: { format: "uri" }, message: 'must match format "' + "uri" + '"' }];
                  return false;
                }
              } else {
                validate62.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.width !== undefined) {
            let data1 = data.width;
            const _errs3 = errors;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              validate62.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.height !== undefined) {
              let data2 = data.height;
              const _errs5 = errors;
              if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                validate62.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.duration !== undefined) {
                let data3 = data.duration;
                const _errs7 = errors;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  validate62.errors = [{ instancePath: instancePath + "/duration", schemaPath: "#/properties/duration/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
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
                    validate62.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.expiresAt !== undefined) {
                    let data5 = data.expiresAt;
                    const _errs11 = errors;
                    if (errors === _errs11) {
                      if (errors === _errs11) {
                        if (typeof data5 === "string") {
                          if (!formats0.validate(data5)) {
                            validate62.errors = [{ instancePath: instancePath + "/expiresAt", schemaPath: "#/properties/expiresAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                            return false;
                          }
                        } else {
                          validate62.errors = [{ instancePath: instancePath + "/expiresAt", schemaPath: "#/properties/expiresAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
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
      validate62.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate62.errors = vErrors;
  return errors === 0;
}
validate62.evaluated = { props: { url: true, width: true, height: true, duration: true, size: true, expiresAt: true }, dynamicProps: false, dynamicItems: false };
var validatePhotoImage = validate60;
var validateMessage = validate63;
var schema27 = { type: "object", required: ["id", "roomId", "senderId", "sender", "text", "kind", "sentAt", "fromMe"], properties: { id: { type: "string" }, roomId: { type: "string" }, senderId: { type: "string" }, sender: { type: "string" }, text: { type: "string" }, kind: { type: "string" }, sentAt: { type: ["string", "null"], format: "date-time" }, fromMe: { type: "boolean" }, mentions: { type: "array", items: { $ref: "#/components/schemas/Mention" } }, mentionsAll: { const: true }, mentionsMe: { const: true }, replyTo: { $ref: "#/components/schemas/ReplySource" }, repliesToMe: { const: true }, photo: { $ref: "#/components/schemas/Photo" }, video: { $ref: "#/components/schemas/Video" }, reactions: { type: "array", items: { $ref: "#/components/schemas/Reaction" } }, edited: { const: true }, covered: { type: "string", enum: ["safebot"] }, senderImage: { type: "string", format: "uri" } } };
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
      if (data.label === undefined && (missing0 = "label") || data.count === undefined && (missing0 = "count")) {
        validate68.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.label !== undefined) {
          const _errs1 = errors;
          if (typeof data.label !== "string") {
            validate68.errors = [{ instancePath: instancePath + "/label", schemaPath: "#/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.count !== undefined) {
            let data1 = data.count;
            const _errs3 = errors;
            if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
              validate68.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
              return false;
            }
            if (errors === _errs3) {
              if (typeof data1 == "number" && isFinite(data1)) {
                if (data1 < 1 || isNaN(data1)) {
                  validate68.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                  return false;
                }
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.code !== undefined) {
              const _errs5 = errors;
              if (typeof data.code !== "string") {
                validate68.errors = [{ instancePath: instancePath + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
      validate68.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate68.errors = vErrors;
  return errors === 0;
}
validate68.evaluated = { props: { label: true, count: true, code: true }, dynamicProps: false, dynamicItems: false };
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
      let missing0;
      if (data.id === undefined && (missing0 = "id") || data.roomId === undefined && (missing0 = "roomId") || data.senderId === undefined && (missing0 = "senderId") || data.sender === undefined && (missing0 = "sender") || data.text === undefined && (missing0 = "text") || data.kind === undefined && (missing0 = "kind") || data.sentAt === undefined && (missing0 = "sentAt") || data.fromMe === undefined && (missing0 = "fromMe")) {
        validate63.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.id !== undefined) {
          const _errs1 = errors;
          if (typeof data.id !== "string") {
            validate63.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.roomId !== undefined) {
            const _errs3 = errors;
            if (typeof data.roomId !== "string") {
              validate63.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.senderId !== undefined) {
              const _errs5 = errors;
              if (typeof data.senderId !== "string") {
                validate63.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.sender !== undefined) {
                const _errs7 = errors;
                if (typeof data.sender !== "string") {
                  validate63.errors = [{ instancePath: instancePath + "/sender", schemaPath: "#/properties/sender/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                    validate63.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                      validate63.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                      if (typeof data6 !== "string" && data6 !== null) {
                        validate63.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/type", keyword: "type", params: { type: schema27.properties.sentAt.type }, message: "must be string,null" }];
                        return false;
                      }
                      if (errors === _errs13) {
                        if (errors === _errs13) {
                          if (typeof data6 === "string") {
                            if (!formats0.validate(data6)) {
                              validate63.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
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
                      if (data.fromMe !== undefined) {
                        const _errs15 = errors;
                        if (typeof data.fromMe !== "boolean") {
                          validate63.errors = [{ instancePath: instancePath + "/fromMe", schemaPath: "#/properties/fromMe/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                          return false;
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.mentions !== undefined) {
                          let data8 = data.mentions;
                          const _errs17 = errors;
                          if (errors === _errs17) {
                            if (Array.isArray(data8)) {
                              var valid1 = true;
                              const len0 = data8.length;
                              for (let i0 = 0;i0 < len0; i0++) {
                                const _errs19 = errors;
                                if (!validate57(data8[i0], { instancePath: instancePath + "/mentions/" + i0, parentData: data8, parentDataProperty: i0, rootData, dynamicAnchors })) {
                                  vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
                                  errors = vErrors.length;
                                }
                                var valid1 = _errs19 === errors;
                                if (!valid1) {
                                  break;
                                }
                              }
                            } else {
                              validate63.errors = [{ instancePath: instancePath + "/mentions", schemaPath: "#/properties/mentions/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                              return false;
                            }
                          }
                          var valid0 = _errs17 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.mentionsAll !== undefined) {
                            const _errs20 = errors;
                            if (data.mentionsAll !== true) {
                              validate63.errors = [{ instancePath: instancePath + "/mentionsAll", schemaPath: "#/properties/mentionsAll/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                              return false;
                            }
                            var valid0 = _errs20 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.mentionsMe !== undefined) {
                              const _errs21 = errors;
                              if (data.mentionsMe !== true) {
                                validate63.errors = [{ instancePath: instancePath + "/mentionsMe", schemaPath: "#/properties/mentionsMe/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                                return false;
                              }
                              var valid0 = _errs21 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.replyTo !== undefined) {
                                const _errs22 = errors;
                                if (!validate58(data.replyTo, { instancePath: instancePath + "/replyTo", parentData: data, parentDataProperty: "replyTo", rootData, dynamicAnchors })) {
                                  vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
                                  errors = vErrors.length;
                                }
                                var valid0 = _errs22 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.repliesToMe !== undefined) {
                                  const _errs23 = errors;
                                  if (data.repliesToMe !== true) {
                                    validate63.errors = [{ instancePath: instancePath + "/repliesToMe", schemaPath: "#/properties/repliesToMe/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                                    return false;
                                  }
                                  var valid0 = _errs23 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.photo !== undefined) {
                                    const _errs24 = errors;
                                    if (!validate59(data.photo, { instancePath: instancePath + "/photo", parentData: data, parentDataProperty: "photo", rootData, dynamicAnchors })) {
                                      vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
                                      errors = vErrors.length;
                                    }
                                    var valid0 = _errs24 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                  if (valid0) {
                                    if (data.video !== undefined) {
                                      const _errs25 = errors;
                                      if (!validate62(data.video, { instancePath: instancePath + "/video", parentData: data, parentDataProperty: "video", rootData, dynamicAnchors })) {
                                        vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
                                        errors = vErrors.length;
                                      }
                                      var valid0 = _errs25 === errors;
                                    } else {
                                      var valid0 = true;
                                    }
                                    if (valid0) {
                                      if (data.reactions !== undefined) {
                                        let data16 = data.reactions;
                                        const _errs26 = errors;
                                        if (errors === _errs26) {
                                          if (Array.isArray(data16)) {
                                            var valid2 = true;
                                            const len1 = data16.length;
                                            for (let i1 = 0;i1 < len1; i1++) {
                                              const _errs28 = errors;
                                              if (!validate68(data16[i1], { instancePath: instancePath + "/reactions/" + i1, parentData: data16, parentDataProperty: i1, rootData, dynamicAnchors })) {
                                                vErrors = vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
                                                errors = vErrors.length;
                                              }
                                              var valid2 = _errs28 === errors;
                                              if (!valid2) {
                                                break;
                                              }
                                            }
                                          } else {
                                            validate63.errors = [{ instancePath: instancePath + "/reactions", schemaPath: "#/properties/reactions/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                            return false;
                                          }
                                        }
                                        var valid0 = _errs26 === errors;
                                      } else {
                                        var valid0 = true;
                                      }
                                      if (valid0) {
                                        if (data.edited !== undefined) {
                                          const _errs29 = errors;
                                          if (data.edited !== true) {
                                            validate63.errors = [{ instancePath: instancePath + "/edited", schemaPath: "#/properties/edited/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                                            return false;
                                          }
                                          var valid0 = _errs29 === errors;
                                        } else {
                                          var valid0 = true;
                                        }
                                        if (valid0) {
                                          if (data.covered !== undefined) {
                                            let data19 = data.covered;
                                            const _errs30 = errors;
                                            if (typeof data19 !== "string") {
                                              validate63.errors = [{ instancePath: instancePath + "/covered", schemaPath: "#/properties/covered/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                              return false;
                                            }
                                            if (!(data19 === "safebot")) {
                                              validate63.errors = [{ instancePath: instancePath + "/covered", schemaPath: "#/properties/covered/enum", keyword: "enum", params: { allowedValues: schema27.properties.covered.enum }, message: "must be equal to one of the allowed values" }];
                                              return false;
                                            }
                                            var valid0 = _errs30 === errors;
                                          } else {
                                            var valid0 = true;
                                          }
                                          if (valid0) {
                                            if (data.senderImage !== undefined) {
                                              let data20 = data.senderImage;
                                              const _errs32 = errors;
                                              if (errors === _errs32) {
                                                if (errors === _errs32) {
                                                  if (typeof data20 === "string") {
                                                    if (!formats2(data20)) {
                                                      validate63.errors = [{ instancePath: instancePath + "/senderImage", schemaPath: "#/properties/senderImage/format", keyword: "format", params: { format: "uri" }, message: 'must match format "' + "uri" + '"' }];
                                                      return false;
                                                    }
                                                  } else {
                                                    validate63.errors = [{ instancePath: instancePath + "/senderImage", schemaPath: "#/properties/senderImage/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                }
                                              }
                                              var valid0 = _errs32 === errors;
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
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate63.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate63.errors = vErrors;
  return errors === 0;
}
validate63.evaluated = { props: { id: true, roomId: true, senderId: true, sender: true, text: true, kind: true, sentAt: true, fromMe: true, mentions: true, mentionsAll: true, mentionsMe: true, replyTo: true, repliesToMe: true, photo: true, video: true, reactions: true, edited: true, covered: true, senderImage: true }, dynamicProps: false, dynamicItems: false };
var validateAttention = validate70;
function validate70(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate70.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.mentionsMe === undefined && (missing0 = "mentionsMe") || data.repliesToMe === undefined && (missing0 = "repliesToMe") || data.mentionsEveryone === undefined && (missing0 = "mentionsEveryone")) {
        validate70.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.mentionsMe !== undefined) {
          let data0 = data.mentionsMe;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0;i0 < len0; i0++) {
                const _errs3 = errors;
                if (typeof data0[i0] !== "string") {
                  validate70.errors = [{ instancePath: instancePath + "/mentionsMe/" + i0, schemaPath: "#/properties/mentionsMe/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate70.errors = [{ instancePath: instancePath + "/mentionsMe", schemaPath: "#/properties/mentionsMe/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.repliesToMe !== undefined) {
            let data2 = data.repliesToMe;
            const _errs5 = errors;
            if (errors === _errs5) {
              if (Array.isArray(data2)) {
                var valid2 = true;
                const len1 = data2.length;
                for (let i1 = 0;i1 < len1; i1++) {
                  const _errs7 = errors;
                  if (typeof data2[i1] !== "string") {
                    validate70.errors = [{ instancePath: instancePath + "/repliesToMe/" + i1, schemaPath: "#/properties/repliesToMe/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid2 = _errs7 === errors;
                  if (!valid2) {
                    break;
                  }
                }
              } else {
                validate70.errors = [{ instancePath: instancePath + "/repliesToMe", schemaPath: "#/properties/repliesToMe/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs5 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.mentionsEveryone !== undefined) {
              let data4 = data.mentionsEveryone;
              const _errs9 = errors;
              if (errors === _errs9) {
                if (Array.isArray(data4)) {
                  var valid3 = true;
                  const len2 = data4.length;
                  for (let i2 = 0;i2 < len2; i2++) {
                    const _errs11 = errors;
                    if (typeof data4[i2] !== "string") {
                      validate70.errors = [{ instancePath: instancePath + "/mentionsEveryone/" + i2, schemaPath: "#/properties/mentionsEveryone/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    var valid3 = _errs11 === errors;
                    if (!valid3) {
                      break;
                    }
                  }
                } else {
                  validate70.errors = [{ instancePath: instancePath + "/mentionsEveryone", schemaPath: "#/properties/mentionsEveryone/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs9 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate70.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate70.errors = vErrors;
  return errors === 0;
}
validate70.evaluated = { props: { mentionsMe: true, repliesToMe: true, mentionsEveryone: true }, dynamicProps: false, dynamicItems: false };
var validateCoverage = validate71;
var schema30 = { type: "object", required: ["localOnly", "reachesLatestKnown", "catalogLatestMessageId", "newestReadMessageId", "hasEarlier", "storedLocally"], properties: { localOnly: { const: true }, reachesLatestKnown: { type: "boolean" }, catalogLatestMessageId: { type: ["string", "null"] }, newestReadMessageId: { type: ["string", "null"] }, hasEarlier: { type: "boolean" }, storedLocally: { type: "integer" } } };
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
      let missing0;
      if (data.localOnly === undefined && (missing0 = "localOnly") || data.reachesLatestKnown === undefined && (missing0 = "reachesLatestKnown") || data.catalogLatestMessageId === undefined && (missing0 = "catalogLatestMessageId") || data.newestReadMessageId === undefined && (missing0 = "newestReadMessageId") || data.hasEarlier === undefined && (missing0 = "hasEarlier") || data.storedLocally === undefined && (missing0 = "storedLocally")) {
        validate71.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.localOnly !== undefined) {
          const _errs1 = errors;
          if (data.localOnly !== true) {
            validate71.errors = [{ instancePath: instancePath + "/localOnly", schemaPath: "#/properties/localOnly/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.reachesLatestKnown !== undefined) {
            const _errs2 = errors;
            if (typeof data.reachesLatestKnown !== "boolean") {
              validate71.errors = [{ instancePath: instancePath + "/reachesLatestKnown", schemaPath: "#/properties/reachesLatestKnown/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.catalogLatestMessageId !== undefined) {
              let data2 = data.catalogLatestMessageId;
              const _errs4 = errors;
              if (typeof data2 !== "string" && data2 !== null) {
                validate71.errors = [{ instancePath: instancePath + "/catalogLatestMessageId", schemaPath: "#/properties/catalogLatestMessageId/type", keyword: "type", params: { type: schema30.properties.catalogLatestMessageId.type }, message: "must be string,null" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.newestReadMessageId !== undefined) {
                let data3 = data.newestReadMessageId;
                const _errs6 = errors;
                if (typeof data3 !== "string" && data3 !== null) {
                  validate71.errors = [{ instancePath: instancePath + "/newestReadMessageId", schemaPath: "#/properties/newestReadMessageId/type", keyword: "type", params: { type: schema30.properties.newestReadMessageId.type }, message: "must be string,null" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.hasEarlier !== undefined) {
                  const _errs8 = errors;
                  if (typeof data.hasEarlier !== "boolean") {
                    validate71.errors = [{ instancePath: instancePath + "/hasEarlier", schemaPath: "#/properties/hasEarlier/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.storedLocally !== undefined) {
                    let data5 = data.storedLocally;
                    const _errs10 = errors;
                    if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                      validate71.errors = [{ instancePath: instancePath + "/storedLocally", schemaPath: "#/properties/storedLocally/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
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
      validate71.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate71.errors = vErrors;
  return errors === 0;
}
validate71.evaluated = { props: { localOnly: true, reachesLatestKnown: true, catalogLatestMessageId: true, newestReadMessageId: true, hasEarlier: true, storedLocally: true }, dynamicProps: false, dynamicItems: false };
var validateContext = validate72;
var schema31 = { type: "object", required: ["ok", "room", "messages", "lastMessageFromMe", "attention", "coverage"], properties: { ok: { const: true }, room: { $ref: "#/components/schemas/Room" }, messages: { type: "array", items: { $ref: "#/components/schemas/Message" } }, lastMessageFromMe: { type: ["boolean", "null"] }, attention: { $ref: "#/components/schemas/Attention" }, coverage: { $ref: "#/components/schemas/Coverage" } } };
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
      if (data.ok === undefined && (missing0 = "ok") || data.room === undefined && (missing0 = "room") || data.messages === undefined && (missing0 = "messages") || data.lastMessageFromMe === undefined && (missing0 = "lastMessageFromMe") || data.attention === undefined && (missing0 = "attention") || data.coverage === undefined && (missing0 = "coverage")) {
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
          if (data.room !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.room, { instancePath: instancePath + "/room", parentData: data, parentDataProperty: "room", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messages !== undefined) {
              let data2 = data.messages;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (Array.isArray(data2)) {
                  var valid1 = true;
                  const len0 = data2.length;
                  for (let i0 = 0;i0 < len0; i0++) {
                    const _errs5 = errors;
                    if (!validate63(data2[i0], { instancePath: instancePath + "/messages/" + i0, parentData: data2, parentDataProperty: i0, rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
                      errors = vErrors.length;
                    }
                    var valid1 = _errs5 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate72.errors = [{ instancePath: instancePath + "/messages", schemaPath: "#/properties/messages/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.lastMessageFromMe !== undefined) {
                let data4 = data.lastMessageFromMe;
                const _errs6 = errors;
                if (typeof data4 !== "boolean" && data4 !== null) {
                  validate72.errors = [{ instancePath: instancePath + "/lastMessageFromMe", schemaPath: "#/properties/lastMessageFromMe/type", keyword: "type", params: { type: schema31.properties.lastMessageFromMe.type }, message: "must be boolean,null" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.attention !== undefined) {
                  const _errs8 = errors;
                  if (!validate70(data.attention, { instancePath: instancePath + "/attention", parentData: data, parentDataProperty: "attention", rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate70.errors : vErrors.concat(validate70.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.coverage !== undefined) {
                    const _errs9 = errors;
                    if (!validate71(data.coverage, { instancePath: instancePath + "/coverage", parentData: data, parentDataProperty: "coverage", rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
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
      validate72.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate72.errors = vErrors;
  return errors === 0;
}
validate72.evaluated = { props: { ok: true, room: true, messages: true, lastMessageFromMe: true, attention: true, coverage: true }, dynamicProps: false, dynamicItems: false };
var validateDigestSlice = validate77;
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate77.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.from === undefined && (missing0 = "from") || data.to === undefined && (missing0 = "to") || data.count === undefined && (missing0 = "count") || data.speakers === undefined && (missing0 = "speakers") || data.keywords === undefined && (missing0 = "keywords") || data.highlights === undefined && (missing0 = "highlights")) {
        validate77.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.from !== undefined) {
          let data0 = data.from;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (errors === _errs1) {
              if (typeof data0 === "string") {
                if (!formats0.validate(data0)) {
                  validate77.errors = [{ instancePath: instancePath + "/from", schemaPath: "#/properties/from/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                  return false;
                }
              } else {
                validate77.errors = [{ instancePath: instancePath + "/from", schemaPath: "#/properties/from/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.to !== undefined) {
            let data1 = data.to;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (errors === _errs3) {
                if (typeof data1 === "string") {
                  if (!formats0.validate(data1)) {
                    validate77.errors = [{ instancePath: instancePath + "/to", schemaPath: "#/properties/to/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                    return false;
                  }
                } else {
                  validate77.errors = [{ instancePath: instancePath + "/to", schemaPath: "#/properties/to/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.count !== undefined) {
              let data2 = data.count;
              const _errs5 = errors;
              if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                validate77.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.speakers !== undefined) {
                let data3 = data.speakers;
                const _errs7 = errors;
                if (errors === _errs7) {
                  if (Array.isArray(data3)) {
                    var valid1 = true;
                    const len0 = data3.length;
                    for (let i0 = 0;i0 < len0; i0++) {
                      let data4 = data3[i0];
                      const _errs9 = errors;
                      if (errors === _errs9) {
                        if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                          let missing1;
                          if (data4.name === undefined && (missing1 = "name") || data4.count === undefined && (missing1 = "count")) {
                            validate77.errors = [{ instancePath: instancePath + "/speakers/" + i0, schemaPath: "#/properties/speakers/items/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                            return false;
                          } else {
                            if (data4.name !== undefined) {
                              const _errs11 = errors;
                              if (typeof data4.name !== "string") {
                                validate77.errors = [{ instancePath: instancePath + "/speakers/" + i0 + "/name", schemaPath: "#/properties/speakers/items/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                return false;
                              }
                              var valid2 = _errs11 === errors;
                            } else {
                              var valid2 = true;
                            }
                            if (valid2) {
                              if (data4.count !== undefined) {
                                let data6 = data4.count;
                                const _errs13 = errors;
                                if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
                                  validate77.errors = [{ instancePath: instancePath + "/speakers/" + i0 + "/count", schemaPath: "#/properties/speakers/items/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                  return false;
                                }
                                var valid2 = _errs13 === errors;
                              } else {
                                var valid2 = true;
                              }
                            }
                          }
                        } else {
                          validate77.errors = [{ instancePath: instancePath + "/speakers/" + i0, schemaPath: "#/properties/speakers/items/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                          return false;
                        }
                      }
                      var valid1 = _errs9 === errors;
                      if (!valid1) {
                        break;
                      }
                    }
                  } else {
                    validate77.errors = [{ instancePath: instancePath + "/speakers", schemaPath: "#/properties/speakers/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.keywords !== undefined) {
                  let data7 = data.keywords;
                  const _errs15 = errors;
                  if (errors === _errs15) {
                    if (Array.isArray(data7)) {
                      var valid3 = true;
                      const len1 = data7.length;
                      for (let i1 = 0;i1 < len1; i1++) {
                        let data8 = data7[i1];
                        const _errs17 = errors;
                        if (errors === _errs17) {
                          if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
                            let missing2;
                            if (data8.word === undefined && (missing2 = "word") || data8.count === undefined && (missing2 = "count")) {
                              validate77.errors = [{ instancePath: instancePath + "/keywords/" + i1, schemaPath: "#/properties/keywords/items/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                              return false;
                            } else {
                              if (data8.word !== undefined) {
                                const _errs19 = errors;
                                if (typeof data8.word !== "string") {
                                  validate77.errors = [{ instancePath: instancePath + "/keywords/" + i1 + "/word", schemaPath: "#/properties/keywords/items/properties/word/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                                var valid4 = _errs19 === errors;
                              } else {
                                var valid4 = true;
                              }
                              if (valid4) {
                                if (data8.count !== undefined) {
                                  let data10 = data8.count;
                                  const _errs21 = errors;
                                  if (!(typeof data10 == "number" && (!(data10 % 1) && !isNaN(data10)) && isFinite(data10))) {
                                    validate77.errors = [{ instancePath: instancePath + "/keywords/" + i1 + "/count", schemaPath: "#/properties/keywords/items/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                    return false;
                                  }
                                  var valid4 = _errs21 === errors;
                                } else {
                                  var valid4 = true;
                                }
                              }
                            }
                          } else {
                            validate77.errors = [{ instancePath: instancePath + "/keywords/" + i1, schemaPath: "#/properties/keywords/items/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid3 = _errs17 === errors;
                        if (!valid3) {
                          break;
                        }
                      }
                    } else {
                      validate77.errors = [{ instancePath: instancePath + "/keywords", schemaPath: "#/properties/keywords/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs15 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.highlights !== undefined) {
                    let data11 = data.highlights;
                    const _errs23 = errors;
                    if (errors === _errs23) {
                      if (Array.isArray(data11)) {
                        var valid5 = true;
                        const len2 = data11.length;
                        for (let i2 = 0;i2 < len2; i2++) {
                          const _errs25 = errors;
                          if (!validate63(data11[i2], { instancePath: instancePath + "/highlights/" + i2, parentData: data11, parentDataProperty: i2, rootData, dynamicAnchors })) {
                            vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
                            errors = vErrors.length;
                          }
                          var valid5 = _errs25 === errors;
                          if (!valid5) {
                            break;
                          }
                        }
                      } else {
                        validate77.errors = [{ instancePath: instancePath + "/highlights", schemaPath: "#/properties/highlights/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
      }
    } else {
      validate77.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate77.errors = vErrors;
  return errors === 0;
}
validate77.evaluated = { props: { from: true, to: true, count: true, speakers: true, keywords: true, highlights: true }, dynamicProps: false, dynamicItems: false };
var validateDigest = validate79;
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
      if (data.ok === undefined && (missing0 = "ok") || data.room === undefined && (missing0 = "room") || data.span === undefined && (missing0 = "span") || data.considered === undefined && (missing0 = "considered") || data.slices === undefined && (missing0 = "slices") || data.note === undefined && (missing0 = "note")) {
        validate79.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate79.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.room !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.room, { instancePath: instancePath + "/room", parentData: data, parentDataProperty: "room", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.span !== undefined) {
              const _errs3 = errors;
              if (typeof data.span !== "string") {
                validate79.errors = [{ instancePath: instancePath + "/span", schemaPath: "#/properties/span/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.considered !== undefined) {
                let data3 = data.considered;
                const _errs5 = errors;
                if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                  validate79.errors = [{ instancePath: instancePath + "/considered", schemaPath: "#/properties/considered/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.slices !== undefined) {
                  let data4 = data.slices;
                  const _errs7 = errors;
                  if (errors === _errs7) {
                    if (Array.isArray(data4)) {
                      var valid1 = true;
                      const len0 = data4.length;
                      for (let i0 = 0;i0 < len0; i0++) {
                        const _errs9 = errors;
                        if (!validate77(data4[i0], { instancePath: instancePath + "/slices/" + i0, parentData: data4, parentDataProperty: i0, rootData, dynamicAnchors })) {
                          vErrors = vErrors === null ? validate77.errors : vErrors.concat(validate77.errors);
                          errors = vErrors.length;
                        }
                        var valid1 = _errs9 === errors;
                        if (!valid1) {
                          break;
                        }
                      }
                    } else {
                      validate79.errors = [{ instancePath: instancePath + "/slices", schemaPath: "#/properties/slices/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs7 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.note !== undefined) {
                    const _errs10 = errors;
                    if (typeof data.note !== "string") {
                      validate79.errors = [{ instancePath: instancePath + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
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
      validate79.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate79.errors = vErrors;
  return errors === 0;
}
validate79.evaluated = { props: { ok: true, room: true, span: true, considered: true, slices: true, note: true }, dynamicProps: false, dynamicItems: false };
var validateSendRequest = validate82;
var func1 = require_ucs2length().default;
function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate82.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.room === undefined && (missing0 = "room") || data.text === undefined && (missing0 = "text")) {
        validate82.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.room !== undefined) {
          let data0 = data.room;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (typeof data0 === "string") {
              if (func1(data0) < 1) {
                validate82.errors = [{ instancePath: instancePath + "/room", schemaPath: "#/properties/room/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                return false;
              }
            } else {
              validate82.errors = [{ instancePath: instancePath + "/room", schemaPath: "#/properties/room/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                  validate82.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                  return false;
                }
              } else {
                validate82.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.dryRun !== undefined) {
              const _errs5 = errors;
              if (typeof data.dryRun !== "boolean") {
                validate82.errors = [{ instancePath: instancePath + "/dryRun", schemaPath: "#/properties/dryRun/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.openRoom !== undefined) {
                const _errs7 = errors;
                if (typeof data.openRoom !== "boolean") {
                  validate82.errors = [{ instancePath: instancePath + "/openRoom", schemaPath: "#/properties/openRoom/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate82.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate82.errors = vErrors;
  return errors === 0;
}
validate82.evaluated = { props: { room: true, text: true, dryRun: true, openRoom: true }, dynamicProps: false, dynamicItems: false };
var validateSendResult = validate83;
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
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.submitted === undefined && (missing0 = "submitted") || data.dryRun === undefined && (missing0 = "dryRun") || data.room === undefined && (missing0 = "room") || data.length === undefined && (missing0 = "length") || data.roomId === undefined && (missing0 = "roomId")) {
        validate83.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate83.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.submitted !== undefined) {
            const _errs2 = errors;
            if (typeof data.submitted !== "boolean") {
              validate83.errors = [{ instancePath: instancePath + "/submitted", schemaPath: "#/properties/submitted/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.dryRun !== undefined) {
              const _errs4 = errors;
              if (typeof data.dryRun !== "boolean") {
                validate83.errors = [{ instancePath: instancePath + "/dryRun", schemaPath: "#/properties/dryRun/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.room !== undefined) {
                const _errs6 = errors;
                if (typeof data.room !== "string") {
                  validate83.errors = [{ instancePath: instancePath + "/room", schemaPath: "#/properties/room/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.roomId !== undefined) {
                  const _errs8 = errors;
                  if (typeof data.roomId !== "string") {
                    validate83.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.length !== undefined) {
                    let data5 = data.length;
                    const _errs10 = errors;
                    if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                      validate83.errors = [{ instancePath: instancePath + "/length", schemaPath: "#/properties/length/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.clearedDraft !== undefined) {
                      const _errs12 = errors;
                      if (typeof data.clearedDraft !== "boolean") {
                        validate83.errors = [{ instancePath: instancePath + "/clearedDraft", schemaPath: "#/properties/clearedDraft/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                        return false;
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.wouldClearDraft !== undefined) {
                        const _errs14 = errors;
                        if (typeof data.wouldClearDraft !== "boolean") {
                          validate83.errors = [{ instancePath: instancePath + "/wouldClearDraft", schemaPath: "#/properties/wouldClearDraft/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                          return false;
                        }
                        var valid0 = _errs14 === errors;
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
      validate83.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate83.errors = vErrors;
  return errors === 0;
}
validate83.evaluated = { props: { ok: true, submitted: true, dryRun: true, room: true, roomId: true, length: true, clearedDraft: true, wouldClearDraft: true }, dynamicProps: false, dynamicItems: false };
var validateUploadRequest = validate84;
var schema36 = { type: "object", required: ["room", "file"], additionalProperties: false, properties: { room: { type: "string" }, file: { type: "string", format: "binary" }, openRoom: { type: "string", enum: ["true", "false"] } } };
function validate84(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate84.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.room === undefined && (missing0 = "room") || data.file === undefined && (missing0 = "file")) {
        validate84.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "room" || key0 === "file" || key0 === "openRoom")) {
            validate84.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.room !== undefined) {
            const _errs2 = errors;
            if (typeof data.room !== "string") {
              validate84.errors = [{ instancePath: instancePath + "/room", schemaPath: "#/properties/room/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.file !== undefined) {
              const _errs4 = errors;
              if (errors === _errs4) {
                if (errors === _errs4) {
                  if (!(typeof data.file === "string")) {
                    validate84.errors = [{ instancePath: instancePath + "/file", schemaPath: "#/properties/file/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.openRoom !== undefined) {
                let data2 = data.openRoom;
                const _errs6 = errors;
                if (typeof data2 !== "string") {
                  validate84.errors = [{ instancePath: instancePath + "/openRoom", schemaPath: "#/properties/openRoom/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                if (!(data2 === "true" || data2 === "false")) {
                  validate84.errors = [{ instancePath: instancePath + "/openRoom", schemaPath: "#/properties/openRoom/enum", keyword: "enum", params: { allowedValues: schema36.properties.openRoom.enum }, message: "must be equal to one of the allowed values" }];
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
    } else {
      validate84.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate84.errors = vErrors;
  return errors === 0;
}
validate84.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
var validateUploadResult = validate85;
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
      if (data.ok === undefined && (missing0 = "ok") || data.submitted === undefined && (missing0 = "submitted") || data.room === undefined && (missing0 = "room") || data.roomId === undefined && (missing0 = "roomId") || data.name === undefined && (missing0 = "name") || data.size === undefined && (missing0 = "size")) {
        validate85.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate85.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.submitted !== undefined) {
            const _errs2 = errors;
            if (typeof data.submitted !== "boolean") {
              validate85.errors = [{ instancePath: instancePath + "/submitted", schemaPath: "#/properties/submitted/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.room !== undefined) {
              const _errs4 = errors;
              if (typeof data.room !== "string") {
                validate85.errors = [{ instancePath: instancePath + "/room", schemaPath: "#/properties/room/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.roomId !== undefined) {
                const _errs6 = errors;
                if (typeof data.roomId !== "string") {
                  validate85.errors = [{ instancePath: instancePath + "/roomId", schemaPath: "#/properties/roomId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.name !== undefined) {
                  const _errs8 = errors;
                  if (typeof data.name !== "string") {
                    validate85.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.size !== undefined) {
                    let data5 = data.size;
                    const _errs10 = errors;
                    if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                      validate85.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
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
      validate85.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate85.errors = vErrors;
  return errors === 0;
}
validate85.evaluated = { props: { ok: true, submitted: true, room: true, roomId: true, name: true, size: true }, dynamicProps: false, dynamicItems: false };
var validateStreamReady = validate86;
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
    if (data && typeof data == "object" && !Array.isArray(data)) {
      for (const key0 in data) {
        const _errs2 = errors;
        if (typeof data[key0] !== "string") {
          validate87.errors = [{ instancePath: instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
          return false;
        }
        var valid0 = _errs2 === errors;
        if (!valid0) {
          break;
        }
      }
    } else {
      validate87.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate87.errors = vErrors;
  return errors === 0;
}
validate87.evaluated = { props: true, dynamicProps: false, dynamicItems: false };
function validate86(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate86.evaluated;
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
        validate86.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate86.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
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
              validate86.errors = [{ instancePath: instancePath + "/resumed", schemaPath: "#/properties/resumed/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.cursor !== undefined) {
              const _errs4 = errors;
              if (!validate87(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
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
    } else {
      validate86.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate86.errors = vErrors;
  return errors === 0;
}
validate86.evaluated = { props: { ok: true, resumed: true, cursor: true }, dynamicProps: false, dynamicItems: false };
var validateStreamMessage = validate89;
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
      if (data.ok === undefined && (missing0 = "ok") || data.message === undefined && (missing0 = "message")) {
        validate89.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate89.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.message !== undefined) {
            const _errs2 = errors;
            if (!validate63(data.message, { instancePath: instancePath + "/message", parentData: data, parentDataProperty: "message", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
              errors = vErrors.length;
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
validate89.evaluated = { props: { ok: true, message: true }, dynamicProps: false, dynamicItems: false };
var validateStreamCursor = validate91;
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
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.cursor === undefined && (missing0 = "cursor")) {
        validate91.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate91.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.cursor !== undefined) {
            const _errs2 = errors;
            if (!validate87(data.cursor, { instancePath: instancePath + "/cursor", parentData: data, parentDataProperty: "cursor", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate87.errors : vErrors.concat(validate87.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate91.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate91.errors = vErrors;
  return errors === 0;
}
validate91.evaluated = { props: { ok: true, cursor: true }, dynamicProps: false, dynamicItems: false };
var validateStreamPing = validate93;
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
      let missing0;
      if (data.ok === undefined && (missing0 = "ok")) {
        validate93.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          if (data.ok !== true) {
            validate93.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
        }
      }
    } else {
      validate93.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate93.errors = vErrors;
  return errors === 0;
}
validate93.evaluated = { props: { ok: true }, dynamicProps: false, dynamicItems: false };
var validateCursor = validate87;
var validateReaction = validate68;
var validateNotice = validate94;
var schema43 = { type: "object", required: ["text", "kind", "authorId", "author", "postedAt", "source"], properties: { text: { type: "string" }, kind: { type: "string" }, authorId: { type: ["string", "null"] }, author: { type: ["string", "null"] }, postedAt: { type: ["string", "null"], format: "date-time" }, source: { type: "string", enum: ["board", "legacy"] }, truncated: { const: true }, fullText: { type: "string" }, fullTextMessageId: { type: "string" }, fullTextSource: { type: "string", enum: ["share", "message"] }, fullTextTruncated: { const: true }, fullTextCandidates: { type: "array", items: { type: "string" } } } };
function validate94(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate94.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.text === undefined && (missing0 = "text") || data.kind === undefined && (missing0 = "kind") || data.authorId === undefined && (missing0 = "authorId") || data.author === undefined && (missing0 = "author") || data.postedAt === undefined && (missing0 = "postedAt") || data.source === undefined && (missing0 = "source")) {
        validate94.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.text !== undefined) {
          const _errs1 = errors;
          if (typeof data.text !== "string") {
            validate94.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.kind !== undefined) {
            const _errs3 = errors;
            if (typeof data.kind !== "string") {
              validate94.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.authorId !== undefined) {
              let data2 = data.authorId;
              const _errs5 = errors;
              if (typeof data2 !== "string" && data2 !== null) {
                validate94.errors = [{ instancePath: instancePath + "/authorId", schemaPath: "#/properties/authorId/type", keyword: "type", params: { type: schema43.properties.authorId.type }, message: "must be string,null" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.author !== undefined) {
                let data3 = data.author;
                const _errs7 = errors;
                if (typeof data3 !== "string" && data3 !== null) {
                  validate94.errors = [{ instancePath: instancePath + "/author", schemaPath: "#/properties/author/type", keyword: "type", params: { type: schema43.properties.author.type }, message: "must be string,null" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.postedAt !== undefined) {
                  let data4 = data.postedAt;
                  const _errs9 = errors;
                  if (typeof data4 !== "string" && data4 !== null) {
                    validate94.errors = [{ instancePath: instancePath + "/postedAt", schemaPath: "#/properties/postedAt/type", keyword: "type", params: { type: schema43.properties.postedAt.type }, message: "must be string,null" }];
                    return false;
                  }
                  if (errors === _errs9) {
                    if (errors === _errs9) {
                      if (typeof data4 === "string") {
                        if (!formats0.validate(data4)) {
                          validate94.errors = [{ instancePath: instancePath + "/postedAt", schemaPath: "#/properties/postedAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                          return false;
                        }
                      }
                    }
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.source !== undefined) {
                    let data5 = data.source;
                    const _errs11 = errors;
                    if (typeof data5 !== "string") {
                      validate94.errors = [{ instancePath: instancePath + "/source", schemaPath: "#/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    if (!(data5 === "board" || data5 === "legacy")) {
                      validate94.errors = [{ instancePath: instancePath + "/source", schemaPath: "#/properties/source/enum", keyword: "enum", params: { allowedValues: schema43.properties.source.enum }, message: "must be equal to one of the allowed values" }];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.truncated !== undefined) {
                      const _errs13 = errors;
                      if (data.truncated !== true) {
                        validate94.errors = [{ instancePath: instancePath + "/truncated", schemaPath: "#/properties/truncated/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                        return false;
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.fullText !== undefined) {
                        const _errs14 = errors;
                        if (typeof data.fullText !== "string") {
                          validate94.errors = [{ instancePath: instancePath + "/fullText", schemaPath: "#/properties/fullText/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                        var valid0 = _errs14 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.fullTextMessageId !== undefined) {
                          const _errs16 = errors;
                          if (typeof data.fullTextMessageId !== "string") {
                            validate94.errors = [{ instancePath: instancePath + "/fullTextMessageId", schemaPath: "#/properties/fullTextMessageId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.fullTextSource !== undefined) {
                            let data9 = data.fullTextSource;
                            const _errs18 = errors;
                            if (typeof data9 !== "string") {
                              validate94.errors = [{ instancePath: instancePath + "/fullTextSource", schemaPath: "#/properties/fullTextSource/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                            if (!(data9 === "share" || data9 === "message")) {
                              validate94.errors = [{ instancePath: instancePath + "/fullTextSource", schemaPath: "#/properties/fullTextSource/enum", keyword: "enum", params: { allowedValues: schema43.properties.fullTextSource.enum }, message: "must be equal to one of the allowed values" }];
                              return false;
                            }
                            var valid0 = _errs18 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.fullTextTruncated !== undefined) {
                              const _errs20 = errors;
                              if (data.fullTextTruncated !== true) {
                                validate94.errors = [{ instancePath: instancePath + "/fullTextTruncated", schemaPath: "#/properties/fullTextTruncated/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                                return false;
                              }
                              var valid0 = _errs20 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.fullTextCandidates !== undefined) {
                                let data11 = data.fullTextCandidates;
                                const _errs21 = errors;
                                if (errors === _errs21) {
                                  if (Array.isArray(data11)) {
                                    var valid1 = true;
                                    const len0 = data11.length;
                                    for (let i0 = 0;i0 < len0; i0++) {
                                      const _errs23 = errors;
                                      if (typeof data11[i0] !== "string") {
                                        validate94.errors = [{ instancePath: instancePath + "/fullTextCandidates/" + i0, schemaPath: "#/properties/fullTextCandidates/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                      var valid1 = _errs23 === errors;
                                      if (!valid1) {
                                        break;
                                      }
                                    }
                                  } else {
                                    validate94.errors = [{ instancePath: instancePath + "/fullTextCandidates", schemaPath: "#/properties/fullTextCandidates/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
      }
    } else {
      validate94.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate94.errors = vErrors;
  return errors === 0;
}
validate94.evaluated = { props: { text: true, kind: true, authorId: true, author: true, postedAt: true, source: true, truncated: true, fullText: true, fullTextMessageId: true, fullTextSource: true, fullTextTruncated: true, fullTextCandidates: true }, dynamicProps: false, dynamicItems: false };
var validateNoticeAnswer = validate95;
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
      if (data.ok === undefined && (missing0 = "ok") || data.room === undefined && (missing0 = "room") || data.notice === undefined && (missing0 = "notice")) {
        validate95.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate95.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.room !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.room, { instancePath: instancePath + "/room", parentData: data, parentDataProperty: "room", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.notice !== undefined) {
              let data2 = data.notice;
              const _errs3 = errors;
              const _errs4 = errors;
              let valid1 = false;
              let passing0 = null;
              const _errs5 = errors;
              if (!validate94(data2, { instancePath: instancePath + "/notice", parentData: data, parentDataProperty: "notice", rootData, dynamicAnchors })) {
                vErrors = vErrors === null ? validate94.errors : vErrors.concat(validate94.errors);
                errors = vErrors.length;
              }
              var _valid0 = _errs5 === errors;
              if (_valid0) {
                valid1 = true;
                passing0 = 0;
                var props0 = {};
                props0.text = true;
                props0.kind = true;
                props0.authorId = true;
                props0.author = true;
                props0.postedAt = true;
                props0.source = true;
                props0.truncated = true;
                props0.fullText = true;
                props0.fullTextMessageId = true;
                props0.fullTextSource = true;
                props0.fullTextTruncated = true;
                props0.fullTextCandidates = true;
              }
              const _errs6 = errors;
              if (data2 !== null) {
                const err0 = { instancePath: instancePath + "/notice", schemaPath: "#/properties/notice/oneOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                if (vErrors === null) {
                  vErrors = [err0];
                } else {
                  vErrors.push(err0);
                }
                errors++;
              }
              var _valid0 = _errs6 === errors;
              if (_valid0 && valid1) {
                valid1 = false;
                passing0 = [passing0, 1];
              } else {
                if (_valid0) {
                  valid1 = true;
                  passing0 = 1;
                }
              }
              if (!valid1) {
                const err1 = { instancePath: instancePath + "/notice", schemaPath: "#/properties/notice/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
                if (vErrors === null) {
                  vErrors = [err1];
                } else {
                  vErrors.push(err1);
                }
                errors++;
                validate95.errors = vErrors;
                return false;
              } else {
                errors = _errs4;
                if (vErrors !== null) {
                  if (_errs4) {
                    vErrors.length = _errs4;
                  } else {
                    vErrors = null;
                  }
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
      validate95.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate95.errors = vErrors;
  return errors === 0;
}
validate95.evaluated = { props: { ok: true, room: true, notice: true }, dynamicProps: false, dynamicItems: false };
var validateAttachment = validate98;
var schema45 = { type: "object", required: ["messageId", "kind", "senderId", "sender", "sentAt", "url"], properties: { messageId: { type: "string" }, kind: { type: "string", enum: ["photo", "video", "file", "link"] }, senderId: { type: "string" }, sender: { type: "string" }, sentAt: { type: ["string", "null"], format: "date-time" }, url: { type: "string" }, name: { type: "string" }, size: { type: "integer" }, count: { type: "integer", minimum: 2 }, expiresAt: { type: "string", format: "date-time" } } };
function validate98(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate98.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.messageId === undefined && (missing0 = "messageId") || data.kind === undefined && (missing0 = "kind") || data.senderId === undefined && (missing0 = "senderId") || data.sender === undefined && (missing0 = "sender") || data.sentAt === undefined && (missing0 = "sentAt") || data.url === undefined && (missing0 = "url")) {
        validate98.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.messageId !== undefined) {
          const _errs1 = errors;
          if (typeof data.messageId !== "string") {
            validate98.errors = [{ instancePath: instancePath + "/messageId", schemaPath: "#/properties/messageId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.kind !== undefined) {
            let data1 = data.kind;
            const _errs3 = errors;
            if (typeof data1 !== "string") {
              validate98.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            if (!(data1 === "photo" || data1 === "video" || data1 === "file" || data1 === "link")) {
              validate98.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: schema45.properties.kind.enum }, message: "must be equal to one of the allowed values" }];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.senderId !== undefined) {
              const _errs5 = errors;
              if (typeof data.senderId !== "string") {
                validate98.errors = [{ instancePath: instancePath + "/senderId", schemaPath: "#/properties/senderId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.sender !== undefined) {
                const _errs7 = errors;
                if (typeof data.sender !== "string") {
                  validate98.errors = [{ instancePath: instancePath + "/sender", schemaPath: "#/properties/sender/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.sentAt !== undefined) {
                  let data4 = data.sentAt;
                  const _errs9 = errors;
                  if (typeof data4 !== "string" && data4 !== null) {
                    validate98.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/type", keyword: "type", params: { type: schema45.properties.sentAt.type }, message: "must be string,null" }];
                    return false;
                  }
                  if (errors === _errs9) {
                    if (errors === _errs9) {
                      if (typeof data4 === "string") {
                        if (!formats0.validate(data4)) {
                          validate98.errors = [{ instancePath: instancePath + "/sentAt", schemaPath: "#/properties/sentAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                          return false;
                        }
                      }
                    }
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.url !== undefined) {
                    const _errs11 = errors;
                    if (typeof data.url !== "string") {
                      validate98.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/properties/url/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.name !== undefined) {
                      const _errs13 = errors;
                      if (typeof data.name !== "string") {
                        validate98.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.size !== undefined) {
                        let data7 = data.size;
                        const _errs15 = errors;
                        if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)) && isFinite(data7))) {
                          validate98.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                          return false;
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.count !== undefined) {
                          let data8 = data.count;
                          const _errs17 = errors;
                          if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)) && isFinite(data8))) {
                            validate98.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                            return false;
                          }
                          if (errors === _errs17) {
                            if (typeof data8 == "number" && isFinite(data8)) {
                              if (data8 < 2 || isNaN(data8)) {
                                validate98.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 2 }, message: "must be >= 2" }];
                                return false;
                              }
                            }
                          }
                          var valid0 = _errs17 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.expiresAt !== undefined) {
                            let data9 = data.expiresAt;
                            const _errs19 = errors;
                            if (errors === _errs19) {
                              if (errors === _errs19) {
                                if (typeof data9 === "string") {
                                  if (!formats0.validate(data9)) {
                                    validate98.errors = [{ instancePath: instancePath + "/expiresAt", schemaPath: "#/properties/expiresAt/format", keyword: "format", params: { format: "date-time" }, message: 'must match format "' + "date-time" + '"' }];
                                    return false;
                                  }
                                } else {
                                  validate98.errors = [{ instancePath: instancePath + "/expiresAt", schemaPath: "#/properties/expiresAt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
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
      validate98.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate98.errors = vErrors;
  return errors === 0;
}
validate98.evaluated = { props: { messageId: true, kind: true, senderId: true, sender: true, sentAt: true, url: true, name: true, size: true, count: true, expiresAt: true }, dynamicProps: false, dynamicItems: false };
var validateAttachments = validate99;
function validate99(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate99.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.room === undefined && (missing0 = "room") || data.attachments === undefined && (missing0 = "attachments") || data.count === undefined && (missing0 = "count")) {
        validate99.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate99.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.room !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.room, { instancePath: instancePath + "/room", parentData: data, parentDataProperty: "room", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.attachments !== undefined) {
              let data2 = data.attachments;
              const _errs3 = errors;
              if (errors === _errs3) {
                if (Array.isArray(data2)) {
                  var valid1 = true;
                  const len0 = data2.length;
                  for (let i0 = 0;i0 < len0; i0++) {
                    const _errs5 = errors;
                    if (!validate98(data2[i0], { instancePath: instancePath + "/attachments/" + i0, parentData: data2, parentDataProperty: i0, rootData, dynamicAnchors })) {
                      vErrors = vErrors === null ? validate98.errors : vErrors.concat(validate98.errors);
                      errors = vErrors.length;
                    }
                    var valid1 = _errs5 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate99.errors = [{ instancePath: instancePath + "/attachments", schemaPath: "#/properties/attachments/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.count !== undefined) {
                let data4 = data.count;
                const _errs6 = errors;
                if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4))) {
                  validate99.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
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
    } else {
      validate99.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate99.errors = vErrors;
  return errors === 0;
}
validate99.evaluated = { props: { ok: true, room: true, attachments: true, count: true }, dynamicProps: false, dynamicItems: false };
var validateRevision = validate102;
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
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.revision === undefined && (missing0 = "revision") || data.text === undefined && (missing0 = "text") || data.kind === undefined && (missing0 = "kind")) {
        validate102.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.revision !== undefined) {
          let data0 = data.revision;
          const _errs1 = errors;
          if (!(typeof data0 == "number" && (!(data0 % 1) && !isNaN(data0)) && isFinite(data0))) {
            validate102.errors = [{ instancePath: instancePath + "/revision", schemaPath: "#/properties/revision/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
            return false;
          }
          if (errors === _errs1) {
            if (typeof data0 == "number" && isFinite(data0)) {
              if (data0 < 0 || isNaN(data0)) {
                validate102.errors = [{ instancePath: instancePath + "/revision", schemaPath: "#/properties/revision/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                return false;
              }
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.text !== undefined) {
            const _errs3 = errors;
            if (typeof data.text !== "string") {
              validate102.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                validate102.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
      validate102.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate102.errors = vErrors;
  return errors === 0;
}
validate102.evaluated = { props: { revision: true, text: true, kind: true }, dynamicProps: false, dynamicItems: false };
var validateRevisions = validate103;
function validate103(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate103.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.room === undefined && (missing0 = "room") || data.messageId === undefined && (missing0 = "messageId") || data.revisions === undefined && (missing0 = "revisions") || data.count === undefined && (missing0 = "count")) {
        validate103.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate103.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.room !== undefined) {
            const _errs2 = errors;
            if (!validate55(data.room, { instancePath: instancePath + "/room", parentData: data, parentDataProperty: "room", rootData, dynamicAnchors })) {
              vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.messageId !== undefined) {
              const _errs3 = errors;
              if (typeof data.messageId !== "string") {
                validate103.errors = [{ instancePath: instancePath + "/messageId", schemaPath: "#/properties/messageId/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.revisions !== undefined) {
                let data3 = data.revisions;
                const _errs5 = errors;
                if (errors === _errs5) {
                  if (Array.isArray(data3)) {
                    var valid1 = true;
                    const len0 = data3.length;
                    for (let i0 = 0;i0 < len0; i0++) {
                      const _errs7 = errors;
                      if (!validate102(data3[i0], { instancePath: instancePath + "/revisions/" + i0, parentData: data3, parentDataProperty: i0, rootData, dynamicAnchors })) {
                        vErrors = vErrors === null ? validate102.errors : vErrors.concat(validate102.errors);
                        errors = vErrors.length;
                      }
                      var valid1 = _errs7 === errors;
                      if (!valid1) {
                        break;
                      }
                    }
                  } else {
                    validate103.errors = [{ instancePath: instancePath + "/revisions", schemaPath: "#/properties/revisions/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.count !== undefined) {
                  let data5 = data.count;
                  const _errs8 = errors;
                  if (!(typeof data5 == "number" && (!(data5 % 1) && !isNaN(data5)) && isFinite(data5))) {
                    validate103.errors = [{ instancePath: instancePath + "/count", schemaPath: "#/properties/count/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
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
    } else {
      validate103.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate103.errors = vErrors;
  return errors === 0;
}
validate103.evaluated = { props: { ok: true, room: true, messageId: true, revisions: true, count: true }, dynamicProps: false, dynamicItems: false };
var validateHealthResponse = validate106;
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
      if (data.ok === undefined && (missing0 = "ok")) {
        validate106.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate106.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.features !== undefined) {
            let data1 = data.features;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                if (data1.upload !== undefined) {
                  let data2 = data1.upload;
                  const _errs4 = errors;
                  if (errors === _errs4) {
                    if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
                      let missing1;
                      if (data2.maxBytes === undefined && (missing1 = "maxBytes")) {
                        validate106.errors = [{ instancePath: instancePath + "/features/upload", schemaPath: "#/properties/features/properties/upload/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                        return false;
                      } else {
                        if (data2.maxBytes !== undefined) {
                          let data3 = data2.maxBytes;
                          const _errs6 = errors;
                          if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                            validate106.errors = [{ instancePath: instancePath + "/features/upload/maxBytes", schemaPath: "#/properties/features/properties/upload/properties/maxBytes/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                            return false;
                          }
                          if (errors === _errs6) {
                            if (typeof data3 == "number" && isFinite(data3)) {
                              if (data3 < 1 || isNaN(data3)) {
                                validate106.errors = [{ instancePath: instancePath + "/features/upload/maxBytes", schemaPath: "#/properties/features/properties/upload/properties/maxBytes/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                                return false;
                              }
                            }
                          }
                        }
                      }
                    } else {
                      validate106.errors = [{ instancePath: instancePath + "/features/upload", schemaPath: "#/properties/features/properties/upload/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                }
              } else {
                validate106.errors = [{ instancePath: instancePath + "/features", schemaPath: "#/properties/features/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
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
      validate106.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate106.errors = vErrors;
  return errors === 0;
}
validate106.evaluated = { props: { ok: true, features: true }, dynamicProps: false, dynamicItems: false };
var validateRoomsResponse = validate107;
function validate107(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate107.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.ok === undefined && (missing0 = "ok") || data.rooms === undefined && (missing0 = "rooms")) {
        validate107.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        if (data.ok !== undefined) {
          const _errs1 = errors;
          if (data.ok !== true) {
            validate107.errors = [{ instancePath: instancePath + "/ok", schemaPath: "#/properties/ok/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
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
                  if (!validate55(data1[i0], { instancePath: instancePath + "/rooms/" + i0, parentData: data1, parentDataProperty: i0, rootData, dynamicAnchors })) {
                    vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate107.errors = [{ instancePath: instancePath + "/rooms", schemaPath: "#/properties/rooms/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
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
      validate107.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate107.errors = vErrors;
  return errors === 0;
}
validate107.evaluated = { props: { ok: true, rooms: true }, dynamicProps: false, dynamicItems: false };
export {
  validateAttachment,
  validateAttachments,
  validateAttention,
  validateContext,
  validateCoverage,
  validateCursor,
  validateDigest,
  validateDigestSlice,
  validateErrorCode,
  validateErrorEnvelope,
  validateHealthResponse,
  validateMention,
  validateMessage,
  validateNotice,
  validateNoticeAnswer,
  validatePhoto,
  validatePhotoImage,
  validateReaction,
  validateReplySource,
  validateRevision,
  validateRevisions,
  validateRoom,
  validateRoomsResponse,
  validateSendRequest,
  validateSendResult,
  validateStreamCursor,
  validateStreamMessage,
  validateStreamPing,
  validateStreamReady,
  validateUploadRequest,
  validateUploadResult,
  validateVideo
};
