import { HttpException } from '@nestjs/common';

import {
  AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  AuthRateLimitGuard,
  clearAuthRateLimitBuckets,
} from '../../../src/adapters/inbound/http/auth-rate-limit.guard';

type ContextRequest = {
  ip?: string;
  socket?: { remoteAddress?: string };
  body?: { email?: unknown };
};

describe('AuthRateLimitGuard', () => {
  afterEach(() => {
    clearAuthRateLimitBuckets();
  });

  it('allows the configured number of attempts per client and email', () => {
    const guard = new AuthRateLimitGuard();

    for (let attempt = 0; attempt < AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      expect(guard.canActivate(context({ ip: '127.0.0.1', body: { email: 'Demo@Example.com' } }))).toBe(true);
    }
  });

  it('rejects additional attempts with the documented rate limit response', () => {
    const guard = new AuthRateLimitGuard();
    const contextStub = context({ ip: '127.0.0.1', body: { email: 'demo@example.com' } });

    for (let attempt = 0; attempt < AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      guard.canActivate(contextStub);
    }

    expect(() => guard.canActivate(contextStub)).toThrow(HttpException);
  });

  it('tracks different emails independently for the same client', () => {
    const guard = new AuthRateLimitGuard();

    for (let attempt = 0; attempt < AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      guard.canActivate(context({ ip: '127.0.0.1', body: { email: 'first@example.com' } }));
    }

    expect(guard.canActivate(context({ ip: '127.0.0.1', body: { email: 'second@example.com' } }))).toBe(true);
  });
});

function context(request: ContextRequest): never {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}
