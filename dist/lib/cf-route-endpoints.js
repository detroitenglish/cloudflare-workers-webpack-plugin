"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("colors");

function _default(ax) {
  return {
    createRoute,
    getRoutes,
    enableRoute,
    disableRoute,
    deleteRoute
  };

  async function createRoute(pattern) {
    await ax({
      url: `/workers/filters`,
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        pattern,
        enabled: true
      }
    }).catch(() => ({
      ok: false,
      pattern
    }));
    return {
      ok: true,
      pattern
    };
  }

  async function getRoutes() {
    return await ax({
      url: `/workers/filters`,
      method: 'GET'
    });
  }

  async function disableRoute({
    pattern,
    enabled,
    id
  }) {
    if (!enabled) return {
      ok: true,
      pattern,
      skipped: true
    };
    await ax({
      url: `/workers/filters/${id}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        pattern,
        enabled: false
      }
    }).catch(() => ({
      ok: false,
      pattern
    }));
    return {
      ok: true,
      pattern
    };
  }

  async function enableRoute({
    pattern,
    enabled,
    id
  }) {
    if (enabled) return {
      ok: true,
      pattern
    };
    await ax({
      url: `/workers/filters/${id}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        pattern,
        enabled: true
      }
    }).catch(() => ({
      ok: false,
      pattern
    }));
    return {
      ok: true,
      pattern
    };
  }

  async function deleteRoute({
    id,
    pattern
  }) {
    await ax({
      url: `/workers/filters/${id}`,
      method: 'DELETE'
    }).catch(() => ({
      ok: false,
      pattern
    }));
    return {
      ok: true,
      pattern
    };
  }
}