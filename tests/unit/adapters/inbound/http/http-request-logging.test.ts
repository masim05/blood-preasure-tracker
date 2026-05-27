import { EventEmitter } from 'node:events';

import { createHttpRequestLogEntry, HttpRequestLoggingMiddleware } from '../../../../../src/adapters/inbound/http/http-request-logging';

describe('HTTP request logging', () => {
  it('creates a minimal debug request/status entry', () => {
    expect(
      createHttpRequestLogEntry(
        {
          method: 'POST',
          originalUrl: '/api/v1/signin',
          url: '/signin',
        },
        201,
        7,
      ),
    ).toEqual({
      level: 'debug',
      method: 'POST',
      path: '/api/v1/signin',
      statusCode: 201,
      durationMs: 7,
    });
  });

  it('falls back to url when originalUrl is unavailable', () => {
    expect(
      createHttpRequestLogEntry(
        {
          method: 'GET',
          url: '/api/v1/health',
        },
        200,
        1,
      ),
    ).toMatchObject({
      method: 'GET',
      path: '/api/v1/health',
      statusCode: 200,
    });
  });

  it('does not include sensitive request or response data in log entries', () => {
    const entry = createHttpRequestLogEntry(
      {
        method: 'POST',
        originalUrl: '/api/v1/login',
        url: '/login',
      },
      401,
      3,
    );

    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('access-token');
    expect(serialized).not.toContain('systolic');
    expect(serialized).not.toContain('image-bytes');
  });

  it('logs when the response finishes', () => {
    const logger = { debug: jest.fn<void, [string]>() };
    const middleware = HttpRequestLoggingMiddleware.withLogger(logger);
    const response = new EventEmitter() as EventEmitter & { statusCode: number };
    response.statusCode = 404;

    middleware.use(
      { method: 'GET', originalUrl: '/api/v1/measurements/missing', url: '/measurements/missing' },
      response,
      jest.fn(),
    );
    response.emit('finish');

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logger.debug.mock.calls[0][0]) as unknown).toMatchObject({
      level: 'debug',
      method: 'GET',
      path: '/api/v1/measurements/missing',
      statusCode: 404,
    });
  });
});
