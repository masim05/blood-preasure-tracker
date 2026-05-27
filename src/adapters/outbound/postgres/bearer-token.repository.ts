/* istanbul ignore file */
import { Injectable } from '@nestjs/common';

import type { BearerTokenStorePort } from '../../../application/ports/bearer-token-store.port';
import { BearerAccessToken } from '../../../domain/entities/bearer-access-token';
import { PostgresPool } from './postgres-pool';

type BearerTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
};

@Injectable()
export class PostgresBearerTokenRepository implements BearerTokenStorePort {
  constructor(private readonly pool: PostgresPool) {}

  async findByHash(tokenHash: string): Promise<BearerAccessToken | null> {
    const result = await this.pool.query<BearerTokenRow>(
      'SELECT * FROM bearer_tokens WHERE token_hash = $1 LIMIT 1',
      [tokenHash],
    );

    return result.rows[0] ? toBearerAccessToken(result.rows[0]) : null;
  }

  async save(token: BearerAccessToken): Promise<void> {
    await this.pool.query(
      `INSERT INTO bearer_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET revoked_at = EXCLUDED.revoked_at`,
      [token.id, token.userId, token.tokenHash, token.expiresAt, token.createdAt, token.revokedAt],
    );
  }
}

function toBearerAccessToken(row: BearerTokenRow): BearerAccessToken {
  return new BearerAccessToken({
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  });
}
