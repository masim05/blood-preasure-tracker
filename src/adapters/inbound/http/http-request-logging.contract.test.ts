import { EventEmitter } from 'node:events';

import { loadApiLoggingConfig } from '../../../infrastructure/config/api-logging-config';
import { createHttpRequestLogEntry, HttpRequestLoggingMiddleware } from './http-request-logging';

describe('mobile API logging contract', () => {
  it('selects development debug logging for unset and non-production NODE_ENV values', () => {
    expect(loadApiLoggingConfig({})).toMatchObject({ mode: 'development', debugHttpRequests: true });
    expect(loadApiLoggingConfig({ NODE_ENV: 'development' }).levels).toContain('debug');
    expect(loadApiLoggingConfig({ NODE_ENV: 'test' }).levels).toContain('debug');
  });

  it('selects production warn-and-above logging only for NODE_ENV production', () => {
    expect(loadApiLoggingConfig({ NODE_ENV: 'production' })).toEqual({
      mode: 'production',
      levels: ['error', 'warn'],
      debugHttpRequests: false,
    });
  });

  it('defines required debug request/status fields for signin and upload routes', () => {
    expect(createHttpRequestLogEntry({ method: 'POST', originalUrl: '/api/v1/signin', url: '/signin' }, 201, 5)).toEqual({
      level: 'debug',
      method: 'POST',
      path: '/api/v1/signin',
      statusCode: 201,
      durationMs: 5,
    });
    expect(createHttpRequestLogEntry({ method: 'POST', originalUrl: '/api/v1/measurements', url: '/measurements' }, 201, 9)).toMatchObject({
      level: 'debug',
      method: 'POST',
      path: '/api/v1/measurements',
      statusCode: 201,
    });
  });

  it('defines required debug request/status fields for detail, image, save, and history routes', () => {
    expect(createHttpRequestLogEntry({ method: 'GET', originalUrl: '/api/v1/measurements/msr_1', url: '/msr_1' }, 200, 4)).toMatchObject({
      method: 'GET',
      path: '/api/v1/measurements/msr_1',
      statusCode: 200,
    });
    expect(createHttpRequestLogEntry({ method: 'GET', originalUrl: '/api/v1/measurements/msr_1/image', url: '/msr_1/image' }, 200, 4)).toMatchObject({
      method: 'GET',
      path: '/api/v1/measurements/msr_1/image',
      statusCode: 200,
    });
    expect(createHttpRequestLogEntry({ method: 'POST', originalUrl: '/api/v1/measurements/msr_1/save', url: '/msr_1/save' }, 201, 4)).toMatchObject({
      method: 'POST',
      path: '/api/v1/measurements/msr_1/save',
      statusCode: 201,
    });
    expect(createHttpRequestLogEntry({ method: 'GET', originalUrl: '/api/v1/measurements', url: '/measurements' }, 400, 4)).toMatchObject({
      method: 'GET',
      path: '/api/v1/measurements',
      statusCode: 400,
    });
  });

  it('keeps sensitive values out of serialized request/status logs', () => {
    const serialized = JSON.stringify(
      createHttpRequestLogEntry({ method: 'POST', originalUrl: '/api/v1/login', url: '/login' }, 401, 2),
    );

    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('multipart');
    expect(serialized).not.toContain('systolic');
    expect(serialized).not.toContain('image');
  });

  it('writes error request logs in production mode while suppressing debug entries', () => {
    const productionLogging = loadApiLoggingConfig({ NODE_ENV: 'production' });
    const writtenLogs: string[] = [];
    const requestLogging = HttpRequestLoggingMiddleware.withLogger({
      debug: (message: string): void => {
        if (productionLogging.levels.includes('debug')) {
          writtenLogs.push(message);
        }
      },
      error: (message: string): void => {
        if (productionLogging.levels.includes('error')) {
          writtenLogs.push(message);
        }
      },
    });

    const successResponse = new EventEmitter() as EventEmitter & { statusCode: number; once: EventEmitter['once'] };
    successResponse.statusCode = 200;
    requestLogging.use({ method: 'GET', originalUrl: '/api/v1/measurements', url: '/measurements' }, successResponse, jest.fn());
    successResponse.emit('finish');

    const errorResponse = new EventEmitter() as EventEmitter & { statusCode: number; once: EventEmitter['once'] };
    errorResponse.statusCode = 500;
    requestLogging.use({ method: 'GET', originalUrl: '/api/v1/measurements', url: '/measurements' }, errorResponse, jest.fn());
    errorResponse.emit('finish');

    expect(writtenLogs).toHaveLength(1);
    expect(JSON.parse(writtenLogs[0]) as unknown).toMatchObject({
      level: 'error',
      method: 'GET',
      path: '/api/v1/measurements',
      statusCode: 500,
    });
  });
});
