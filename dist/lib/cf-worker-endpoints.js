"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("colors");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default(ax) {
  return {
    uploadWorker,
    deleteWorker
  };

  function uploadWorker(_x) {
    return _uploadWorker.apply(this, arguments);
  }

  function* _ref2(data) {
    const scriptSize = Math.floor(data.byteLength / 1024);

    if (scriptSize > 1000) {
      throw new Error(`CF-Worker script size limit exceeded (${scriptSize}KB)`);
    }

    yield ax({
      url: `/workers/script`,
      method: 'PUT',
      headers: {
        'content-type': 'application/javascript'
      },
      data
    });
  }

  function _uploadWorker() {
    _uploadWorker = _asyncToGenerator(_ref2);
    return _uploadWorker.apply(this, arguments);
  }

  function deleteWorker() {
    return _deleteWorker.apply(this, arguments);
  }

  function* _ref3() {
    const _ref = yield ax({
      url: `/workers/script`,
      method: 'DELETE'
    }),
          ok = _ref.success;

    return {
      ok
    };
  }

  function _deleteWorker() {
    _deleteWorker = _asyncToGenerator(_ref3);
    return _deleteWorker.apply(this, arguments);
  }
}