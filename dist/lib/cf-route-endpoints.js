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
    deleteRoute
  };

  async function createRoute({
    pattern,
    script
  }) {
    await ax({
      url: `/workers/routes`,
      method: `POST`,
      headers: {
        'content-type': `application/json`
      },
      data: {
        pattern,
        script
      }
    }).catch(() => {
      return {
        ok: false,
        pattern
      };
    });
    return {
      ok: true,
      pattern,
      script
    };
  }

  async function getRoutes() {
    return (await ax({
      url: `/workers/routes`,
      method: `GET`
    })) || {};
  }

  async function deleteRoute({
    id,
    pattern
  }) {
    await ax({
      url: `/workers/routes/${id}`,
      method: `DELETE`
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