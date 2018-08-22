"use strict";

exports.__esModule = true;
exports.default = _default;

require("core-js/modules/es6.promise");

require("colors");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default(ax) {
  return {
    createRoute,
    getRoutes,
    enableRoute,
    disableRoute,
    deleteRoute
  };

  function createRoute(_x) {
    return _createRoute.apply(this, arguments);
  }

  function* _ref(pattern, enabled = true) {
    yield ax({
      url: `/workers/filters`,
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        pattern,
        enabled
      }
    });
    return console.log(`Enabled new route pattern: ${pattern}`.green);
  }

  function _createRoute() {
    _createRoute = _asyncToGenerator(_ref);
    return _createRoute.apply(this, arguments);
  }

  function getRoutes() {
    return _getRoutes.apply(this, arguments);
  }

  function* _ref2() {
    return yield ax({
      url: `/workers/filters`,
      method: 'GET'
    });
  }

  function _getRoutes() {
    _getRoutes = _asyncToGenerator(_ref2);
    return _getRoutes.apply(this, arguments);
  }

  function disableRoute(_x2) {
    return _disableRoute.apply(this, arguments);
  }

  function* _ref3({
    pattern,
    enabled,
    id
  }) {
    if (!enabled) return;
    yield ax({
      url: `/workers/filters/${id}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        pattern,
        enabled: false
      }
    });
    return pattern;
  }

  function _disableRoute() {
    _disableRoute = _asyncToGenerator(_ref3);
    return _disableRoute.apply(this, arguments);
  }

  function enableRoute(_x3) {
    return _enableRoute.apply(this, arguments);
  }

  function* _ref4({
    pattern,
    enabled,
    id
  }) {
    if (enabled) return;
    yield ax({
      url: `/workers/filters/${id}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        pattern,
        enabled: true
      }
    });
    return pattern;
  }

  function _enableRoute() {
    _enableRoute = _asyncToGenerator(_ref4);
    return _enableRoute.apply(this, arguments);
  }

  function deleteRoute(_x4) {
    return _deleteRoute.apply(this, arguments);
  }

  function* _ref5({
    id,
    pattern
  }) {
    yield ax({
      url: `/workers/filters/${id}`,
      method: 'DELETE'
    });
    return pattern;
  }

  function _deleteRoute() {
    _deleteRoute = _asyncToGenerator(_ref5);
    return _deleteRoute.apply(this, arguments);
  }
}