import { runDbCommand } from './db-init.mjs';

runDbCommand('clean', process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
