import 'colors'
import fs from 'fs'
import path from 'path'

import {
  cfMethods,
  validateConfig,
  queryZoneInfo,
  logg,
  patternsToArray,
} from './lib'

export default class CloudflareWorkerPlugin {
  constructor(
    authEmail = null,
    authKey = null,
    {
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
      zone = null,
    }
  ) {
    if (!site) {
      validateConfig(arguments)
    } else if (!zone && site) {
      this._deferValidation = true

      this._credentials = [
        authEmail,
        authKey,
        {
          site,
        },
      ]

      this._configOptions = arguments[2]

      this._validate = () => {
        const creds = this._credentials.splice(0, 2)
        const opts = { ...this._configOptions, zone: this._zone }
        validateConfig([...creds, opts])
      }
    }

    this._zone = zone
    this._site = site
    this._enabled = !!enabled
    this._clearEverything = !!reset
    this._verbose = !!verbose
    this._colors = colors
    this._emoji = emoji
    this._skipWorkerUpload = !!skipWorkerUpload
    this._metadata = metadataPath ? fs.readFileSync(metadataPath) : void 0
    this._scriptName = scriptName

    // TODO: process.cwd is probably NOT the best way to handle this... what is?
    this._script =
      script && enabled ? path.normalize(`${process.cwd()}/${script}`) : void 0

    if (pattern) {
      throw new Error(
        `Config option 'pattern' is not supported in >=2.0.0 - Use 'enabledPatterns' and 'disabledPatterns' instead`
      )
    }

    this._routePatterns = [
      ...patternsToArray(enabledPatterns)
        .map(pattern => {
          return (
            !!pattern && {
              pattern,
              script: scriptName,
              // enabled: true,
            }
          )
        })
        .filter(Boolean),
      ...patternsToArray(disabledPatterns)
        .map(pattern => {
          return (
            !!pattern && {
              pattern,
              // enabled: false,
            }
          )
        })
        .filter(Boolean),
    ]

    this._cfMethods = {
      ...cfMethods(authEmail, authKey, {
        zone,
        scriptName,
      }),
    }
  }

  _logg(...args) {
    return logg.bind(this)(...args)
  }

  async _queryZoneInfo() {
    const [authEmail, authKey, { site }] = this._credentials
    const zone = await queryZoneInfo(authEmail, authKey, {
      site,
    })
    this._zone = zone
    this._logg(
      `Found! Zone-id for '${this._site}' is: ${this._zone}`,
      `green`,
      `🕺`
    )
    this._validate()
    Object.assign(this._cfMethods, {
      ...cfMethods(authEmail, authKey, {
        zone,
        scriptName: this._scriptName,
      }),
    })
  }

  async _nukeFuckingEverything() {
    await this._clearAllExistingRoutes()
    const adios = await this._cfMethods.deleteWorker()
    if (adios.ok) this._logg(`Worker script deleted`, `yellow`, `💀`)
    else if (adios.status === 404)
      this._logg(`No existing worker to delete!`, `cyan`, `🤷`)
  }

  async _clearAllExistingRoutes() {
    let { result: existingRoutes = [] } = await this._cfMethods.getRoutes()
    if (!existingRoutes.length) return
    this._logg(`Nuking script and route pattern...`, `yellow`, `💣`)
    await Promise.all(existingRoutes.map(this._cfMethods.deleteRoute))
  }

  async _processRoutes() {
    await this._clearAllExistingRoutes()
    // Cloudflare doesn't handle concurrent requests for patterns so well..
    for (let pattern of this._routePatterns) {
      this._logg(
        `${pattern.script ? `Enabling` : `Disabling`} worker script ${
          pattern.script
        } for route: ${pattern.pattern}`,
        pattern.script ? `green` : `yellow`,
        pattern.script ? `✔` : `❌`
      )
      await this._cfMethods.createRoute(pattern)
    }
  }

  apply(compiler) {
    return compiler.hooks.afterEmit.tapPromise(
      `CloudflareWorkerPlugin`,
      async compilation => {
        if (!this._enabled)
          return this._logg(`Cloudflare deployment disabled.`, `yellow`)
        if (this._deferValidation) {
          this._logg(`Looking up zone-id for '${this._site}'`, `cyan`, `🔎`)
          await this._queryZoneInfo()
        }

        try {
          let filename, code

          if (this._clearEverything) {
            await this._nukeFuckingEverything()
            return this._logg(`Donzo!`, `cyan`, `😎`)
          }

          if (!this._skipWorkerUpload) {
            filename = this._script || compilation.outputOptions.filename
            code = compilation.assets[filename]
              ? compilation.assets[filename].source()
              : fs.readFileSync(filename).toString()

            this._logg(`Uploading worker...`, `green`, `🤖`)
            await this._cfMethods.uploadWorker({
              script: Buffer.from(code),
              metadata: this._metadata,
            })
            this._logg(`Success! Cloudflare worker deployed`, `green`, `🚀`)
          } else {
            this._logg(`Skipping Cloudflare worker upload...`, `yellow`)
          }
          await this._processRoutes() //.catch(console.error.bind(console))

          return this._logg(`Donzo!`, `cyan`, `😎`)
        } catch (err) {
          this._logg(`${err.message}`, `red`, null)
          throw err
        }
      }
    )
  }
}
