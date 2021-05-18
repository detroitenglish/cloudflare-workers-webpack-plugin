"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es.array.iterator.js");

require("colors");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _lib = require("./lib");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class CloudflareWorkerPlugin {
  constructor(authEmail = null, authKey = null, {
    colors = false,
    disabledPatterns = [],
    emoji = false,
    enabled = true,
    enabledPatterns = [],
    metadataPath,
    pattern,
    reset = false,
    script,
    scriptName = `${Date.now()}`,
    site = null,
    skipWorkerUpload = false,
    verbose = false,
    zone = null
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

        const opts = _objectSpread(_objectSpread({}, this._configOptions), {}, {
          zone: this._zone
        });

        (0, _lib.validateConfig)([...creds, opts]);
      };
    }

    this._zone = zone;
    this._site = site;
    this._enabled = !!enabled;
    this._clearEverything = !!reset;
    this._verbose = !!verbose;
    this._colors = colors;
    this._emoji = emoji;
    this._skipWorkerUpload = !!skipWorkerUpload;
    this._metadata = metadataPath ? _fs.default.readFileSync(metadataPath) : void 0;
    this._scriptName = scriptName; // TODO: process.cwd is probably NOT the best way to handle this... what is?

    this._script = script && enabled ? _path.default.normalize(`${process.cwd()}/${script}`) : void 0;

    if (pattern) {
      throw new Error(`Config option 'pattern' is not supported in >=2.0.0 - Use 'enabledPatterns' and 'disabledPatterns' instead`);
    }

    this._routePatterns = [...(0, _lib.patternsToArray)(enabledPatterns).map(pattern => {
      return !!pattern && {
        pattern,
        script: scriptName // enabled: true,

      };
    }).filter(Boolean), ...(0, _lib.patternsToArray)(disabledPatterns).map(pattern => {
      return !!pattern && {
        pattern // enabled: false,

      };
    }).filter(Boolean)];
    this._cfMethods = _objectSpread({}, (0, _lib.cfMethods)(authEmail, authKey, {
      zone,
      scriptName
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
      zone,
      scriptName: this._scriptName
    })));
  }

  async _nukeFuckingEverything() {
    await this._clearAllExistingRoutes();
    const adios = await this._cfMethods.deleteWorker();
    if (adios.ok) this._logg(`Worker script deleted`, `yellow`, `💀`);else if (adios.status === 404) this._logg(`No existing worker to delete!`, `cyan`, `🤷`);
  }

  async _clearAllExistingRoutes() {
    let {
      result: existingRoutes = []
    } = await this._cfMethods.getRoutes();
    if (!existingRoutes.length) return;

    this._logg(`Resetting route patterns...`, `yellow`, `💣`);

    await Promise.all(existingRoutes.map(this._cfMethods.deleteRoute));
  }

  async _processRoutes() {
    await this._clearAllExistingRoutes(); // Cloudflare doesn't handle concurrent requests for patterns so well..

    for (let pattern of this._routePatterns) {
      this._logg(`${pattern.script ? `Enabling` : `Disabling`} worker script ${pattern.script} for route: ${pattern.pattern}`, pattern.script ? `green` : `yellow`, pattern.script ? `✔` : `❌`);

      await this._cfMethods.createRoute(pattern);
    }
  }

  apply(compiler) {
    return compiler.hooks.afterEmit.tapPromise(`CloudflareWorkerPlugin`, async compilation => {
      if (!this._enabled) return this._logg(`Cloudflare deployment disabled.`, `yellow`);

      if (this._deferValidation) {
        this._logg(`Looking up zone-id for '${this._site}'`, `cyan`, `🔎`);

        await this._queryZoneInfo();
      }

      try {
        let filename, code;

        if (this._clearEverything) {
          await this._nukeFuckingEverything();
          return this._logg(`Donzo!`, `cyan`, `😎`);
        }

        if (!this._skipWorkerUpload) {
          filename = this._script || compilation.outputOptions.filename;
          code = compilation.assets[filename] ? compilation.assets[filename].source() : _fs.default.readFileSync(filename).toString();

          this._logg(`Uploading worker...`, `green`, `🤖`);

          await this._cfMethods.uploadWorker({
            script: Buffer.from(code),
            metadata: this._metadata
          });

          this._logg(`Success! Cloudflare worker deployed`, `green`, `🚀`);
        } else {
          this._logg(`Skipping Cloudflare worker upload...`, `yellow`);
        }

        await this._processRoutes(); //.catch(console.error.bind(console))

        return this._logg(`Donzo!`, `cyan`, `😎`);
      } catch (err) {
        this._logg(`${err.message}`, `red`, null);

        throw err;
      }
    });
  }

}

exports.default = CloudflareWorkerPlugin;