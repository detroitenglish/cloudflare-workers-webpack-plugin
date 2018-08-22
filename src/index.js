import 'colors'
import { cfMethods, validateConfig } from './lib'
import fs from 'fs'
import path from 'path'

class CloudflareWorkerPlugin {
  constructor(
    authEmail = null,
    authKey = null,
    {
      zone = null,
      enabled = true,
      script,
      pattern,
      clearRoutes,
      verbose,
      skipWorkerUpload,
    }
  ) {
    validateConfig(arguments)

    this._enabled = !!enabled
    this._clearRoutes = !!clearRoutes
    this._verbose = !!verbose
    this._skipWorkerUpload = !!skipWorkerUpload

    this._existingRoutes = []

    this._script =
      script && enabled ? path.normalize(`${process.cwd()}/${script}`) : void 0

    this._pattern = Array.isArray(pattern)
      ? pattern
      : pattern.includes(',')
        ? pattern.split(',')
        : pattern

    this._cfMethods = { ...cfMethods(authEmail, authKey, zone) }
  }

  _logg(stuff, color = `cyan`) {
    if (!this._verbose) return void 0

    return typeof stuff === 'object'
      ? console.info(`${JSON.stringify(stuff, null, 2)}`[color])
      : console.info(`${stuff}`[color])
  }

  async _clearAllExistingRoutes() {
    if (!this._existingRoutes.length) return
    this._logg(
      `Deleting all routes: ${this._existingRoutes
        .map(r => r.pattern)
        .join(', ')}`
    )
    await Promise.all(
      this._existingRoutes.map(this._cfMethods.deleteRoute)
    ).then(results => {
      results
        .filter(r => r.ok)
        .forEach(r => this._logg(`Deleted pattern: ${r.pattern}`.yellow))
      results
        .filter(r => !r.ok)
        .forEach(r => this._logg(`Pattern deletion failed: ${r.pattern}`.red))
    })
    return true
  }

  async _disableRemainingRoutes() {
    const disabledRoutes = await Promise.all(
      this._existingRoutes.map(this._cfMethods.disableRoute)
    )
    disabledRoutes
      .filter(r => r.ok)
      .forEach(r => this._logg(`Disabled route pattern: ${r.pattern}`.yellow))
    disabledRoutes
      .filter(r => !r.ok)
      .forEach(r =>
        this._logg(`Failed to disabled route pattern: ${r.pattern}`.red)
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
            console.info(`Enabled route pattern: ${enabled.pattern}`.green)
          else
            console.error(
              `Failed to enabled route pattern: ${enabled.pattern}`.red
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
    await Promise.all(newRoutes.map(this._cfMethods.createRoute))
  }

  apply(compiler) {
    return compiler.hooks.afterEmit.tapPromise(
      'CloudflareWorkerPlugin',
      async compilation => {
        if (!this._enabled)
          return console.info(`Cloudflare deployment disabled.`.yellow)

        try {
          let filename, code

          if (!this._skipWorkerUpload) {
            filename = this._script || compilation.outputOptions.filename
            code = compilation.assets[filename]
              ? compilation.assets[filename].source()
              : fs.readFileSync(filename).toString()

            this._logg(`Uploading worker...`, `green`)

            await this._cfMethods.uploadWorker(Buffer.from(code))
          } else {
            console.info(`Skipping Cloudflare worker upload...`.yellow)
          }

          if (this._pattern) {
            await this._upsertPattern()
          }
        } catch (err) {
          console.error(`${err.message}`.red)
          throw err
        }
      }
    )
  }
}

module.exports = CloudflareWorkerPlugin
