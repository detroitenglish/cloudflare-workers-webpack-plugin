import 'colors'
import axios from 'axios'
import routeEndpoints from './cf-route-endpoints'
import workerEndpoints from './cf-worker-endpoints'

export function cfMethods(cfMail, cfKey, zoneId) {
  const instance = axios.create({
    baseURL: `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
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

  return { ...routeEndpoints(instance), ...workerEndpoints(instance) }
}

function printError(err) {
  const errors = err?.response?.data.errors
  if (errors && Array.isArray(errors)) {
    errors.forEach(error => {
      if (error.message)
        console.error(`[code ${error.code}]: ${error.message}`.red)
      else console.error(`${JSON.stringify(error, null, 2)}`.red)
    })
  } else {
    console.error(err)
  }
}

export function validateConfig([
  authEmail,
  authKey,
  { zone, script, pattern },
]) {
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
