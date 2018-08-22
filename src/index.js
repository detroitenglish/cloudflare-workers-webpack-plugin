import 'colors'
import cfMethods from './lib'
import fs from 'fs'
import path from 'path'

class CloudflareWorkerPlugin {
  constructor(
    authEmail = null,
    authKey = null,
    { zone = null, enabled = true, script, pattern, clearRoutes, verbose }
  ) {
    const requiredConfig = {
      'CF-Account-Email': authEmail,
      'CF-API-Key': authKey,
      zone,
    }
    for (let [key, value] of Object.entries(requiredConfig)) {
      if (!value) {
        throw new Error(`'${key}' is undefined`)
      }
      if (typeof value !== 'string') {
        throw new Error(`'${key}' is not a string`)
      }
    }
    for (let [key, value] of Object.entries({ script, pattern })) {
      if (value && typeof value !== 'string') {
        throw new Error(`'${key}' must be a string`)
      }
    }
    this._script =
      script && enabled ? path.normalize(`${process.cwd()}/${script}`) : void 0
    this._pattern = pattern
    this._enabled = enabled === true
    this._cfMethods = enabled ? { ...cfMethods(authEmail, authKey, zone) } : {}
    this._clearRoutes = clearRoutes === true
    this._verbose = verbose === true
  }

  logg(stuff, color = `cyan`) {
    if (!this._verbose) return void 0
    return typeof stuff === 'object'
      ? console.info(`${JSON.stringify(stuff, null, 2)}`[color])
      : console.info(`${stuff}`[color])
  }

  async processExistingRoutes() {
    let matchingRoute
    let shouldCreateNewRoute = true
    let { result: existingRoutes } = await this._cfMethods.getRoutes()

    if (this._clearRoutes) {
      this.logg(
        `Deleting all routes: ${existingRoutes.map(r => r.pattern).join(', ')}`
      )
      const deletedRoutes = await Promise.all(
        existingRoutes.map(this._cfMethods.deleteRoute)
      )
      this.logg(`Deleted patterns: ${deletedRoutes.join(', ')}`.red)
      return true
    }

    const matchIndex = existingRoutes.findIndex(
      r => r.pattern === this._pattern
    )

    if (matchIndex > -1) {
      shouldCreateNewRoute = false
      matchingRoute = existingRoutes.splice(matchIndex, 1).pop()
      if (matchingRoute.enabled) {
        this.logg(`Pattern already enabled: ${matchingRoute.pattern}`, `green`)
      } else {
        this.logg(
          `Re-enabling exiting pattern: ${matchingRoute.pattern}`,
          `green`
        )
        const enabledRoute = await this._cfMethods.enableRoute(matchingRoute)
        console.info(`Enabled route pattern: ${enabledRoute}`.green)
      }
    }

    const disabledRoutes = await Promise.all(
      existingRoutes.map(this._cfMethods.disableRoute)
    ).then(arr => arr.filter(Boolean))

    if (disabledRoutes.length) {
      this.logg(`Disabled patterns: ${disabledRoutes.join(', ')}`.yellow)
    }

    return shouldCreateNewRoute
  }

  async upsertNewPattern() {
    const shouldCreateNewRoute = await this.processExistingRoutes()
    if (!shouldCreateNewRoute) return
    await this._cfMethods.createRoute(this._pattern)
  }

  apply(compiler) {
    return compiler.hooks.afterEmit.tapPromise(
      'CloudflareWorkerPlugin',
      async compilation => {
        if (!this._enabled)
          return console.info(`Cloudflare deployment disabled.`.yellow)
        let filename, code
        try {
          filename = this._script || compilation.outputOptions.filename
          code = compilation.assets[filename]
            ? compilation.assets[filename].source()
            : fs.readFileSync(filename).toString()
          if (this._pattern) {
            await this.upsertNewPattern()
          }
          this.logg(`Uploading worker...`, `green`)
          return this._cfMethods.uploadWorker(Buffer.from(code))
        } catch (err) {
          console.error(`${err.message}`.red)
          throw err
        }
      }
    )
  }
}

module.exports = CloudflareWorkerPlugin
