import 'colors'
import cfMethods from './lib'

class CloudflareWorkerPlugin {
  constructor(
    authEmail = null,
    authKey = null,
    { zone = null, enabled = true, pattern }
  ) {
    const requiredParams = {
      'CF-Account-Email': authEmail,
      'CF-API-Key': authKey,
      zone,
    }
    for (let [key, value] of Object.entries(requiredParams)) {
      if (typeof value !== 'string') {
        throw new Error(`'${key}' either missing, or not a string`.red)
      }
    }
    if ({ pattern }.hasOwnProperty('pattern') && typeof pattern !== 'string') {
      throw new Error(`'pattern' must be a string.`.red)
    }
    this._enabled = !!enabled
    this._pattern = pattern
    this._cfMethods = enabled ? { ...cfMethods(authEmail, authKey, zone) } : {}
  }

  async disableExistingRoutes() {
    let { result } = await this._cfMethods.getRoutes()
    const matchingResult = result.find(r => r.pattern === this._pattern)
    if (matchingResult) {
      await this._cfMethods.deleteRoute(matchingResult)
      result = result.filter(r => r.pattern !== this._pattern)
    }
    await Promise.all(result.map(this._cfMethods.disableRoute))
  }

  async upsertNewPattern() {
    await this.disableExistingRoutes()
    await this._cfMethods.createRoute(this._pattern)
  }

  apply(compiler) {
    return compiler.hooks.emit.tapPromise(
      'CloudflareWorkerPlugin',
      async compilation => {
        if (!this._enabled)
          return console.info(`Cloudflare deployment disabled.`.yellow)
        try {
          const { filename } = compilation.outputOptions
          const workerScript = compilation.assets[filename].source()
          if (this._pattern) {
            await this.upsertNewPattern()
          }
          return this._cfMethods.uploadWorker(Buffer.from(workerScript))
        } catch (err) {
          console.error(`${err.message}`.red)
          throw err
        }
      }
    )
  }
}

module.exports = CloudflareWorkerPlugin
