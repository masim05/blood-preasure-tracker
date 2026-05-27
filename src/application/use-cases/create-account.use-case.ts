import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ApiError } from '../../adapters/inbound/http/http-error.mapper';
import { BearerAccessToken } from '../../domain/entities/bearer-access-token';
import { UserAccount } from '../../domain/entities/user-account';
import { normalizeEmail } from '../../domain/services/email-normalization';
import { validatePassword } from '../../domain/services/password-policy';
import type {
  BearerTokenGeneratorPort,
  BearerTokenStorePort,
} from '../ports/bearer-token-store.port';
import { BEARER_TOKEN_GENERATOR, BEARER_TOKEN_STORE } from '../ports/bearer-token-store.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { UserAccountStorePort } from '../ports/user-account-store.port';
import { USER_ACCOUNT_STORE } from '../ports/user-account-store.port';

export type CreateAccountInput = {
  email: string;
  password: string;
  now?: Date;
  tokenTtlSeconds: number;
};

export type AuthTokenOutput = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: { id: string; email: string };
};

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(USER_ACCOUNT_STORE) private readonly users: UserAccountStorePort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(BEARER_TOKEN_STORE) private readonly tokens: BearerTokenStorePort,
    @Inject(BEARER_TOKEN_GENERATOR) private readonly tokenGenerator: BearerTokenGeneratorPort,
  ) {}

  async execute(input: CreateAccountInput): Promise<AuthTokenOutput> {
    const now = input.now ?? new Date();
    const email = parseEmail(input.email);
    parsePassword(input.password);

    if (await this.users.findByEmail(email)) {
      throw new ApiError('conflict', 'Email is already registered');
    }

    const user = new UserAccount({
      id: `usr_${randomUUID()}`,
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      createdAt: now,
      updatedAt: now,
    });
    await this.users.save(user);

    return issueToken(user, input.tokenTtlSeconds, now, this.tokenGenerator, this.tokens);
  }
}

export async function issueToken(
  user: UserAccount,
  tokenTtlSeconds: number,
  now: Date,
  tokenGenerator: BearerTokenGeneratorPort,
  tokens: BearerTokenStorePort,
): Promise<AuthTokenOutput> {
  const accessToken = tokenGenerator.generate();
  const expiresAt = new Date(now.getTime() + tokenTtlSeconds * 1000);
  await tokens.save(
    new BearerAccessToken({
      id: `tok_${randomUUID()}`,
      userId: user.id,
      tokenHash: tokenGenerator.hash(accessToken),
      expiresAt,
      createdAt: now,
      revokedAt: null,
    }),
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, email: user.email },
  };
}

function parseEmail(email: string): string {
  try {
    return normalizeEmail(email);
  } catch {
    throw new ApiError('validation_error', 'Email must be valid');
  }
}

function parsePassword(password: string): void {
  try {
    validatePassword(password);
  } catch {
    throw new ApiError('validation_error', 'Password must be at least 8 characters');
  }
}
