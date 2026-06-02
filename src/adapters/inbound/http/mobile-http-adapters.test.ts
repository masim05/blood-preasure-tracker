import { BadRequestException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { extractBearerToken } from './bearer-auth.guard';
import { requireAuthRequest } from './dto/auth.dto';
import { parseMeasurementOverride, parseOptionalPositiveInteger, parseSaveMeasurement } from './dto/measurement.dto';
import { ApiError, toHttpException } from './http-error.mapper';
import { CreateAccountUseCase } from '../../../application/use-cases/create-account.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import {
  InMemoryBearerTokenStore,
  InMemoryUserStore,
  SimplePasswordHasher,
  StaticTokenGenerator,
} from '../../../test-support/mobile-api-fakes';
import type { ApiConfigService } from '../../../infrastructure/config/api-config';

const now = new Date('2026-05-27T12:00:00.000Z');

function makeApiConfig(accessTokenTtlSeconds: number): ApiConfigService {
  return {
    load: () => ({
      databaseUrl: 'postgres://example',
      apiPort: 3000,
      measurementImageDirectory: './tmp/images',
      accessTokenTtlSeconds,
      recognitionWorkerIntervalSeconds: 10,
      recognitionWorkerBatchSize: 4,
    }),
  } as ApiConfigService;
}

describe('mobile HTTP adapter helpers', () => {
  it('extracts bearer tokens from string and array headers', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken(['Bearer first', 'Bearer second'])).toBe('first');
    expect(extractBearerToken('Bearer abc def')).toBeNull();
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

  it('parses measurement override payloads', () => {
    expect(parseMeasurementOverride({ systolic: 121 })).toEqual({
      systolic: 121,
      diastolic: undefined,
      pulse: undefined,
    });
    expect(() => parseMeasurementOverride(undefined)).toThrow(
      'at least one of systolic, diastolic, pulse is required',
    );
    expect(() => parseMeasurementOverride({ pulse: 0 })).toThrow('pulse must be a positive integer');
    expect(() => parseMeasurementOverride({ systolic: 121, unexpected: true } as never)).toThrow(
      'unexpected field: unexpected',
    );
  });

  it('parses save payloads with optional arm side', () => {
    expect(parseSaveMeasurement({ armSide: 'right' })).toEqual({
      systolic: undefined,
      diastolic: undefined,
      pulse: undefined,
      armSide: 'right',
    });
    expect(parseSaveMeasurement(undefined)).toEqual({
      systolic: undefined,
      diastolic: undefined,
      pulse: undefined,
      armSide: undefined,
    });
    expect(() => parseSaveMeasurement({ armSide: 'up' as never })).toThrow(
      'armSide must be one of left, right, unknown',
    );
    expect(() => parseSaveMeasurement({ armSide: 'left', unexpected: true } as never)).toThrow(
      'unexpected field: unexpected',
    );
  });

  it('maps unknown errors and API errors to HTTP exceptions', () => {
    expect(toHttpException(new Error('oops'))).toBeInstanceOf(BadRequestException);
    expect(toHttpException(new ApiError('validation_error', 'bad request'))).toBeInstanceOf(BadRequestException);
  });
});

describe('auth controller TTL propagation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes configured seven-day TTL to issued tokens', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    const hasher = new SimplePasswordHasher();
    const controller = new AuthController(
      new CreateAccountUseCase(users, hasher, tokens, new StaticTokenGenerator('signin-token')),
      new LoginUserUseCase(users, hasher, tokens, new StaticTokenGenerator('login-token')),
      makeApiConfig(604800),
    );

    const signinResult = await controller.signin({ email: 'demo@example.com', password: 'password123' });
    expect(signinResult.expiresAt).toBe('2026-06-03T12:00:00.000Z');

    const loginResult = await controller.login({ email: 'demo@example.com', password: 'password123' });
    expect(loginResult.expiresAt).toBe('2026-06-03T12:00:00.000Z');
  });

  it('reflects a custom TTL override in issued token expiry', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    const hasher = new SimplePasswordHasher();
    const controller = new AuthController(
      new CreateAccountUseCase(users, hasher, tokens, new StaticTokenGenerator()),
      new LoginUserUseCase(users, hasher, tokens, new StaticTokenGenerator()),
      makeApiConfig(3600),
    );

    const result = await controller.signin({ email: 'demo@example.com', password: 'password123' });
    expect(result.expiresAt).toBe('2026-05-27T13:00:00.000Z');
  });
});
