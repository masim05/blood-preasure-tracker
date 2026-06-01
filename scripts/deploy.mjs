#!/usr/bin/env node
/**
 * npm run deploy -- [branch-name] [-h host]
 *
 * Positional:  branch-name  (default: main)
 * Option:     -h <host>     (default: con01.crptmax.com)
 *
 * Steps executed on the server:
 *   1. Archive the local git branch and stream it to the server via ssh
 *   2. npm ci
 *   3. npm run db:migrate  (DATABASE_URL injected from systemd unit)
 *   4. systemctl restart bpt-api
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* ── load ROOT_PASSWORD from .env.prod ─────────────────────────────────── */
function loadEnvFile(filePath) {
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1).replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    env[key] = val;
  }
  return env;
}
const prodEnv = loadEnvFile(path.join(ROOT, '.env.prod'));
const ROOT_PASSWORD = prodEnv['ROOT_PASSWORD'];
if (!ROOT_PASSWORD) {
  console.error('ROOT_PASSWORD not found in .env.prod');
  process.exit(1);
}

/* ── parse args ────────────────────────────────────────────────────────── */
const rawArgs = process.argv.slice(2);
let branch = 'main';
let host = 'con01.crptmax.com';

for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '-h') {
    host = rawArgs[++i];
  } else if (!rawArgs[i].startsWith('-')) {
    branch = rawArgs[i];
  }
}

console.log(`Deploying branch "${branch}" to ${host}:/home/bpt/blood-preasure-tracker`);

/* ── helpers ────────────────────────────────────────────────────────────── */
function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', encoding: 'utf8', ...opts });
  if (result.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

/**
 * Run a shell script on the remote host as root via `sudo -S bash -s`,
 * piping ROOT_PASSWORD followed by the script body.
 */
function ssh(script) {
  // sudo -S reads the password from stdin; we prepend it on its own line.
  const input = ROOT_PASSWORD + '\n' + script;
  const result = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', host, 'sudo -S bash -s 2>/dev/null'],
    { input, stdio: ['pipe', 'inherit', 'inherit'], encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error('Remote script failed.');
    process.exit(result.status ?? 1);
  }
}

/**
 * Pipe a Buffer to a remote path that the SSH user can write to (e.g. /tmp).
 */
function pipeToRemote(buf, remotePath) {
  const result = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', host, `cat > '${remotePath}'`],
    { input: buf, stdio: ['pipe', 'inherit', 'inherit'] },
  );
  if (result.status !== 0) {
    console.error(`Failed to stream to ${host}:${remotePath}`);
    process.exit(result.status ?? 1);
  }
}

/* ── 1. archive branch and stream to server ─────────────────────────────── */
console.log('\n[1/4] Archiving branch and streaming to server…');
const archiveResult = spawnSync(
  'git',
  ['archive', '--format=tar', branch],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 200 * 1024 * 1024 },
);
if (archiveResult.status !== 0) {
  console.error(`git archive failed for branch "${branch}"`);
  process.exit(archiveResult.status ?? 1);
}
pipeToRemote(archiveResult.stdout, '/tmp/bpt-deploy.tar');

/* ── 2. unpack + npm ci + db:migrate + restart ──────────────────────────── */
console.log('\n[2/4] Unpacking and running npm ci on server…');
console.log('[3/4] Running db:migrate…');
console.log('[4/4] Restarting bpt-api…\n');

ssh(`set -euo pipefail
DEST="/home/bpt/blood-preasure-tracker"

# Unpack archive over existing directory, preserve node_modules and .env files
find "\$DEST" -mindepth 1 -maxdepth 1 \\
  ! -name 'node_modules' \\
  ! -name '.env' ! -name '.env.migrated.bak' \\
  -exec rm -rf {} +
tar -xf /tmp/bpt-deploy.tar -C "\$DEST"
chown -R bpt:bpt "\$DEST"
rm -f /tmp/bpt-deploy.tar

# npm ci
su - bpt -c "cd \$DEST && npm ci"

# Inject DATABASE_URL from systemd unit into .env for migration only
DB_URL=\$(systemctl show bpt-api -p Environment --no-pager \\
  | tr ' ' '\\n' \\
  | grep '^DATABASE_URL=' \\
  | head -n1 \\
  | cut -d= -f2-)
if [ -z "\$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not found in bpt-api systemd unit" >&2
  exit 1
fi
printf 'DATABASE_URL=%s\\n' "\$DB_URL" > "\$DEST/.env"
chown bpt:bpt "\$DEST/.env"

su - bpt -c "cd \$DEST && npm run db:migrate"
rm -f "\$DEST/.env"

# Restart systemd service
systemctl daemon-reload
systemctl restart bpt-api
systemctl is-active bpt-api
echo "Deploy complete."
`);

console.log('\nDone.');
