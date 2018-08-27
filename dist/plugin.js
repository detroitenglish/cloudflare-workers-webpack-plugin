"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.promise");

require("colors");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _lib = require("./lib");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } const _defined14 = function _defined14(key) { _defineProperty(target, key, source[key]); }; for (let _i11 = 0; _i11 <= ownKeys.length - 1; _i11++) { _defined14(ownKeys[_i11], _i11, ownKeys); } } return target; }

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

function _ref7(r) {
  return r.ok;
}

function _ref9(r) {
  return !r.ok;
}

function _ref12(r) {
  return r.ok && !r.skipped;
}

function _ref14(r) {
  return !r.ok;
}

function* _ref15(pattern) {
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

    function _ref6(r) {
      return _this3._logg(`Deleted pattern: ${r.pattern}`, `yellow`);
    }

    function _ref8(r) {
      return _this3._logg(`Pattern deletion failed: ${r.pattern}`, `red`, `💩`);
    }

    function _ref10(results) {
      const _defined = _ref6;
      const _defined5 = _ref7;
      const _defined2 = [];

      for (let _i4 = 0; _i4 <= results.length - 1; _i4++) {
        if (_defined5(results[_i4], _i4, results)) _defined2.push(results[_i4]);
      }

      for (let _i2 = 0; _i2 <= _defined2.length - 1; _i2++) {
        _defined(_defined2[_i2], _i2, _defined2);
      }

      const _defined3 = _ref8;
      const _defined6 = _ref9;
      const _defined4 = [];

      for (let _i5 = 0; _i5 <= results.length - 1; _i5++) {
        if (_defined6(results[_i5], _i5, results)) _defined4.push(results[_i5]);
      }

      for (let _i3 = 0; _i3 <= _defined4.length - 1; _i3++) {
        _defined3(_defined4[_i3], _i3, _defined4);
      }

      _this3._existingRoutes.length = 0;
    }

    return _asyncToGenerator(function* () {
      if (!_this3._existingRoutes.length) return;

      _this3._logg(`Deleting all routes: ${_this3._existingRoutes.map(_ref5).join(', ')}`, `yellow`, `💣`);

      yield Promise.all(_this3._existingRoutes.map(_this3._cfMethods.deleteRoute)).then(_ref10);
      return true;
    })();
  }

  _disableRemainingRoutes() {
    var _this4 = this;

    function _ref11(r) {
      return _this4._logg(`Disabled route pattern: ${r.pattern}`, `yellow`);
    }

    function _ref13(r) {
      return _this4._logg(`Failed to disabled route pattern: ${r.pattern}`, `red`, `💩`);
    }

    return _asyncToGenerator(function* () {
      const disabledRoutes = yield Promise.all(_this4._existingRoutes.map(_this4._cfMethods.disableRoute));
      const _defined7 = _ref11;
      const _defined11 = _ref12;
      const _defined8 = [];

      for (let _i8 = 0; _i8 <= disabledRoutes.length - 1; _i8++) {
        if (_defined11(disabledRoutes[_i8], _i8, disabledRoutes)) _defined8.push(disabledRoutes[_i8]);
      }

      for (let _i6 = 0; _i6 <= _defined8.length - 1; _i6++) {
        _defined7(_defined8[_i6], _i6, _defined8);
      }

      const _defined9 = _ref13;
      const _defined12 = _ref14;
      const _defined10 = [];

      for (let _i9 = 0; _i9 <= disabledRoutes.length - 1; _i9++) {
        if (_defined12(disabledRoutes[_i9], _i9, disabledRoutes)) _defined10.push(disabledRoutes[_i9]);
      }

      for (let _i7 = 0; _i7 <= _defined10.length - 1; _i7++) {
        _defined9(_defined10[_i7], _i7, _defined10);
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
        newRoutes.push(...(yield Promise.all(_this5._pattern.map(existingHandler))));
      } else {
        newRoutes.push((yield existingHandler(_this5._pattern)));
      }

      yield _this5._disableRemainingRoutes(existingRoutes);
      return newRoutes.filter(Boolean);

      function enableExistingMatchingRoute(_x) {
        return _enableExistingMatchingRoute.apply(this, arguments);
      }

      function _enableExistingMatchingRoute() {
        _enableExistingMatchingRoute = _asyncToGenerator(_ref15);
        return _enableExistingMatchingRoute.apply(this, arguments);
      }
    })();
  }

  _upsertPattern() {
    var _this6 = this;

    function _ref16(p) {
      return _this6._logg(`Created and enabled new route pattern: ${p.pattern}`, `cyan`, `🌟`);
    }

    return _asyncToGenerator(function* () {
      const newRoutes = yield _this6._processRoutes();
      if (!newRoutes.length) return;
      const created = yield Promise.all(newRoutes.map(_this6._cfMethods.createRoute));
      const _defined13 = _ref16;

      for (let _i10 = 0; _i10 <= created.length - 1; _i10++) {
        _defined13(created[_i10], _i10, created);
      }
    })();
  }

  apply(compiler) {
    var _this7 = this;

    function* _ref17(compilation) {
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
      var _ref3 = _asyncToGenerator(_ref17);

      return function (_x2) {
        return _ref3.apply(this, arguments);
      };
    }());
  }

}

exports.default = CloudflareWorkerPlugin;