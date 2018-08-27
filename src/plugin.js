import 'colors'
import fs from 'fs'
import path from 'path'
import { cfMethods, validateConfig, queryZoneInfo, logg } from './lib'

export default class CloudflareWorkerPlugin {
  constructor(
    authEmail = null,
    authKey = null,
    {
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
      skipWorkerUpload = false,
    }
  ) {
    if (!site) {
      validateConfig(arguments)
    } else if (!zone && site) {
      this._deferValidation = true

      this._credentials = [authEmail, authKey, { site }]

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
    this._clearRoutes = !!clearRoutes
    this._verbose = !!verbose
    this._colors = colors
    this._emoji = emoji
    this._skipWorkerUpload = !!skipWorkerUpload

    this._existingRoutes = []

    this._script =
      script && enabled ? path.normalize(`${process.cwd()}/${script}`) : void 0

    this._pattern = Array.isArray(pattern)
      ? pattern
      : pattern.includes(',')
        ? pattern.split(',')
        : pattern

    this._cfMethods = { ...cfMethods(authEmail, authKey, { zone }) }
  }

  _logg(...args) {
    return logg.bind(this)(...args)
  }

  async _queryZoneInfo() {
    const [authEmail, authKey, { site }] = this._credentials
    const zone = await queryZoneInfo(authEmail, authKey, { site })
    this._zone = zone
    this._logg(
      `Found! Zone-id for '${this._site}' is: ${this._zone}`,
      `green`,
      `🕺`
    )
    this._validate()
    Object.assign(this._cfMethods, {
      ...cfMethods(authEmail, authKey, { zone }),
    })
  }

  async _nukeFuckingEverything() {
    let { result: existingRoutes } = await this._cfMethods.getRoutes()

    this._existingRoutes.push(...existingRoutes)

    await this._clearAllExistingRoutes()

    const adios = await this._cfMethods
      .deleteWorker()
      .catch(err => ({ ok: false, status: err?.response.status }))
    if (adios.ok) this._logg(`Worker script deleted`, `yellow`, `💀`)
    else if (adios.status === 404)
      this._logg(`No worker script to delete!`, `cyan`, `🤷`)
  }

  async _clearAllExistingRoutes() {
    if (!this._existingRoutes.length) return
    this._logg(
      `Deleting all routes: ${this._existingRoutes
        .map(r => r.pattern)
        .join(', ')}`,
      `yellow`,
      `💣`
    )
    await Promise.all(
      this._existingRoutes.map(this._cfMethods.deleteRoute)
    ).then(results => {
      results
        .filter(r => r.ok)
        .forEach(r => this._logg(`Deleted pattern: ${r.pattern}`, `yellow`))
      results
        .filter(r => !r.ok)
        .forEach(r =>
          this._logg(`Pattern deletion failed: ${r.pattern}`, `red`, `💩`)
        )
      this._existingRoutes.length = 0
    })
    return true
  }

  async _disableRemainingRoutes() {
    const disabledRoutes = await Promise.all(
      this._existingRoutes.map(this._cfMethods.disableRoute)
    )
    disabledRoutes
      .filter(r => r.ok && !r.skipped)
      .forEach(r =>
        this._logg(`Disabled route pattern: ${r.pattern}`, `yellow`)
      )
    disabledRoutes
      .filter(r => !r.ok)
      .forEach(r =>
        this._logg(
          `Failed to disabled route pattern: ${r.pattern}`,
          `red`,
          `💩`
        )
      )
  }

  async _processRoutes() {
    let newRoutes = []
    // bind the context for Array.map()
    const existingHandler = enableExistingMatchingRoute.bind(this)

    let { result: existingRoutes } = await this._cfMethods.getRoutes()

    this._existingRoutes.push(...existingRoutes)

    if (this._clearRoutes) {
      await this._clearAllExistingRoutes(this._existingRoutes)
    }

    if (Array.isArray(this._pattern)) {
      newRoutes.push(...(await Promise.all(this._pattern.map(existingHandler))))
    } else {
      newRoutes.push(await existingHandler(this._pattern))
    }

    await this._disableRemainingRoutes(existingRoutes)

    return newRoutes.filter(Boolean)

    async function enableExistingMatchingRoute(pattern) {
      let matchingRoute
      const matchIndex = this._existingRoutes.findIndex(
        r => r.pattern === pattern
      )
      if (matchIndex > -1) {
        matchingRoute = this._existingRoutes.splice(matchIndex, 1).pop()
        if (matchingRoute.enabled) {
          this._logg(
            `Pattern already enabled: ${matchingRoute.pattern}`,
            `green`
          )
        } else {
          this._logg(
            `Re-enabling exiting pattern: ${matchingRoute.pattern}`,
            `green`
          )
          const enabled = await this._cfMethods.enableRoute(matchingRoute)
          if (enabled.ok)
            this._logg(`Enabled route pattern: ${enabled.pattern}`, `green`)
          else
            this._logg(
              `Failed to enabled route pattern: ${enabled.pattern}`,
              `red`,
              `💩`
            )
        }
        return false
      }
      return pattern
    }
  }

  async _upsertPattern() {
    const newRoutes = await this._processRoutes()
    if (!newRoutes.length) return
    const created = await Promise.all(
      newRoutes.map(this._cfMethods.createRoute)
    )
    created.forEach(p =>
      this._logg(
        `Created and enabled new route pattern: ${p.pattern}`,
        `cyan`,
        `🌟`
      )
    )
  }

  apply(compiler) {
    return compiler.hooks.afterEmit.tapPromise(
      'CloudflareWorkerPlugin',
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
            return await this._nukeFuckingEverything()
          }

          if (!this._skipWorkerUpload) {
            filename = this._script || compilation.outputOptions.filename
            code = compilation.assets[filename]
              ? compilation.assets[filename].source()
              : fs.readFileSync(filename).toString()

            this._logg(`Uploading worker...`, `green`, `🤖`)

            await this._cfMethods.uploadWorker(Buffer.from(code))
          } else {
            this._logg(`Skipping Cloudflare worker upload...`, `yellow`)
          }

          if (this._pattern) {
            await this._upsertPattern()
          }
          this._logg(`Success! Cloudflare worker deployed`, `green`, `🚀`)
        } catch (err) {
          this._logg(`${err.message}`, `red`, null)
          throw err
        }
      }
    )
  }
}
