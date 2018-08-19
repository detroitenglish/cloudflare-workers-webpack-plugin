"use strict";

exports.__esModule = true;
exports.default = _default;

function _default(ax) {
  return {
    uploadWorker,
    downloadWorker,
    deleteWorker
  };

  async function uploadWorker(data) {
    const result = await ax({
      url: `/workers/script`,
      method: 'PUT',
      headers: {
        'content-type': 'application/javascript'
      },
      data
    });
    return result;
  }

  async function downloadWorker() {
    const result = await ax({
      url: `/workers/script`,
      method: 'GET'
    });
    return result;
  }

  async function deleteWorker() {
    const result = await ax({
      url: `/workers/script`,
      method: 'DELETE'
    });
    return result;
  }
}