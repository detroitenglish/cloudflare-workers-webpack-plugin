import 'colors'
export default function(ax) {
  return { createRoute, getRoutes, deleteRoute }

  async function createRoute({ pattern, enabled }) {
    await ax({
      url: `/workers/filters`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      data: { pattern, enabled },
    }).catch(() => ({ ok: false, pattern }))
    return { ok: true, pattern, enabled }
  }

  async function getRoutes() {
    return (
      (await ax({
        url: `/workers/filters`,
        method: 'GET',
      })) || {}
    )
  }

  async function deleteRoute({ id, pattern }) {
    await ax({
      url: `/workers/filters/${id}`,
      method: 'DELETE',
    }).catch(() => ({ ok: false, pattern }))
    return { ok: true, pattern }
  }
}
