import { Inject, Injectable } from '@nestjs/common';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { normalizeEmail } from '../../domain/services/email-normalization';
import type {
  BearerTokenGeneratorPort,
  BearerTokenStorePort,
} from '../ports/bearer-token-store.port';
import { BEARER_TOKEN_GENERATOR, BEARER_TOKEN_STORE } from '../ports/bearer-token-store.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { UserAccountStorePort } from '../ports/user-account-store.port';
import { USER_ACCOUNT_STORE } from '../ports/user-account-store.port';
import type { AuthTokenOutput } from './create-account.use-case';
import { issueToken } from './create-account.use-case';

export type LoginUserInput = {
  email: string;
  password: string;
  now?: Date;
  tokenTtlSeconds: number;
};

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_ACCOUNT_STORE) private readonly users: UserAccountStorePort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(BEARER_TOKEN_STORE) private readonly tokens: BearerTokenStorePort,
    @Inject(BEARER_TOKEN_GENERATOR) private readonly tokenGenerator: BearerTokenGeneratorPort,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthTokenOutput> {
    const email = parseEmail(input.email);
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw invalidCredentials();
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw invalidCredentials();
    }

    return issueToken(
      user,
      input.tokenTtlSeconds,
      input.now ?? new Date(),
      this.tokenGenerator,
      this.tokens,
    );
  }
}

function parseEmail(email: string): string {
  try {
    return normalizeEmail(email);
  } catch {
    throw new ApiError('validation_error', 'Email must be valid');
  }
}

function invalidCredentials(): ApiError {
  return new ApiError('unauthorized', 'Invalid email or password');
}
