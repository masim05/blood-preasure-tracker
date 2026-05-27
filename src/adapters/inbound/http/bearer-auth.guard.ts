import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthenticateBearerTokenUseCase } from '../../../application/use-cases/authenticate-bearer-token.use-case';
import { toHttpException } from './http-error.mapper';

export type AuthenticatedHttpRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: { id: string; email: string };
};

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthenticateBearerTokenUseCase)
    private readonly authenticateBearerToken: AuthenticateBearerTokenUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedHttpRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException({ error: 'unauthorized', message: 'Bearer token is required' });
    }

    try {
      const user = await this.authenticateBearerToken.execute({ accessToken: token });
      request.user = user.user;
    } catch (error) {
      throw toHttpException(error);
    }

    return true;
  }
}

export function extractBearerToken(value: string | string[] | undefined): string | null {
  const header = Array.isArray(value) ? value[0] : value;
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
