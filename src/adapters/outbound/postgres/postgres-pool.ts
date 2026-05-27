/* istanbul ignore file */
import { Injectable } from '@nestjs/common';
import { Pool, type QueryResultRow } from 'pg';

import { ApiConfigService } from '../../../infrastructure/config/api-config';

@Injectable()
export class PostgresPool {
  private readonly pool: Pool;

  constructor(apiConfig: ApiConfigService) {
    this.pool = new Pool({ connectionString: apiConfig.load().databaseUrl });
  }

  query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<{ rows: T[] }> {
    return this.pool.query<T>(text, values);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
