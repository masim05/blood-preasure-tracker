import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(__dirname, '..');
const migrationsDirectory = path.join(rootDirectory, 'src/infrastructure/database/migrations');
const postgresImage = process.env.DB_INIT_POSTGRES_IMAGE ?? 'postgres:17-alpine';
let envFilePath;
let databaseUrl;
let database;
let containerName;
let dataDirectory;
let legacyContainerName;
let legacyDataDirectory;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDbCommand('init', process.argv.slice(2)).catch((error) => {
    console.error(formatError(error));
    process.exitCode = 1;
  });
}

export async function runDbCommand(command, args) {
  loadRuntimeConfig(args);
  if (command === 'init') {
    await initDatabase();
    return;
  }
  if (command === 'clean') {
    cleanDatabase();
    return;
  }

  throw new Error(`Unknown database command: ${command}`);
}

function loadRuntimeConfig(args) {
  envFilePath = path.resolve(rootDirectory, parseEnvFileArgument(args));
  const env = readEnvFile(envFilePath);
  databaseUrl = readRequired(env, 'DATABASE_URL', envFilePath);
  database = parseDatabaseUrl(databaseUrl);
  const fullIdentity = createHash('sha256').update(databaseUrl).update('\0').update(rootDirectory).digest('hex');
  const identity = fullIdentity.slice(0, 4);
  containerName = `bpt-db-${identity}`;
  dataDirectory = path.join(rootDirectory, 'data', containerName);
  legacyContainerName = `bpt-db-${fullIdentity.slice(0, 16)}`;
  legacyDataDirectory = path.join(rootDirectory, 'data', legacyContainerName);
}

async function initDatabase() {
  ensureDockerAvailable();
  ensureLocalDatabaseHost(database.hostname);
  ensureContainer();
  await waitForPostgres(buildConnectionString('postgres'));
  await ensureDatabaseExists();
  await waitForPostgres(databaseUrl);
  await runMigrations(databaseUrl);

  console.log(`PostgreSQL container is ready: ${containerName}`);
  console.log(`PostgreSQL data directory: ${path.relative(rootDirectory, dataDirectory)}`);
  console.log(`Database initialized from ${path.relative(rootDirectory, envFilePath)}`);
}

function cleanDatabase() {
  ensureDockerAvailable();
  for (const name of new Set([containerName, legacyContainerName])) {
    removeContainer(name);
  }
  for (const directory of new Set([dataDirectory, legacyDataDirectory])) {
    rmSync(directory, { recursive: true, force: true });
    console.log(`Removed PostgreSQL data directory: ${path.relative(rootDirectory, directory)}`);
  }
}

function removeContainer(name) {
  const existing = spawnSync('docker', ['container', 'inspect', name], { encoding: 'utf8' });
  if (existing.status === 0) {
    runDocker(['rm', '--force', name], `Failed to remove container ${name}`);
    console.log(`Removed PostgreSQL container: ${name}`);
    return;
  }

  console.log(`PostgreSQL container was not present: ${name}`);
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

function parseDatabaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use postgres:// or postgresql://');
  }
  if (!url.username) {
    throw new Error('DATABASE_URL must include a username');
  }
  if (!url.password) {
    throw new Error('DATABASE_URL must include a password');
  }

  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return {
    hostname: url.hostname,
    port: url.port || '5432',
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(databaseName),
  };
}

function ensureDockerAvailable() {
  runDocker(['version', '--format', '{{.Server.Version}}'], 'Docker is required to initialize the database');
}

function ensureLocalDatabaseHost(hostname) {
  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error(`db:init can create local Docker databases only; DATABASE_URL host is ${hostname}`);
  }
}

function ensureContainer() {
  const existing = spawnSync('docker', ['container', 'inspect', containerName], { encoding: 'utf8' });
  if (existing.status === 0) {
    runDocker(['start', containerName], `Failed to start existing container ${containerName}`);
    return;
  }

  mkdirSync(dataDirectory, { recursive: true });

  runDocker(
    [
      'run',
      '--detach',
      '--name',
      containerName,
      '--publish',
      `${database.port}:5432`,
      '--env',
      `POSTGRES_USER=${database.username}`,
      '--env',
      `POSTGRES_PASSWORD=${database.password}`,
      '--env',
      `POSTGRES_DB=${database.database}`,
      '--volume',
      `${dataDirectory}:/var/lib/postgresql/data`,
      postgresImage,
    ],
    `Failed to create PostgreSQL container ${containerName}`,
  );
}

function runDocker(args, errorMessage) {
  const result = spawnSync('docker', args, { stdio: 'pipe', encoding: 'utf8' });
  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    throw new Error(stderr ? `${errorMessage}: ${stderr}` : errorMessage);
  }

  return result.stdout.trim();
}

async function waitForPostgres(connectionString) {
  const timeoutAt = Date.now() + 30_000;
  let lastError = null;

  while (Date.now() < timeoutAt) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(
    `Timed out waiting for PostgreSQL at ${database.hostname}:${database.port}: ${formatError(lastError)}`,
  );
}

async function ensureDatabaseExists() {
  if (database.database === 'postgres') {
    return;
  }

  const client = new Client({ connectionString: buildConnectionString('postgres') });
  await client.connect();
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database.database]);
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(database.database)}`);
      console.log(`Created database: ${database.database}`);
    }
  } finally {
    await client.end();
  }
}

async function runMigrations(connectionString) {
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error(`No SQL migrations found in ${migrationsDirectory}`);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    for (const fileName of migrationFiles) {
      const sql = readFileSync(path.join(migrationsDirectory, fileName), 'utf8');
      await client.query(sql);
      console.log(`Applied migration: ${fileName}`);
    }
  } finally {
    await client.end();
  }
}

function buildConnectionString(databaseName) {
  const url = new URL(databaseUrl);
  url.pathname = `/${encodeURIComponent(databaseName)}`;

  return url.toString();
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}