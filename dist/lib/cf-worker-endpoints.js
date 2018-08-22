"use strict";

exports.__esModule = true;
exports.default = _default;

require("core-js/modules/es6.promise");

require("colors");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default(ax) {
  return {
    uploadWorker
  };

  function uploadWorker(_x) {
    return _uploadWorker.apply(this, arguments);
  }

  function* _ref(data) {
    const scriptSize = `${Math.floor(data.byteLength / 1024)}`;

    if (scriptSize > 1000) {
      console.error(`Script size is ${scriptSize}KB`.red);
      throw new Error(`CF-Worker script size limit exceeded`);
    }

    yield ax({
      url: `/workers/script`,
      method: 'PUT',
      headers: {
        'content-type': 'application/javascript'
      },
      data
    });
    return console.log(`Success! Worker script uploaded 🚀`.green);
  }

  function _uploadWorker() {
    _uploadWorker = _asyncToGenerator(_ref);
    return _uploadWorker.apply(this, arguments);
  }
}