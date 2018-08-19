import axios from 'axios'
import routeEndpoints from './cf-route-endpoints'
import workerEndpoints from './cf-worker-endpoints'

export default function(cfMail, cfKey, zoneId) {
  const instance = axios.create({
    baseURL: `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
    headers: {
      'X-Auth-Email': cfMail,
      'X-Auth-Key': cfKey,
    },
  })
  instance.interceptors.response.use(
    response => response.data,
    err => {
      const status = err.status || err.response.status
      if (status === 409) return { ok: false }
      console.error(err.response.data || err.message)
      Promise.reject(err)
    }
  )
  const routeFunctions = routeEndpoints(instance)
  const workerFunctions = workerEndpoints(instance)
  return Object.assign(routeFunctions, workerFunctions)
}
