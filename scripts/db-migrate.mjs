import { runDbCommand } from './db-init.mjs';

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function run() {
  if (process.argv.length > 2) {
    throw new Error('db:migrate does not accept arguments and always uses DATABASE_URL from .env');
  }

  await runDbCommand('migrate', []);
}
