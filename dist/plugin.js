"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("colors");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _lib = require("./lib");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class CloudflareWorkerPlugin {
  constructor(authEmail = null, authKey = null, {
    script = void 0,
    pattern = void 0,
    metadataPath = void 0,
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
    this._metadata = metadataPath ? _fs.default.readFileSync(metadataPath) : void 0;
    this._existingRoutes = [];
    this._script = script && enabled ? _path.default.normalize(`${process.cwd()}/${script}`) : void 0;
    this._pattern = Array.isArray(pattern) ? pattern : pattern.includes(',') // eslint-disable-next-line
    ? pattern.split(',') // eslint-disable-next-line
    : [pattern];
    this._pattern = this._pattern.map(route => {
      if (typeof route === 'string') {
        return {
          pattern: route,
          enabled: true
        };
      }

      return _objectSpread({
        enabled: true
      }, route);
    });
    this._pattern = this._pattern.filter(route => {
      if (route && route.pattern) {
        return true;
      }

      this._logg(`Some routes ignore because of invalid format. You can provide a string, a array of string or an array object of shape { pattern: STRING, enable: BOOL }`, 'warning');

      return false;
    });
    this._cfMethods = _objectSpread({}, (0, _lib.cfMethods)(authEmail, authKey, {
      zone
    }));
  }

  _logg(...args) {
    return _lib.logg.bind(this)(...args);
  }

  async _queryZoneInfo() {
    const [authEmail, authKey, {
      site
    }] = this._credentials;
    const zone = await (0, _lib.queryZoneInfo)(authEmail, authKey, {
      site
    });
    this._zone = zone;

    this._logg(`Found! Zone-id for '${this._site}' is: ${this._zone}`, `green`, `🕺`);

    this._validate();

    Object.assign(this._cfMethods, _objectSpread({}, (0, _lib.cfMethods)(authEmail, authKey, {
      zone
    })));
  }

  async _nukeFuckingEverything() {
    let {
      result: existingRoutes
    } = await this._cfMethods.getRoutes();

    this._existingRoutes.push(...existingRoutes);

    await this._clearAllExistingRoutes();
    const adios = await this._cfMethods.deleteWorker();
    if (adios.ok) this._logg(`Worker script deleted`, `yellow`, `💀`);else if (adios.status === 404) this._logg(`No worker script to delete!`, `cyan`, `🤷`);
  }

  async _clearAllExistingRoutes() {
    if (!this._existingRoutes.length) return;

    this._logg(`Deleting all routes: ${this._existingRoutes.map(r => r.pattern).join(', ')}`, `yellow`, `💣`);

    await Promise.all(this._existingRoutes.map(this._cfMethods.deleteRoute)).then(results => {
      for (let _ref of results) {
        let {
          ok,
          pattern
        } = _ref;
        if (ok) this._logg(`Deleted pattern: ${pattern}`, `yellow`);else this._logg(`Pattern deletion failed: ${pattern}`, `red`, `💩`);
      }

      this._existingRoutes.length = 0;
    });
    return true;
  }

  async _disableRemainingRoutes() {
    const disabledRoutes = await Promise.all(this._existingRoutes.map(this._cfMethods.disableRoute));

    for (let _ref2 of disabledRoutes) {
      let {
        ok,
        pattern,
        skipped
      } = _ref2;
      if (ok && !skipped) this._logg(`Disabled route pattern: ${pattern}`, `yellow`);else if (!ok) this._logg(`Failed to disabled route pattern: ${pattern}`, `red`, `💩`);
    }
  }

  async _processRoutes() {
    let newRoutes = []; // bind the context for Array.map()

    const existingHandler = enableExistingMatchingRoute.bind(this);
    let {
      result: existingRoutes
    } = await this._cfMethods.getRoutes();

    this._existingRoutes.push(...existingRoutes);

    if (this._clearRoutes) {
      await this._clearAllExistingRoutes(this._existingRoutes);
    }

    newRoutes.push(...(await Promise.all(this._pattern.map(existingHandler))));
    await this._disableRemainingRoutes(existingRoutes);
    return newRoutes.filter(Boolean);

    async function enableExistingMatchingRoute(route) {
      let matchingRoute;

      const matchIndex = this._existingRoutes.findIndex(r => r.pattern === route.pattern);

      if (matchIndex > -1) {
        matchingRoute = this._existingRoutes.splice(matchIndex, 1).pop();

        if (matchingRoute.enabled === route.enabled) {
          this._logg(`Pattern already registered: ${matchingRoute.pattern}`, `green`);
        } else {
          if (route.enabled) {
            this._logg(`Re-enabling exiting pattern: ${matchingRoute.pattern}`, `green`);

            const enabled = await this._cfMethods.enableRoute(matchingRoute);
            if (enabled.ok) this._logg(`Enabled route pattern: ${enabled.pattern}`, `green`);else this._logg(`Failed to enabled route pattern: ${enabled.pattern}`, `red`, `💩`);
          } else {
            this._logg(`Disabling exiting pattern: ${matchingRoute.pattern}`, `green`);

            const enabled = await this._cfMethods.disableRoute(matchingRoute);
            if (enabled.ok) this._logg(`Disabled route pattern: ${enabled.pattern}`, `green`);else this._logg(`Failed to disabled route pattern: ${enabled.pattern}`, `red`, `💩`);
          }
        }

        return false;
      }

      return route;
    }
  }

  async _upsertPattern() {
    const newRoutes = await this._processRoutes();
    if (!newRoutes.length) return;
    const created = await Promise.all(newRoutes.map(route => this._cfMethods.createRoute(route.pattern, route.enabled)));

    for (let _ref3 of created) {
      let {
        pattern
      } = _ref3;
      this._logg(`Created new route pattern: ${pattern}`, `cyan`, `🌟`);
    }
  }

  apply(compiler) {
    return compiler.hooks.afterEmit.tapPromise('CloudflareWorkerPlugin', async compilation => {
      if (!this._enabled) return this._logg(`Cloudflare deployment disabled.`, `yellow`);

      if (this._deferValidation) {
        this._logg(`Looking up zone-id for '${this._site}'`, `cyan`, `🔎`);

        await this._queryZoneInfo();
      }

      try {
        let filename, code;

        if (this._clearEverything) {
          return await this._nukeFuckingEverything();
        }

        if (!this._skipWorkerUpload) {
          filename = this._script || compilation.outputOptions.filename;
          code = compilation.assets[filename] ? compilation.assets[filename].source() : _fs.default.readFileSync(filename).toString();

          this._logg(`Uploading worker...`, `green`, `🤖`);

          await this._cfMethods.uploadWorker({
            script: Buffer.from(code),
            metadata: this._metadata
          });
        } else {
          this._logg(`Skipping Cloudflare worker upload...`, `yellow`);
        }

        if (this._pattern) {
          await this._upsertPattern();
        }

        this._logg(`Success! Cloudflare worker deployed`, `green`, `🚀`);
      } catch (err) {
        this._logg(`${err.message}`, `red`, null);

        throw err;
      }
    });
  }

}

exports.default = CloudflareWorkerPlugin;
