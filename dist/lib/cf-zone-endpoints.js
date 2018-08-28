"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.queryZoneInfo = queryZoneInfo;

require("colors");

var _axios = _interopRequireDefault(require("axios"));

var _isValidDomain = _interopRequireDefault(require("is-valid-domain"));

var _bootstrap = require("./bootstrap");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function queryZoneInfo(_x, _x2, _x3) {
  return _queryZoneInfo.apply(this, arguments);
}

function _ref(response) {
  return response.data;
}

function _ref2(error) {
  (0, _bootstrap.printError)(error);
  throw error;
}

function* _ref3(authEmail, authKey, {
  site: name
}) {
  if (!(0, _isValidDomain.default)(name)) throw new Error(`Provided site '${name}' is not a valid FQDN`);
  const request = yield (0, _axios.default)({
    url: `https://api.cloudflare.com/client/v4/zones`,
    method: 'GET',
    headers: {
      'x-auth-email': authEmail,
      'x-auth-key': authKey,
      'content-type': 'application/json'
    },
    params: {
      name
    }
  }).then(_ref).catch(_ref2);
  const result = request.result;
  if (!result.length) throw new Error(`Unable to find zone-id`);
  const zoneData = result.shift();
  validatePermissions(zoneData);
  const id = zoneData.id;
  return id;
}

function _queryZoneInfo() {
  _queryZoneInfo = _asyncToGenerator(_ref3);
  return _queryZoneInfo.apply(this, arguments);
}

function validatePermissions({
  permissions
}) {
  if (!permissions.includes(`#worker:read`)) throw new Error(`You do not have worker:read permission`);
  if (!permissions.includes(`#worker:edit`)) throw new Error(`You do not have worker:edit permission`);
}