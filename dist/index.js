"use strict";

exports.__esModule = true;
exports.default = void 0;

require("core-js/modules/es6.promise");

var _lib = _interopRequireDefault(require("./lib"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

class CloudflareWorkerPlugin {
  constructor(authEmail, authKey, {
    zone,
    pattern
  }) {
    this._pattern = pattern;
    this._cfMethods = Object.assign({}, (0, _lib.default)(authEmail, authKey, zone));
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
      const filename = compilation.outputOptions.filename;
      const workerScript = compilation.assets[filename].source();

      if (_this3._pattern) {
        yield _this3.upsertNewPattern();
      }

      return _this3._cfMethods.uploadWorker(Buffer.from(workerScript));
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

exports.default = CloudflareWorkerPlugin;