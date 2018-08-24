import 'colors'
export default function(ax) {
  return { uploadWorker }

  async function uploadWorker(data) {
    const scriptSize = Math.floor(data.byteLength / 1024)
    if (scriptSize > 1000) {
      console.error(`Script size is ${scriptSize}KB`.red)
      throw new Error(`CF-Worker script size limit exceeded`)
    }
    await ax({
      url: `/workers/script`,
      method: 'PUT',
      headers: { 'content-type': 'application/javascript' },
      data,
    })

    return console.log(`Success! Worker script uploaded 🚀`.green)
  }
}
