export default function(ax) {
  return { createRoute, getRoutes, disableRoute, deleteRoute }

  async function createRoute(pattern, enabled = true) {
    const result = await ax({
      url: `/workers/filters`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      data: { pattern, enabled },
    })

    return result
  }

  async function getRoutes() {
    const result = await ax({
      url: `/workers/filters`,
      method: 'GET',
    })
    return result
  }

  async function disableRoute({ pattern, enabled, id }) {
    if (!enabled) return
    const result = await ax({
      url: `/workers/filters/${id}`,
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      data: { pattern, enabled: false },
    })

    return result
  }

  async function deleteRoute({ id }) {
    const result = await ax({
      url: `/workers/filters/${id}`,
      method: 'DELETE',
    })
    return result
  }
}
