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
      originalUrl:
        '/api/v1/measurements?token=query-secret&email=patient@example.com',
      url: '/measurements',
      headers: {
        authorization: 'Bearer private-token',
        cookie: 'session=private-cookie',
      },
      body: { password: 'private-password', systolic: 180 },
    };
    const error = new TypeError(
      'Key (email)=(patient@example.com) already exists for Alice; systolic 180',
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
        type: 'error',
        name: 'TypeError',
        message: 'Unexpected TypeError',
      },
    });
    expect(JSON.parse(serialized).exception.stack).toEqual({
      frameCount: expect.any(Number),
      fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    for (const sensitive of [
      'private-token',
      'private-cookie',
      'private-password',
      'query-secret',
      'patient@example.com',
      'Alice',
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
        type: 'non_error',
        name: 'NonErrorThrown',
        message: 'Unexpected non-Error value thrown',
      },
    });
  });

  it('does not fail when an Error stack accessor throws', () => {
    const error = new Error('patient free-form value');
    Object.defineProperty(error, 'stack', {
      get: () => {
        throw new Error('stack unavailable');
      },
    });

    expect(
      createUnexpectedErrorLogEntry(
        { method: 'GET', url: '/api/v1/test?secret=value' },
        error,
      ),
    ).toEqual({
      level: 'error',
      method: 'GET',
      path: '/api/v1/test',
      statusCode: 500,
      exception: {
        type: 'error',
        name: 'Error',
        message: 'Unexpected Error',
      },
    });
  });

  it.each([
    [new EvalError('private'), 'EvalError'],
    [new RangeError('private'), 'RangeError'],
    [new ReferenceError('private'), 'ReferenceError'],
    [new SyntaxError('private'), 'SyntaxError'],
    [new URIError('private'), 'URIError'],
  ])('allow-lists the built-in %s name', (error, expectedName) => {
    expect(
      createUnexpectedErrorLogEntry(
        { method: 'GET', url: '/test#private' },
        error,
      ),
    ).toMatchObject({
      path: '/test',
      exception: {
        type: 'error',
        name: expectedName,
        message: `Unexpected ${expectedName}`,
      },
    });
  });

  it('omits a missing stack without exposing the error message', () => {
    const error = new Error('patient@example.com systolic 180');
    error.stack = '';

    expect(
      createUnexpectedErrorLogEntry({ method: 'GET', url: '/test' }, error)
        .exception,
    ).toEqual({
      type: 'error',
      name: 'Error',
      message: 'Unexpected Error',
    });
  });
});
