import type { ArgumentsHost } from '@nestjs/common';

import { UnexpectedHttpException } from './http-error.mapper';
import {
  createUnexpectedErrorLogEntry,
  UnexpectedErrorFilter,
} from './unexpected-error.filter';

describe('UnexpectedErrorFilter', () => {
  it('logs safe request metadata and sanitized Error diagnostics before returning the stable body', () => {
    const logger = { error: jest.fn<void, [string]>() };
    const filter = UnexpectedErrorFilter.withLogger(logger);
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const request = {
      method: 'POST',
      originalUrl: '/api/v1/measurements',
      url: '/measurements',
      headers: {
        authorization: 'Bearer private-token',
        cookie: 'session=private-cookie',
      },
      body: { password: 'private-password', systolic: 180 },
    };
    const error = new Error(
      'database failed password=private-password token=private-token',
    );
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    filter.catch(new UnexpectedHttpException(error), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'internal_server_error',
      message: 'Internal server error',
    });
    const serialized = logger.error.mock.calls[0][0];
    expect(JSON.parse(serialized)).toMatchObject({
      level: 'error',
      method: 'POST',
      path: '/api/v1/measurements',
      statusCode: 500,
      exception: {
        name: 'Error',
        message: 'database failed password=[REDACTED] token=[REDACTED]',
      },
    });
    expect(JSON.parse(serialized).exception.stack).toContain(
      'Error: database failed password=[REDACTED]',
    );
    for (const sensitive of [
      'private-token',
      'private-cookie',
      'private-password',
      '180',
    ]) {
      expect(serialized).not.toContain(sensitive);
    }
  });

  it('does not inspect or serialize a non-Error thrown value', () => {
    const thrown = {
      toJSON: () => {
        throw new Error('must not serialize');
      },
      secret: 'private-object-value',
    };

    expect(
      createUnexpectedErrorLogEntry(
        { method: 'GET', originalUrl: '', url: '/api/v1/test' } as never,
        thrown,
      ),
    ).toEqual({
      level: 'error',
      method: 'GET',
      path: '/api/v1/test',
      statusCode: 500,
      exception: {
        name: 'NonErrorThrown',
        message: 'Unexpected non-Error value thrown',
      },
    });
  });
});
