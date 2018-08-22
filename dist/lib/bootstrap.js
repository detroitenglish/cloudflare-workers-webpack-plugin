"use strict";

exports.__esModule = true;
exports.default = _default;

require("colors");

var _axios = _interopRequireDefault(require("axios"));

var _cfRouteEndpoints = _interopRequireDefault(require("./cf-route-endpoints"));

var _cfWorkerEndpoints = _interopRequireDefault(require("./cf-worker-endpoints"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _ref(response) {
  return response.data;
}

function _ref2(err) {
  printError(err);
  throw err;
}

function _default(cfMail, cfKey, zoneId) {
  const instance = _axios.default.create({
    baseURL: `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
    headers: {
      'X-Auth-Email': cfMail,
      'X-Auth-Key': cfKey
    },
    timeout: 2e4
  });

  instance.interceptors.response.use(_ref, _ref2);
  return Object.assign({}, (0, _cfRouteEndpoints.default)(instance), (0, _cfWorkerEndpoints.default)(instance));
}

function _ref3(error) {
  if (error.message) console.error(`[code ${error.code}]: ${error.message}`.red);else console.error(`${JSON.stringify(error, null, 2)}`.red);
}

function printError(err) {
  var _err$response;

  const errors = err === null || err === void 0 ? void 0 : (_err$response = err.response) === null || _err$response === void 0 ? void 0 : _err$response.data.errors;

  if (errors && Array.isArray(errors)) {
    errors.forEach(_ref3);
  } else {
    console.error(err);
  }
}