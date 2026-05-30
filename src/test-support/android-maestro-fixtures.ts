import { pbkdf2Sync } from 'node:crypto';

import { Client } from 'pg';

export const MAESTRO_FIXTURE_USER_US3_ID = 'usr_maestro_us3';
export const MAESTRO_FIXTURE_USER_US4_ID = 'usr_maestro_us4';
export const MAESTRO_FIXTURE_USER_US5_ID = 'usr_maestro_us5';
export const MAESTRO_FIXTURE_USER_US3_EMAIL = 'us3@example.com';
export const MAESTRO_FIXTURE_USER_US4_EMAIL = 'us4@example.com';
export const MAESTRO_FIXTURE_USER_US5_EMAIL = 'us5@example.com';
export const MAESTRO_FIXTURE_MEASUREMENT_ID = 'msr_maestro_us5';
const MAESTRO_PASSWORD = 'password123';
const MAESTRO_SALT = 'maestro-salt';

function maestroPasswordHash(password: string): string {
  return `pbkdf2:sha256:600000:${MAESTRO_SALT}:${pbkdf2Sync(password, MAESTRO_SALT, 600000, 32, 'sha256').toString('base64url')}`;
}

export async function seedAndroidMaestroFixtures(databaseUrl = process.env.DATABASE_URL): Promise<void> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Android CI bootstrap');
  }

  const now = new Date().toISOString();
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await upsertUser(client, MAESTRO_FIXTURE_USER_US3_ID, MAESTRO_FIXTURE_USER_US3_EMAIL, now);
    await upsertUser(client, MAESTRO_FIXTURE_USER_US4_ID, MAESTRO_FIXTURE_USER_US4_EMAIL, now);
    await upsertUser(client, MAESTRO_FIXTURE_USER_US5_ID, MAESTRO_FIXTURE_USER_US5_EMAIL, now);
    await upsertSavedMeasurement(client, now);
  } finally {
    await client.end();
  }
}

async function upsertUser(client: Client, id: string, email: string, now: string): Promise<void> {
  await client.query(
    `INSERT INTO user_accounts (id, email, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = EXCLUDED.updated_at`,
    [id, email, maestroPasswordHash(MAESTRO_PASSWORD), now],
  );
}

async function upsertSavedMeasurement(client: Client, now: string): Promise<void> {
  await client.query(
    `INSERT INTO measurements (id, user_id, status, systolic, diastolic, pulse, arm_side, measurement_time, saved_at, created_at, updated_at)
     VALUES ($1, $2, 'saved', 120, 80, 68, 'left', '2026-05-27T12:00:00.000Z', '2026-05-27T12:05:00.000Z', $3, $3)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, systolic = EXCLUDED.systolic, diastolic = EXCLUDED.diastolic, pulse = EXCLUDED.pulse, arm_side = EXCLUDED.arm_side, measurement_time = EXCLUDED.measurement_time, saved_at = EXCLUDED.saved_at, updated_at = EXCLUDED.updated_at`,
    [MAESTRO_FIXTURE_MEASUREMENT_ID, MAESTRO_FIXTURE_USER_US5_ID, now],
  );
}
