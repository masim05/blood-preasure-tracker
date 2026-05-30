import { Client } from 'pg';
import { readFileSync } from 'node:fs';

import {
  MAESTRO_FIXTURE_MEASUREMENT_ID,
  MAESTRO_FIXTURE_USER_US3_EMAIL,
  MAESTRO_FIXTURE_USER_US5_EMAIL,
  seedAndroidMaestroFixtures,
} from '../../src/test-support/android-maestro-fixtures';

function loadTestEnv(): void {
  const envFile = readFileSync('.env.test', 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator);
    if (process.env[key] === undefined) {
      process.env[key] = trimmed.slice(separator + 1);
    }
  }
}

describe('android ci bootstrap', () => {
  beforeAll(() => {
    loadTestEnv();
  });

  it('fails fast when DATABASE_URL is missing', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(seedAndroidMaestroFixtures()).rejects.toThrow('DATABASE_URL is required for Android CI bootstrap');

    if (original !== undefined) {
      process.env.DATABASE_URL = original;
    }
  });

  it('seeds required users and saved measurement idempotently', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for bootstrap fixture test');
    }

    await seedAndroidMaestroFixtures();
    await seedAndroidMaestroFixtures();

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    const users = await client.query<{ email: string }>('SELECT email FROM user_accounts WHERE email IN ($1, $2)', [
      MAESTRO_FIXTURE_USER_US3_EMAIL,
      MAESTRO_FIXTURE_USER_US5_EMAIL,
    ]);
    expect(users.rows).toHaveLength(2);

    const measurement = await client.query<{ id: string; status: string }>(
      'SELECT id, status FROM measurements WHERE id = $1',
      [MAESTRO_FIXTURE_MEASUREMENT_ID],
    );
    expect(measurement.rows).toEqual([{ id: MAESTRO_FIXTURE_MEASUREMENT_ID, status: 'saved' }]);

    await client.end();
  });
});
