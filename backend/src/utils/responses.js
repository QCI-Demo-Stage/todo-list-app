'use strict';

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, status, code, message, details) {
  const body = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return res.status(status).json(body);
}

module.exports = { ok, fail };
