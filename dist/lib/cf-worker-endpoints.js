"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("colors");

var _formData = _interopRequireDefault(require("form-data"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(ax, scriptName) {
  return {
    uploadWorker,
    deleteWorker
  };

  async function uploadWorker({
    script,
    metadata
  }) {
    let form, headers, data;
    const scriptSize = Math.floor(script.byteLength / 1024);

    if (scriptSize > 1000) {
      throw new Error(`CF-Worker script size limit exceeded (${scriptSize}KB)`);
    }

    if (metadata) {
      form = new _formData.default();
      form.append(`script`, script.toString(), {
        contentType: `application/javascript`
      });
      form.append(`metadata`, metadata.toString(), {
        contentType: `application/json`
      });
      headers = form.getHeaders();
      data = form;
    } else {
      headers = {
        'content-type': `application/javascript`
      };
      data = script;
    }

    await ax({
      url: `/workers/scripts/${scriptName}`,
      method: `PUT`,
      headers,
      data
    });
  }

  async function deleteWorker() {
    const {
      success: ok
    } = await ax({
      url: `/workers/scripts/${scriptName}`,
      method: `DELETE`
    }).catch(err => {
      if (err.sucess) return err;else throw err;
    });
    return {
      ok
    };
  }
}