import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import type {
  BearerTokenGeneratorPort,
  BearerTokenStorePort,
} from '../ports/bearer-token-store.port';
import { BEARER_TOKEN_GENERATOR, BEARER_TOKEN_STORE } from '../ports/bearer-token-store.port';
import type { UserAccountStorePort } from '../ports/user-account-store.port';
import { USER_ACCOUNT_STORE } from '../ports/user-account-store.port';

export type AuthenticateBearerTokenInput = {
  accessToken: string;
  now?: Date;
};

export type AuthenticatedUserOutput = {
  user: { id: string; email: string };
};

@Injectable()
export class AuthenticateBearerTokenUseCase {
  constructor(
    @Inject(BEARER_TOKEN_STORE) private readonly tokens: BearerTokenStorePort,
    @Inject(BEARER_TOKEN_GENERATOR) private readonly tokenGenerator: BearerTokenGeneratorPort,
    @Inject(USER_ACCOUNT_STORE) private readonly users: UserAccountStorePort,
  ) {}

  async execute(input: AuthenticateBearerTokenInput): Promise<AuthenticatedUserOutput> {
    const token = await this.tokens.findByHash(this.tokenGenerator.hash(input.accessToken));
    if (!token || !token.isActive(input.now ?? new Date())) {
      throw new ApiError('unauthorized', 'Bearer token is invalid or expired');
    }

    const user = await this.users.findById(token.userId);
    if (!user) {
      throw new ApiError('unauthorized', 'Bearer token is invalid or expired');
    }

    return { user: { id: user.id, email: user.email } };
  }
}
