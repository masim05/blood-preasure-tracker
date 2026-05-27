import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

export const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5;
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMITED_MESSAGE = 'Too many authentication attempts; try again later';

type AuthRateLimitedRequest = {
  ip?: string;
  socket?: { remoteAddress?: string };
  body?: { email?: unknown };
};

type RateLimitBucket = {
  attempts: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRateLimitedRequest>();
    const now = Date.now();
    const key = rateLimitKey(request);
    const bucket = currentBucket(key, now);
    bucket.attempts += 1;
    buckets.set(key, bucket);

    if (bucket.attempts > AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
      throw new HttpException({ error: 'rate_limited', message: RATE_LIMITED_MESSAGE }, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}

export function clearAuthRateLimitBuckets(): void {
  buckets.clear();
}

function currentBucket(key: string, now: number): RateLimitBucket {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return { attempts: 0, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS };
  }

  return bucket;
}

function rateLimitKey(request: AuthRateLimitedRequest): string {
  const client = request.ip ?? request.socket?.remoteAddress ?? 'unknown-client';
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : 'unknown-email';

  return `${client}:${email}`;
}
