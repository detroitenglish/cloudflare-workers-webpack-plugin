import 'colors'
import axios from 'axios'
import isHost from 'is-valid-host'
import { printError } from './bootstrap'
export async function queryZoneInfo(authEmail, authKey, { site: name }) {
  if (!isHost(name))
    throw new Error(`Provided site '${name}' is not a valid FQDN`)

  const request = await axios({
    url: `https://api.cloudflare.com/client/v4/zones`,
    method: 'GET',
    headers: {
      'x-auth-email': authEmail,
      'x-auth-key': authKey,
      'content-type': 'application/json',
    },
    params: { name },
  })
    .then(response => response.data)
    .catch(error => {
      printError(error)
      throw error
    })

  const { result } = request

  if (!result.length) throw new Error(`Unable to find zone-id`)
  const zoneData = result.shift()
  validatePermissions(zoneData)
  const { id } = zoneData
  return id
}

function validatePermissions({ permissions }) {
  if (!permissions.includes(`#worker:read`))
    throw new Error(`You do not have worker:read permission`)
  if (!permissions.includes(`#worker:edit`))
    throw new Error(`You do not have worker:edit permission`)
}
