"use strict";

require("core-js/modules/es6.promise");

require("core-js/modules/es7.object.entries");

require("colors");

var _lib = _interopRequireDefault(require("./lib"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

class CloudflareWorkerPlugin {
  constructor(authEmail = null, authKey = null, {
    zone = null,
    enabled = true,
    pattern
  }) {
    const requiredParams = {
      'CF-Account-Email': authEmail,
      'CF-API-Key': authKey,
      zone
    };

    var _arr = Object.entries(requiredParams);

    for (var _i = 0; _i < _arr.length; _i++) {
      let _arr$_i = _arr[_i],
          key = _arr$_i[0],
          value = _arr$_i[1];

      if (typeof value !== 'string') {
        throw new Error(`'${key}' either missing, or not a string`.red);
      }
    }

    if ({
      pattern
    }.hasOwnProperty('pattern') && typeof pattern !== 'string') {
      throw new Error(`'pattern' must be a string.`.red);
    }

    this._enabled = !!enabled;
    this._pattern = pattern;
    this._cfMethods = enabled ? Object.assign({}, (0, _lib.default)(authEmail, authKey, zone)) : {};
  }

  disableExistingRoutes() {
    var _this = this;

    function _ref3(r) {
      return r.pattern === _this._pattern;
    }

    function _ref4(r) {
      return r.pattern !== _this._pattern;
    }

    return _asyncToGenerator(function* () {
      let _ref = yield _this._cfMethods.getRoutes(),
          result = _ref.result;

      const matchingResult = result.find(_ref3);

      if (matchingResult) {
        yield _this._cfMethods.deleteRoute(matchingResult);
        result = result.filter(_ref4);
      }

      yield Promise.all(result.map(_this._cfMethods.disableRoute));
    })();
  }

  upsertNewPattern() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2.disableExistingRoutes();
      yield _this2._cfMethods.createRoute(_this2._pattern);
    })();
  }

  apply(compiler) {
    var _this3 = this;

    function* _ref5(compilation) {
      if (!_this3._enabled) return console.info(`Cloudflare deployment disabled.`.yellow);

      try {
        const filename = compilation.outputOptions.filename;
        const workerScript = compilation.assets[filename].source();

        if (_this3._pattern) {
          yield _this3.upsertNewPattern();
        }

        return _this3._cfMethods.uploadWorker(Buffer.from(workerScript));
      } catch (err) {
        console.error(`${err.message}`.red);
        throw err;
      }
    }

    return compiler.hooks.emit.tapPromise('CloudflareWorkerPlugin',
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(_ref5);

      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    }());
  }

}

module.exports = CloudflareWorkerPlugin;