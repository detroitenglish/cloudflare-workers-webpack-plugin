import 'colors'
export default function(ax) {
  return { createRoute, getRoutes, disableRoute, deleteRoute }

  async function createRoute(pattern, enabled = true) {
    await ax({
      url: `/workers/filters`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      data: { pattern, enabled },
    })
    return console.log(`Enabled new route pattern: ${pattern}`.green)
  }

  async function getRoutes() {
    return await ax({
      url: `/workers/filters`,
      method: 'GET',
    })
  }

  async function disableRoute({ pattern, enabled, id }) {
    if (!enabled) return
    await ax({
      url: `/workers/filters/${id}`,
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      data: { pattern, enabled: false },
    })

    return console.info(`Disabled route pattern: ${pattern}`.yellow)
  }

  async function deleteRoute({ id }) {
    await ax({
      url: `/workers/filters/${id}`,
      method: 'DELETE',
    })
  }
}
