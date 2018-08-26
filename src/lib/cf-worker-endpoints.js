import 'colors'
export default function(ax) {
  return { uploadWorker }

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
}
