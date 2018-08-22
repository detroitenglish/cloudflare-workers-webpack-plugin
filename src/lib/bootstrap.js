import 'colors'
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
    timeout: 2e4,
  })
  instance.interceptors.response.use(
    response => response.data,
    err => {
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
      throw err
    }
  )

  return { ...routeEndpoints(instance), ...workerEndpoints(instance) }
}
