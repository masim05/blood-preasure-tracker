/* istanbul ignore file */
import { Injectable } from '@nestjs/common';

import type { UserAccountStorePort } from '../../../application/ports/user-account-store.port';
import { UserAccount } from '../../../domain/entities/user-account';
import { PostgresPool } from './postgres-pool';

type UserAccountRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class PostgresUserAccountRepository implements UserAccountStorePort {
  constructor(private readonly pool: PostgresPool) {}

  async findByEmail(email: string): Promise<UserAccount | null> {
    const result = await this.pool.query<UserAccountRow>(
      'SELECT * FROM user_accounts WHERE email = $1 LIMIT 1',
      [email],
    );

    return result.rows[0] ? toUserAccount(result.rows[0]) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const result = await this.pool.query<UserAccountRow>(
      'SELECT * FROM user_accounts WHERE id = $1 LIMIT 1',
      [id],
    );

    return result.rows[0] ? toUserAccount(result.rows[0]) : null;
  }

  async save(user: UserAccount): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_accounts (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, updated_at = EXCLUDED.updated_at`,
      [user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt],
    );
  }
}

function toUserAccount(row: UserAccountRow): UserAccount {
  return new UserAccount({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
