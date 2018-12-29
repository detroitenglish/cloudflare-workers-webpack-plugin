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

async function queryZoneInfo(authEmail, authKey, {
  site: name
}) {
  if (!(0, _isValidDomain.default)(name)) throw new Error(`Provided site '${name}' is not a valid FQDN`);
  const request = await (0, _axios.default)({
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
  }).then(response => response.data).catch(error => {
    (0, _bootstrap.printError)(error);
    throw error;
  });
  const {
    result
  } = request;
  if (!result.length) throw new Error(`Unable to find zone-id`);
  const zoneData = result.shift();
  validatePermissions(zoneData);
  const {
    id
  } = zoneData;
  return id;
}

function validatePermissions({
  permissions
}) {
  if (!permissions.includes(`#worker:read`)) throw new Error(`You do not have worker:read permission`);
  if (!permissions.includes(`#worker:edit`)) throw new Error(`You do not have worker:edit permission`);
}