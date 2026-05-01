'use strict';

const { ok, fail } = require('../../src/utils/responses');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('responses', () => {
  test('ok sends success payload', () => {
    const res = mockRes();
    ok(res, { a: 1 }, 200);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { a: 1 } });
  });

  test('fail sends error payload without details when omitted', () => {
    const res = mockRes();
    fail(res, 404, 'NOT_FOUND', 'missing');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'missing' },
    });
  });

  test('fail includes details when provided', () => {
    const res = mockRes();
    fail(res, 400, 'VALIDATION_ERROR', 'bad', [{ path: ['x'], message: 'required' }]);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'bad',
        details: [{ path: ['x'], message: 'required' }],
      },
    });
  });
});
