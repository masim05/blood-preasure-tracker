#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const androidRoot = path.join(repoRoot, 'mobile', 'android');
const appGradleFile = path.join(androidRoot, 'app', 'build.gradle.kts');
const releaseKeyNoteFile = path.join(androidRoot, 'app', 'release', 'blood-pressure-tracker-release-key.txt');
const releaseDir = path.join(androidRoot, 'app', 'release');
const unsignedApk = path.join(androidRoot, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const rawValue = trimmedLine.slice(equalsIndex + 1).trim();
    const normalizedValue = rawValue.startsWith('"') && rawValue.endsWith('"')
      ? rawValue.slice(1, -1)
      : rawValue.startsWith("'") && rawValue.endsWith("'")
        ? rawValue.slice(1, -1)
        : rawValue;

    if (process.env[key] === undefined) {
      process.env[key] = normalizedValue;
    }
  }
}

loadDotEnv(path.join(repoRoot, '.env'));

function readVersionFromGradle() {
  const contents = readFileSync(appGradleFile, 'utf8');
  const versionCodeMatch = contents.match(/versionCode\s*=\s*(\d+)/);
  const versionNameMatch = contents.match(/versionName\s*=\s*"([^"]+)"/);

  if (!versionCodeMatch || !versionNameMatch) {
    throw new Error(`Could not read versionCode/versionName from ${appGradleFile}`);
  }

  return {
    versionCode: versionCodeMatch[1],
    versionName: versionNameMatch[1],
  };
}

function readKeystorePasswords() {
  const passwords = {
    storePassword: process.env.KEYSTORE_STORE_PASSWORD ?? process.env.KEYSTORE_PASSWORD,
    keyPassword: process.env.KEYSTORE_KEY_PASSWORD ?? process.env.KEYSTORE_PASSWORD,
  };

  if (existsSync(releaseKeyNoteFile)) {
    const contents = readFileSync(releaseKeyNoteFile, 'utf8');
    const storePasswordMatch = contents.match(/^Store password:\s*(.+)$/m);
    const keyPasswordMatch = contents.match(/^Key password:\s*(.+)$/m);

    if (storePasswordMatch) {
      passwords.storePassword = storePasswordMatch[1].trim();
    }

    if (keyPasswordMatch) {
      passwords.keyPassword = keyPasswordMatch[1].trim();
    }
  }

  return passwords;
}

function getAndroidSdkRoot() {
  if (process.env.ANDROID_SDK_ROOT) {
    return process.env.ANDROID_SDK_ROOT;
  }

  if (process.env.ANDROID_HOME) {
    return process.env.ANDROID_HOME;
  }

  const localPropertiesPath = path.join(androidRoot, 'local.properties');
  if (existsSync(localPropertiesPath)) {
    const localProperties = readFileSync(localPropertiesPath, 'utf8');
    const sdkDirMatch = localProperties.match(/^sdk\.dir=(.+)$/m);
    if (sdkDirMatch) {
      return sdkDirMatch[1].trim();
    }
  }

  return path.join(process.env.HOME ?? '', 'Library', 'Android', 'sdk');
}

function getLatestBuildToolsDir(androidSdkRoot) {
  const buildToolsRoot = path.join(androidSdkRoot, 'build-tools');
  const candidates = readdirSync(buildToolsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => compareVersions(left, right));

  if (candidates.length === 0) {
    throw new Error(`No build-tools directories found under ${buildToolsRoot}`);
  }

  return path.join(buildToolsRoot, candidates[candidates.length - 1]);
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: androidRoot,
    stdio: 'inherit',
    ...options,
  });
}

const { versionName, versionCode } = readVersionFromGradle();
const { storePassword, keyPassword } = readKeystorePasswords();
const androidSdkRoot = getAndroidSdkRoot();
const buildToolsDir = getLatestBuildToolsDir(androidSdkRoot);
const apksigner = path.join(buildToolsDir, 'apksigner');
const zipalign = path.join(buildToolsDir, 'zipalign');
const alignedApk = path.join(releaseDir, `blood-pressure-tracker-${versionName}-v${versionCode}-aligned.apk`);
const signedApk = path.join(releaseDir, `blood-pressure-tracker-${versionName}-v${versionCode}-release.apk`);
const keystore = path.join(process.env.HOME ?? '', '.android-key-store', 'blood-pressure-tracker-release.jks');

if (!existsSync(unsignedApk)) {
  throw new Error(`Release APK not found: ${unsignedApk}`);
}

if (!existsSync(keystore)) {
  throw new Error(`Signing keystore not found: ${keystore}`);
}

if (!storePassword || !keyPassword) {
  throw new Error('Keystore store and key passwords are required in .env or the Android release key note');
}

mkdirSync(releaseDir, { recursive: true });

run(zipalign, ['-f', '4', unsignedApk, alignedApk]);
run(apksigner, [
  'sign',
  '--ks',
  keystore,
  '--ks-pass',
  `pass:${storePassword}`,
  '--ks-key-alias',
  'blood-pressure-tracker',
  '--key-pass',
  `pass:${keyPassword}`,
  '--out',
  signedApk,
  alignedApk,
]);
run(apksigner, ['verify', '--verbose', '--print-certs', signedApk]);

console.log(signedApk);