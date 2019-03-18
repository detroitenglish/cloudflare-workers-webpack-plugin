"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cfMethods = cfMethods;
exports.printError = printError;
exports.validateConfig = validateConfig;
exports.logg = logg;
exports.patternsToArray = patternsToArray;

require("colors");

var _axios = _interopRequireDefault(require("axios"));

var _cfRouteEndpoints = _interopRequireDefault(require("./cf-route-endpoints"));

var _cfWorkerEndpoints = _interopRequireDefault(require("./cf-worker-endpoints"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function cfMethods(cfMail, cfKey, {
  zone
}) {
  if (!zone) return void 0;

  const instance = _axios.default.create({
    baseURL: `https://api.cloudflare.com/client/v4/zones/${zone}`,
    headers: {
      'X-Auth-Email': cfMail,
      'X-Auth-Key': cfKey
    },
    timeout: 2e4
  });

  instance.interceptors.response.use(response => response.data, err => {
    if (err.response && err.response.config.method === 'delete' && err.response.status === 404) {
      return {
        success: true
      };
    } else {
      let msg = {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data
      };
      printError(msg);
      throw new Error(JSON.stringify(msg, null, 2));
    }
  });
  return _objectSpread({}, (0, _cfRouteEndpoints.default)(instance), (0, _cfWorkerEndpoints.default)(instance));
}

function printError(err) {
  const errors = [].concat(err.response && err.response.data && err.response.data.erros).filter(Boolean);

  if (errors.length) {
    for (let _ref of errors) {
      let {
        code,
        message
      } = _ref;
      console.error(`[code ${code}]: ${message}`);
    }
  } else {
    console.error(err);
  }
}

function validateConfig([authEmail, authKey, {
  zone,
  site,
  script,
  pattern
}]) {
  if (!zone && !site) throw new Error(`You must provide either a zone-id or site name`);
  const requiredConfig = {
    'CF-Account-Email': authEmail,
    'CF-API-Key': authKey,
    zone
  };

  for (let [key, value] of Object.entries(requiredConfig)) {
    if (!value) {
      throw new Error(`'${key}' is undefined`);
    }

    if (typeof value !== 'string') {
      throw new Error(`'${key}' is not a string`);
    }
  }

  if (script && typeof script !== 'string') throw new Error(`'script' is not a string`);

  if (pattern) {
    if (Array.isArray(pattern) && !pattern.every(p => typeof p === 'string')) {
      throw new Error(`'pattern' must be a string or array of strings`);
    } else if (typeof pattern !== 'string') {
      throw new Error(`'pattern' must be a string or array of strings`);
    }
  }
}

function logg(stuff, color = `cyan`, emoji = color === `yellow` ? `⚠` : '👍') {
  if (!this._verbose) return void 0;
  let logType = color === `red` ? `error` : `info`;
  if (!this._colors) color = void 0;
  if (!this._emoji) emoji = void 0;
  let text = emoji ? `${emoji}  | ` : ``;

  switch (typeof stuff) {
    case 'object':
      text += color ? `${JSON.stringify(stuff, null, 2)}`[color] : `${JSON.stringify(stuff, null, 2)}`;
      break;

    default:
      text += color ? String(stuff)[color] : String(stuff);
  }

  console[logType](text);
}

function patternsToArray(patterns) {
  return Array.isArray(patterns) ? patterns : patterns.split(',');
}