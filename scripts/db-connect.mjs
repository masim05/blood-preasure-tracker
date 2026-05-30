import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(__dirname, '..');

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function run() {
  const envFilePath = path.resolve(rootDirectory, parseEnvFileArgument(process.argv.slice(2)));
  const env = readEnvFile(envFilePath);
  const databaseUrl = readRequired(env, 'DATABASE_URL', envFilePath);

  await connectWithPsql(databaseUrl, envFilePath);
}

function parseEnvFileArgument(args) {
  let envFile = '.env';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-e' || arg === '--env') {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a file path`);
      }
      envFile = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--env=')) {
      envFile = arg.slice('--env='.length);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return envFile;
}

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Env file not found: ${filePath}`);
  }

  const values = {};
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = unquoteEnvValue(value);
  }

  return values;
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readRequired(env, key, envPath) {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is required in ${envPath}`);
  }

  return value;
}

function connectWithPsql(databaseUrl, envFilePath) {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', [databaseUrl], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PGPASSWORD: undefined,
      },
    });

    child.on('error', (error) => {
      if (error && error.code === 'ENOENT') {
        reject(
          new Error(
            `psql is not installed or not in PATH. Install PostgreSQL client tools and retry. (env: ${path.relative(rootDirectory, envFilePath)})`,
          ),
        );
        return;
      }

      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`psql terminated by signal: ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`psql exited with code ${code}`));
        return;
      }

      resolve();
    });
  });
}
