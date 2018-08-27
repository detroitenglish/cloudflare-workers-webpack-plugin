import 'colors'
export default function(ax) {
  return { uploadWorker, deleteWorker }

  async function uploadWorker(data) {
    const scriptSize = Math.floor(data.byteLength / 1024)
    if (scriptSize > 1000) {
      throw new Error(`CF-Worker script size limit exceeded (${scriptSize}KB)`)
    }
    await ax({
      url: `/workers/script`,
      method: 'PUT',
      headers: { 'content-type': 'application/javascript' },
      data,
    })
  }

  async function deleteWorker() {
    const { success: ok } = await ax({
      url: `/workers/script`,
      method: 'DELETE',
    })
    return { ok }
  }
}
