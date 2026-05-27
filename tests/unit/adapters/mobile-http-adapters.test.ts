import { BadRequestException } from '@nestjs/common';

import { extractBearerToken } from '../../../src/adapters/inbound/http/bearer-auth.guard';
import { requireAuthRequest } from '../../../src/adapters/inbound/http/dto/auth.dto';
import { parseOptionalPositiveInteger } from '../../../src/adapters/inbound/http/dto/measurement.dto';
import { ApiError, toHttpException } from '../../../src/adapters/inbound/http/http-error.mapper';

describe('mobile HTTP adapter helpers', () => {
  it('extracts bearer tokens from string and array headers', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken(['Bearer first', 'Bearer second'])).toBe('first');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('validates auth request DTO shape', () => {
    expect(requireAuthRequest({ email: 'demo@example.com', password: 'password123' })).toEqual({
      email: 'demo@example.com',
      password: 'password123',
    });
    expect(() => requireAuthRequest({ email: 'demo@example.com' })).toThrow('email and password are required');
  });

  it('parses optional positive integer query values', () => {
    expect(parseOptionalPositiveInteger(undefined)).toBeUndefined();
    expect(parseOptionalPositiveInteger('20')).toBe(20);
    expect(() => parseOptionalPositiveInteger('1.5')).toThrow('query value must be an integer');
  });

  it('maps unknown errors and API errors to HTTP exceptions', () => {
    expect(toHttpException(new Error('oops'))).toBeInstanceOf(BadRequestException);
    expect(toHttpException(new ApiError('validation_error', 'bad request'))).toBeInstanceOf(BadRequestException);
  });
});
