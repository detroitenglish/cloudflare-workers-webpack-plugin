"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("colors");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _lib = require("./lib");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } const _defined = function _defined(key) { _defineProperty(target, key, source[key]); }; for (let _i2 = 0; _i2 <= ownKeys.length - 1; _i2++) { _defined(ownKeys[_i2], _i2, ownKeys); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _ref4(err) {
  return {
    ok: false,
    status: err === null || err === void 0 ? void 0 : err.response.status
  };
}

function _ref5(r) {
  return r.pattern;
}

function* _ref7(pattern) {
  let matchingRoute;

  const matchIndex = this._existingRoutes.findIndex(r => r.pattern === pattern);

  if (matchIndex > -1) {
    matchingRoute = this._existingRoutes.splice(matchIndex, 1).pop();

    if (matchingRoute.enabled) {
      this._logg(`Pattern already enabled: ${matchingRoute.pattern}`, `green`);
    } else {
      this._logg(`Re-enabling exiting pattern: ${matchingRoute.pattern}`, `green`);

      const enabled = yield this._cfMethods.enableRoute(matchingRoute);
      if (enabled.ok) this._logg(`Enabled route pattern: ${enabled.pattern}`, `green`);else this._logg(`Failed to enabled route pattern: ${enabled.pattern}`, `red`, `💩`);
    }

    return false;
  }

  return pattern;
}

class CloudflareWorkerPlugin {
  constructor(authEmail = null, authKey = null, {
    script = void 0,
    pattern = void 0,
    zone = null,
    site = null,
    enabled = true,
    verbose = false,
    colors = false,
    emoji = false,
    reset = false,
    clearRoutes = false,
    skipWorkerUpload = false
  }) {
    if (!site) {
      (0, _lib.validateConfig)(arguments);
    } else if (!zone && site) {
      this._deferValidation = true;
      this._credentials = [authEmail, authKey, {
        site
      }];
      this._configOptions = arguments[2];

      this._validate = () => {
        const creds = this._credentials.splice(0, 2);

        const opts = _objectSpread({}, this._configOptions, {
          zone: this._zone
        });

        (0, _lib.validateConfig)([...creds, opts]);
      };
    }

    this._zone = zone;
    this._site = site;
    this._enabled = !!enabled;
    this._clearEverything = !!reset;
    this._clearRoutes = !!clearRoutes;
    this._verbose = !!verbose;
    this._colors = colors;
    this._emoji = emoji;
    this._skipWorkerUpload = !!skipWorkerUpload;
    this._existingRoutes = [];
    this._script = script && enabled ? _path.default.normalize(`${process.cwd()}/${script}`) : void 0;
    this._pattern = Array.isArray(pattern) ? pattern : pattern.includes(',') ? pattern.split(',') : pattern;
    this._cfMethods = _objectSpread({}, (0, _lib.cfMethods)(authEmail, authKey, {
      zone
    }));
  }

  _logg(...args) {
    return _lib.logg.bind(this)(...args);
  }

  _queryZoneInfo() {
    var _this = this;

    return _asyncToGenerator(function* () {
      const _this$_credentials = _slicedToArray(_this._credentials, 3),
            authEmail = _this$_credentials[0],
            authKey = _this$_credentials[1],
            site = _this$_credentials[2].site;

      const zone = yield (0, _lib.queryZoneInfo)(authEmail, authKey, {
        site
      });
      _this._zone = zone;

      _this._logg(`Found! Zone-id for '${_this._site}' is: ${_this._zone}`, `green`, `🕺`);

      _this._validate();

      Object.assign(_this._cfMethods, _objectSpread({}, (0, _lib.cfMethods)(authEmail, authKey, {
        zone
      })));
    })();
  }

  _nukeFuckingEverything() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let _ref = yield _this2._cfMethods.getRoutes(),
          existingRoutes = _ref.result;

      _this2._existingRoutes.push(...existingRoutes);

      yield _this2._clearAllExistingRoutes();
      const adios = yield _this2._cfMethods.deleteWorker().catch(_ref4);
      if (adios.ok) _this2._logg(`Worker script deleted`, `yellow`, `💀`);else if (adios.status === 404) _this2._logg(`No worker script to delete!`, `cyan`, `🤷`);
    })();
  }

  _clearAllExistingRoutes() {
    var _this3 = this;

    function _ref6(results) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = results[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          let _step$value = _step.value,
              ok = _step$value.ok,
              pattern = _step$value.pattern;
          if (ok) _this3._logg(`Deleted pattern: ${pattern}`, `yellow`);else _this3._logg(`Pattern deletion failed: ${pattern}`, `red`, `💩`);
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

      _this3._existingRoutes.length = 0;
    }

    return _asyncToGenerator(function* () {
      if (!_this3._existingRoutes.length) return;

      _this3._logg(`Deleting all routes: ${_this3._existingRoutes.map(_ref5).join(', ')}`, `yellow`, `💣`);

      yield _bluebird.default.all(_this3._existingRoutes.map(_this3._cfMethods.deleteRoute)).then(_ref6);
      return true;
    })();
  }

  _disableRemainingRoutes() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const disabledRoutes = yield _bluebird.default.all(_this4._existingRoutes.map(_this4._cfMethods.disableRoute));
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = disabledRoutes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          let _step2$value = _step2.value,
              ok = _step2$value.ok,
              pattern = _step2$value.pattern,
              skipped = _step2$value.skipped;
          if (ok && !skipped) _this4._logg(`Disabled route pattern: ${pattern}`, `yellow`);else if (!ok) _this4._logg(`Failed to disabled route pattern: ${pattern}`, `red`, `💩`);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    })();
  }

  _processRoutes() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      let newRoutes = []; // bind the context for Array.map()

      const existingHandler = enableExistingMatchingRoute.bind(_this5);

      let _ref2 = yield _this5._cfMethods.getRoutes(),
          existingRoutes = _ref2.result;

      _this5._existingRoutes.push(...existingRoutes);

      if (_this5._clearRoutes) {
        yield _this5._clearAllExistingRoutes(_this5._existingRoutes);
      }

      if (Array.isArray(_this5._pattern)) {
        newRoutes.push(...(yield _bluebird.default.all(_this5._pattern.map(existingHandler))));
      } else {
        newRoutes.push((yield existingHandler(_this5._pattern)));
      }

      yield _this5._disableRemainingRoutes(existingRoutes);
      return newRoutes.filter(Boolean);

      function enableExistingMatchingRoute(_x) {
        return _enableExistingMatchingRoute.apply(this, arguments);
      }

      function _enableExistingMatchingRoute() {
        _enableExistingMatchingRoute = _asyncToGenerator(_ref7);
        return _enableExistingMatchingRoute.apply(this, arguments);
      }
    })();
  }

  _upsertPattern() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      const newRoutes = yield _this6._processRoutes();
      if (!newRoutes.length) return;
      const created = yield _bluebird.default.all(newRoutes.map(_this6._cfMethods.createRoute));
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = created[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          let pattern = _step3.value.pattern;

          _this6._logg(`Created and enabled new route pattern: ${pattern}`, `cyan`, `🌟`);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    })();
  }

  apply(compiler) {
    var _this7 = this;

    function* _ref8(compilation) {
      if (!_this7._enabled) return _this7._logg(`Cloudflare deployment disabled.`, `yellow`);

      if (_this7._deferValidation) {
        _this7._logg(`Looking up zone-id for '${_this7._site}'`, `cyan`, `🔎`);

        yield _this7._queryZoneInfo();
      }

      try {
        let filename, code;

        if (_this7._clearEverything) {
          return yield _this7._nukeFuckingEverything();
        }

        if (!_this7._skipWorkerUpload) {
          filename = _this7._script || compilation.outputOptions.filename;
          code = compilation.assets[filename] ? compilation.assets[filename].source() : _fs.default.readFileSync(filename).toString();

          _this7._logg(`Uploading worker...`, `green`, `🤖`);

          yield _this7._cfMethods.uploadWorker(Buffer.from(code));
        } else {
          _this7._logg(`Skipping Cloudflare worker upload...`, `yellow`);
        }

        if (_this7._pattern) {
          yield _this7._upsertPattern();
        }

        _this7._logg(`Success! Cloudflare worker deployed`, `green`, `🚀`);
      } catch (err) {
        _this7._logg(`${err.message}`, `red`, null);

        throw err;
      }
    }

    return compiler.hooks.afterEmit.tapPromise('CloudflareWorkerPlugin',
    /*#__PURE__*/
    function () {
      var _ref3 = _asyncToGenerator(_ref8);

      return function (_x2) {
        return _ref3.apply(this, arguments);
      };
    }());
  }

}

exports.default = CloudflareWorkerPlugin;