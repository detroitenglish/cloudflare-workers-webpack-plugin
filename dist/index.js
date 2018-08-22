"use strict";

require("core-js/modules/es6.promise");

require("colors");

var _lib = require("./lib");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _ref3(r) {
  return r.pattern;
}

function _ref4(r) {
  return r.ok;
}

function _ref6(r) {
  return !r.ok;
}

function _ref9(r) {
  return r.ok;
}

function _ref11(r) {
  return !r.ok;
}

function* _ref13(pattern) {
  let matchingRoute;

  const matchIndex = this._existingRoutes.findIndex(r => r.pattern === pattern);

  if (matchIndex > -1) {
    matchingRoute = this._existingRoutes.splice(matchIndex, 1).pop();

    if (matchingRoute.enabled) {
      this._logg(`Pattern already enabled: ${matchingRoute.pattern}`, `green`);
    } else {
      this._logg(`Re-enabling exiting pattern: ${matchingRoute.pattern}`, `green`);

      const enabled = yield this._cfMethods.enableRoute(matchingRoute);
      if (enabled.ok) console.info(`Enabled route pattern: ${enabled.pattern}`.green);else console.error(`Failed to enabled route pattern: ${enabled.pattern}`.red);
    }

    return false;
  }

  return pattern;
}

class CloudflareWorkerPlugin {
  constructor(authEmail = null, authKey = null, {
    zone = null,
    enabled = true,
    script,
    pattern,
    clearRoutes,
    verbose,
    skipWorkerUpload
  }) {
    (0, _lib.validateConfig)(arguments);
    this._enabled = !!enabled;
    this._clearRoutes = !!clearRoutes;
    this._verbose = !!verbose;
    this._skipWorkerUpload = !!skipWorkerUpload;
    this._existingRoutes = [];
    this._script = script && enabled ? _path.default.normalize(`${process.cwd()}/${script}`) : void 0;
    this._pattern = Array.isArray(pattern) ? pattern : pattern.includes(',') ? pattern.split(',') : pattern;
    this._cfMethods = Object.assign({}, (0, _lib.cfMethods)(authEmail, authKey, zone));
  }

  _logg(stuff, color = `cyan`) {
    if (!this._verbose) return void 0;
    return typeof stuff === 'object' ? console.info(`${JSON.stringify(stuff, null, 2)}`[color]) : console.info(`${stuff}`[color]);
  }

  _clearAllExistingRoutes() {
    var _this = this;

    function _ref5(r) {
      return _this._logg(`Deleted pattern: ${r.pattern}`.yellow);
    }

    function _ref7(r) {
      return _this._logg(`Pattern deletion failed: ${r.pattern}`.red);
    }

    function _ref8(results) {
      results.filter(_ref4).forEach(_ref5);
      results.filter(_ref6).forEach(_ref7);
    }

    return _asyncToGenerator(function* () {
      if (!_this._existingRoutes.length) return;

      _this._logg(`Deleting all routes: ${_this._existingRoutes.map(_ref3).join(', ')}`);

      yield Promise.all(_this._existingRoutes.map(_this._cfMethods.deleteRoute)).then(_ref8);
      return true;
    })();
  }

  _disableRemainingRoutes() {
    var _this2 = this;

    function _ref10(r) {
      return _this2._logg(`Disabled route pattern: ${r.pattern}`.yellow);
    }

    function _ref12(r) {
      return _this2._logg(`Failed to disabled route pattern: ${r.pattern}`.red);
    }

    return _asyncToGenerator(function* () {
      const disabledRoutes = yield Promise.all(_this2._existingRoutes.map(_this2._cfMethods.disableRoute));
      disabledRoutes.filter(_ref9).forEach(_ref10);
      disabledRoutes.filter(_ref11).forEach(_ref12);
    })();
  }

  _processRoutes() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      let newRoutes = []; // bind the context for Array.map()

      const existingHandler = enableExistingMatchingRoute.bind(_this3);

      let _ref = yield _this3._cfMethods.getRoutes(),
          existingRoutes = _ref.result;

      _this3._existingRoutes.push(...existingRoutes);

      if (_this3._clearRoutes) {
        yield _this3._clearAllExistingRoutes(_this3._existingRoutes);
      }

      if (Array.isArray(_this3._pattern)) {
        newRoutes.push(...(yield Promise.all(_this3._pattern.map(existingHandler))));
      } else {
        newRoutes.push((yield existingHandler(_this3._pattern)));
      }

      yield _this3._disableRemainingRoutes(existingRoutes);
      return newRoutes.filter(Boolean);

      function enableExistingMatchingRoute(_x) {
        return _enableExistingMatchingRoute.apply(this, arguments);
      }

      function _enableExistingMatchingRoute() {
        _enableExistingMatchingRoute = _asyncToGenerator(_ref13);
        return _enableExistingMatchingRoute.apply(this, arguments);
      }
    })();
  }

  _upsertPattern() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const newRoutes = yield _this4._processRoutes();
      if (!newRoutes.length) return;
      yield Promise.all(newRoutes.map(_this4._cfMethods.createRoute));
    })();
  }

  apply(compiler) {
    var _this5 = this;

    function* _ref14(compilation) {
      if (!_this5._enabled) return console.info(`Cloudflare deployment disabled.`.yellow);

      try {
        let filename, code;

        if (!_this5._skipWorkerUpload) {
          filename = _this5._script || compilation.outputOptions.filename;
          code = compilation.assets[filename] ? compilation.assets[filename].source() : _fs.default.readFileSync(filename).toString();

          _this5._logg(`Uploading worker...`, `green`);

          yield _this5._cfMethods.uploadWorker(Buffer.from(code));
        } else {
          console.info(`Skipping Cloudflare worker upload...`.yellow);
        }

        if (_this5._pattern) {
          yield _this5._upsertPattern();
        }
      } catch (err) {
        console.error(`${err.message}`.red);
        throw err;
      }
    }

    return compiler.hooks.afterEmit.tapPromise('CloudflareWorkerPlugin',
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(_ref14);

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }());
  }

}

module.exports = CloudflareWorkerPlugin;