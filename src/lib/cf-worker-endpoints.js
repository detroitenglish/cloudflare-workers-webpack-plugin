import 'colors'
import FormData from 'form-data'

export default function(ax, scriptName) {
  return { uploadWorker, deleteWorker }

  async function uploadWorker({ script, metadata }) {
    let form, headers, data
    const scriptSize = Math.floor(script.byteLength / 1024)
    if (scriptSize > 1000) {
      throw new Error(`CF-Worker script size limit exceeded (${scriptSize}KB)`)
    }

    if (metadata) {
      form = new FormData()
      form.append('script', script.toString(), {
        contentType: 'application/javascript',
      })
      form.append('metadata', metadata.toString(), {
        contentType: 'application/json',
      })
      headers = form.getHeaders()
      data = form
    } else {
      headers = { 'content-type': 'application/javascript' }
      data = script
    }
    await ax({
      url: `/workers/scripts/${scriptName}`,
      method: 'PUT',
      headers,
      data,
    })
  }

  async function deleteWorker() {
    const { success: ok } = await ax({
      url: `/workers/script`,
      method: 'DELETE',
    }).catch(err => {
      if (err.sucess) return err
      else throw err
    })
    return { ok }
  }
}
