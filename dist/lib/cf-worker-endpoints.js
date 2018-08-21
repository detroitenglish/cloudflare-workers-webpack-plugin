"use strict";

exports.__esModule = true;
exports.default = _default;

require("core-js/modules/es6.promise");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default(ax) {
  return {
    uploadWorker,
    downloadWorker,
    deleteWorker
  };

  function uploadWorker(_x) {
    return _uploadWorker.apply(this, arguments);
  }

  function* _ref(data) {
    const result = yield ax({
      url: `/workers/script`,
      method: 'PUT',
      headers: {
        'content-type': 'application/javascript'
      },
      data
    });
    return result;
  }

  function _uploadWorker() {
    _uploadWorker = _asyncToGenerator(_ref);
    return _uploadWorker.apply(this, arguments);
  }

  function downloadWorker() {
    return _downloadWorker.apply(this, arguments);
  }

  function* _ref2() {
    const result = yield ax({
      url: `/workers/script`,
      method: 'GET'
    });
    return result;
  }

  function _downloadWorker() {
    _downloadWorker = _asyncToGenerator(_ref2);
    return _downloadWorker.apply(this, arguments);
  }

  function deleteWorker() {
    return _deleteWorker.apply(this, arguments);
  }

  function* _ref3() {
    const result = yield ax({
      url: `/workers/script`,
      method: 'DELETE'
    });
    return result;
  }

  function _deleteWorker() {
    _deleteWorker = _asyncToGenerator(_ref3);
    return _deleteWorker.apply(this, arguments);
  }
}