"use strict";

exports.__esModule = true;
exports.default = _default;

var _axios = _interopRequireDefault(require("axios"));

var _cfRouteEndpoints = _interopRequireDefault(require("./cf-route-endpoints"));

var _cfWorkerEndpoints = _interopRequireDefault(require("./cf-worker-endpoints"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _ref(response) {
  return response.data;
}

function _ref2(err) {
  const status = err.status || err.response.status;
  if (status === 409) return {
    ok: false
  };
  console.error(err.response.data || err.message);
  Promise.reject(err);
}

function _default(cfMail, cfKey, zoneId) {
  const instance = _axios.default.create({
    baseURL: `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
    headers: {
      'X-Auth-Email': cfMail,
      'X-Auth-Key': cfKey
    }
  });

  instance.interceptors.response.use(_ref, _ref2);
  const routeFunctions = (0, _cfRouteEndpoints.default)(instance);
  const workerFunctions = (0, _cfWorkerEndpoints.default)(instance);
  return Object.assign(routeFunctions, workerFunctions);
}