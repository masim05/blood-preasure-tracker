import type { BearerAccessToken } from '../../domain/entities/bearer-access-token';

export const BEARER_TOKEN_STORE = Symbol('BEARER_TOKEN_STORE');

export interface BearerTokenStorePort {
  findByHash(tokenHash: string): Promise<BearerAccessToken | null>;
  save(token: BearerAccessToken): Promise<void>;
}

export interface BearerTokenGeneratorPort {
  generate(): string;
  hash(token: string): string;
}

export const BEARER_TOKEN_GENERATOR = Symbol('BEARER_TOKEN_GENERATOR');
