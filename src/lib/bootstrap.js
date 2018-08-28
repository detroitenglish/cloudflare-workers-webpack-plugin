import 'colors'
import axios from 'axios'
import routeEndpoints from './cf-route-endpoints'
import workerEndpoints from './cf-worker-endpoints'

export function cfMethods(cfMail, cfKey, { zone }) {
  if (!zone) return void 0
  const instance = axios.create({
    baseURL: `https://api.cloudflare.com/client/v4/zones/${zone}`,
    headers: {
      'X-Auth-Email': cfMail,
      'X-Auth-Key': cfKey,
    },
    timeout: 2e4,
  })
  instance.interceptors.response.use(
    response => response.data,
    err => {
      printError(err)
      throw err
    }
  )

  return {
    ...routeEndpoints(instance),
    ...workerEndpoints(instance),
  }
}

export function printError(err) {
  const errors = err?.response?.data.errors
  if (errors?.length) {
    for (let { code, message } of errors) {
      console.error(`[code ${code}]: ${message}`)
    }
  } else {
    console.error(err)
  }
}

export function validateConfig([
  authEmail,
  authKey,
  { zone, site, script, pattern },
]) {
  if (!zone && !site)
    throw new Error(`You must provide either a zone-id or site name`)
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

  if (script && typeof script !== 'string')
    throw new Error(`'script' is not a string`)

  if (pattern) {
    if (Array.isArray(pattern) && !pattern.every(p => typeof p === 'string')) {
      throw new Error(`'pattern' must be a string or array of strings`)
    } else if (typeof pattern !== 'string') {
      throw new Error(`'pattern' must be a string or array of strings`)
    }
  }
}

export function logg(
  stuff,
  color = `cyan`,
  emoji = color === `yellow` ? `⚠` : '👍'
) {
  if (!this._verbose) return void 0

  let logType = color === `red` ? `error` : `info`

  if (!this._colors) color = void 0
  if (!this._emoji) emoji = void 0

  let text = emoji ? `${emoji}  | ` : ``

  switch (typeof stuff) {
    case 'object':
      text += color
        ? `${JSON.stringify(stuff, null, 2)}`[color]
        : `${JSON.stringify(stuff, null, 2)}`
      break
    default:
      text += color ? String(stuff)[color] : String(stuff)
  }

  console[logType](text)
}
