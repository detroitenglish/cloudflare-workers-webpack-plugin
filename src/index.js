import cfMethods from './lib'

export default class CloudflareWorkerPlugin {
  constructor(authEmail, authKey, { zone, pattern }) {
    this._pattern = pattern
    this._cfMethods = { ...cfMethods(authEmail, authKey, zone) }
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
        const { filename } = compilation.outputOptions
        const workerScript = compilation.assets[filename].source()
        if (this._pattern) {
          await this.upsertNewPattern()
        }
        return this._cfMethods.uploadWorker(Buffer.from(workerScript))
      }
    )
  }
}
