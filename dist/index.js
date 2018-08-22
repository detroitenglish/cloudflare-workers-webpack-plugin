"use strict";

require("core-js/modules/es6.promise");

require("core-js/modules/es7.object.entries");

require("colors");

var _lib = _interopRequireDefault(require("./lib"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _ref3(r) {
  return r.pattern;
}

function _ref5(arr) {
  return arr.filter(Boolean);
}

class CloudflareWorkerPlugin {
  constructor(authEmail = null, authKey = null, {
    zone = null,
    enabled = true,
    script,
    pattern,
    clearRoutes,
    verbose
  }) {
    const requiredConfig = {
      'CF-Account-Email': authEmail,
      'CF-API-Key': authKey,
      zone
    };

    var _arr = Object.entries(requiredConfig);

    for (var _i = 0; _i < _arr.length; _i++) {
      let _arr$_i = _arr[_i],
          key = _arr$_i[0],
          value = _arr$_i[1];

      if (!value) {
        throw new Error(`'${key}' is undefined`);
      }

      if (typeof value !== 'string') {
        throw new Error(`'${key}' is not a string`);
      }
    }

    var _arr2 = Object.entries({
      script,
      pattern
    });

    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      let _arr2$_i = _arr2[_i2],
          key = _arr2$_i[0],
          value = _arr2$_i[1];

      if (value && typeof value !== 'string') {
        throw new Error(`'${key}' must be a string`);
      }
    }

    this._script = script && enabled ? _path.default.normalize(`${process.cwd()}/${script}`) : void 0;
    this._pattern = pattern;
    this._enabled = enabled === true;
    this._cfMethods = enabled ? Object.assign({}, (0, _lib.default)(authEmail, authKey, zone)) : {};
    this._clearRoutes = clearRoutes === true;
    this._verbose = verbose === true;
  }

  logg(stuff, color = `cyan`) {
    if (!this._verbose) return void 0;
    return typeof stuff === 'object' ? console.info(`${JSON.stringify(stuff, null, 2)}`[color]) : console.info(`${stuff}`[color]);
  }

  processExistingRoutes() {
    var _this = this;

    function _ref4(r) {
      return r.pattern === _this._pattern;
    }

    return _asyncToGenerator(function* () {
      let matchingRoute;
      let shouldCreateNewRoute = true;

      let _ref = yield _this._cfMethods.getRoutes(),
          existingRoutes = _ref.result;

      if (_this._clearRoutes) {
        _this.logg(`Deleting all routes: ${existingRoutes.map(_ref3).join(', ')}`);

        const deletedRoutes = yield Promise.all(existingRoutes.map(_this._cfMethods.deleteRoute));

        _this.logg(`Deleted patterns: ${deletedRoutes.join(', ')}`.red);

        return true;
      }

      const matchIndex = existingRoutes.findIndex(_ref4);

      if (matchIndex > -1) {
        shouldCreateNewRoute = false;
        matchingRoute = existingRoutes.splice(matchIndex, 1).pop();

        if (matchingRoute.enabled) {
          _this.logg(`Pattern already enabled: ${matchingRoute.pattern}`, `green`);
        } else {
          _this.logg(`Re-enabling exiting pattern: ${matchingRoute.pattern}`, `green`);

          const enabledRoute = yield _this._cfMethods.enableRoute(matchingRoute);
          console.info(`Enabled route pattern: ${enabledRoute}`.green);
        }
      }

      const disabledRoutes = yield Promise.all(existingRoutes.map(_this._cfMethods.disableRoute)).then(_ref5);

      if (disabledRoutes.length) {
        _this.logg(`Disabled patterns: ${disabledRoutes.join(', ')}`.yellow);
      }

      return shouldCreateNewRoute;
    })();
  }

  upsertNewPattern() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const shouldCreateNewRoute = yield _this2.processExistingRoutes();
      if (!shouldCreateNewRoute) return;
      yield _this2._cfMethods.createRoute(_this2._pattern);
    })();
  }

  apply(compiler) {
    var _this3 = this;

    function* _ref6(compilation) {
      if (!_this3._enabled) return console.info(`Cloudflare deployment disabled.`.yellow);
      let filename, code;

      try {
        filename = _this3._script || compilation.outputOptions.filename;
        code = compilation.assets[filename] ? compilation.assets[filename].source() : _fs.default.readFileSync(filename).toString();

        if (_this3._pattern) {
          yield _this3.upsertNewPattern();
        }

        _this3.logg(`Uploading worker...`, `green`);

        return _this3._cfMethods.uploadWorker(Buffer.from(code));
      } catch (err) {
        console.error(`${err.message}`.red);
        throw err;
      }
    }

    return compiler.hooks.afterEmit.tapPromise('CloudflareWorkerPlugin',
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(_ref6);

      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    }());
  }

}

module.exports = CloudflareWorkerPlugin;