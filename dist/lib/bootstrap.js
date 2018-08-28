"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cfMethods = cfMethods;
exports.printError = printError;
exports.validateConfig = validateConfig;
exports.logg = logg;

require("core-js/modules/es7.object.entries");

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("colors");

var _axios = _interopRequireDefault(require("axios"));

var _cfRouteEndpoints = _interopRequireDefault(require("./cf-route-endpoints"));

var _cfWorkerEndpoints = _interopRequireDefault(require("./cf-worker-endpoints"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } const _defined = function _defined(key) { _defineProperty(target, key, source[key]); }; for (let _i2 = 0; _i2 <= ownKeys.length - 1; _i2++) { _defined(ownKeys[_i2], _i2, ownKeys); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _ref(response) {
  return response.data;
}

function _ref2(err) {
  printError(err);
  throw err;
}

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

  instance.interceptors.response.use(_ref, _ref2);
  return _objectSpread({}, (0, _cfRouteEndpoints.default)(instance), (0, _cfWorkerEndpoints.default)(instance));
}

function printError(err) {
  var _err$response;

  const errors = err === null || err === void 0 ? void 0 : (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.data.errors;

  if (errors === null || errors === void 0 ? void 0 : errors.length) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = errors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let _step$value = _step.value,
            code = _step$value.code,
            message = _step$value.message;
        console.error(`[code ${code}]: ${message}`);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } else {
    console.error(err);
  }
}

function _ref3(p) {
  return typeof p === 'string';
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

  var _arr = Object.entries(requiredConfig);

  for (var _i = 0; _i < _arr.length; _i++) {
    let _arr$_i = _slicedToArray(_arr[_i], 2),
        key = _arr$_i[0],
        value = _arr$_i[1];

    if (!value) {
      throw new Error(`'${key}' is undefined`);
    }

    if (typeof value !== 'string') {
      throw new Error(`'${key}' is not a string`);
    }
  }

  if (script && typeof script !== 'string') throw new Error(`'script' is not a string`);

  if (pattern) {
    if (Array.isArray(pattern) && !pattern.every(_ref3)) {
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