import { existsSync, readFileSync } from 'node:fs';
import {
  evaluateBranchNamingGuard,
  evaluateWorktreeGuard,
  isSpeckitBranchName,
  readValidationProfileFromPackage,
} from './test-support/guide-compliance';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
  dependencies?: Record<string, string>;
};
const scripts = packageJson.scripts ?? {};
const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const unitContractSelection = '--testPathIgnorePatterns=tests/integration --testPathIgnorePatterns=tests/bootstrap';
const integrationSelection = '--testPathPatterns=tests/integration/.*\\.test\\.ts$';
const requiredTestEnvKeys = [
  'OPENAI_API_KEY',
  'CLI_PROVIDER',
  'CLI_MODEL',
  'DATABASE_URL',
  'API_PORT',
  'MEASUREMENT_IMAGE_DIR',
  'ACCESS_TOKEN_TTL_SECONDS',
  'NODE_ENV',
];

describe('test workflow contract', () => {
  it('enforces dedicated tmp worktree policy for feature implementation', () => {
    const passing = evaluateWorktreeGuard({
      branchName: '014-implement-repo-guides',
      isDetachedHead: false,
      repoRoot: '/repo',
      cwd: '/repo/tmp/014-implement-repo-guides',
    });
    const failing = evaluateWorktreeGuard({
      branchName: '014-implement-repo-guides',
      isDetachedHead: false,
      repoRoot: '/repo',
      cwd: '/repo',
    });

    expect(passing.status).toBe('pass');
    expect(failing.status).toBe('fail');
    expect(failing.message).toContain('tmp/');
  });

  it('enforces Speckit branch naming conventions', () => {
    expect(isSpeckitBranchName('001-feature-name')).toBe(true);
    expect(isSpeckitBranchName('1234-feature-name')).toBe(true);
    expect(isSpeckitBranchName('20260531-093000-feature-name')).toBe(true);
    expect(isSpeckitBranchName('feature-name')).toBe(false);
  });

  it('fails safe for detached HEAD branch policy checks', () => {
    const result = evaluateBranchNamingGuard({
      branchName: null,
      isDetachedHead: true,
      repoRoot: '/repo',
      cwd: '/repo/tmp/014-implement-repo-guides',
    });

    expect(result.status).toBe('fail');
    expect(result.message).toContain('detached HEAD');
  });

  it('exposes canonical pre-PR validation profile as build/lint/test:coverage', () => {
    const profile = readValidationProfileFromPackage('package.json');

    expect(profile.commands).toEqual(['npm run build', 'npm run lint', 'npm run test:coverage']);
    expect(profile.required).toBe(true);
  });

  it('defines unit and contract scripts without integration test selection', () => {
    expect(scripts.test).toBe(`jest --runInBand ${unitContractSelection}`);
    expect(scripts['test:coverage']).toBe(`jest --runInBand --coverage ${unitContractSelection}`);
    expect(scripts.test).not.toContain('--testPathPatterns=tests/integration');
    expect(scripts['test:coverage']).not.toContain('--testPathPatterns=tests/integration');
  });

  it('defines an integration-only script', () => {
    expect(scripts['test:integration']).toBe(`jest --runInBand ${integrationSelection}`);
    expect(scripts['test:integration']).not.toContain('--coverage');
    expect(scripts['test:integration']).not.toContain('src/');
  });

  it('tracks the integration test environment file with required keys', () => {
    expect(existsSync('.env.test')).toBe(true);
    const envFile = readFileSync('.env.test', 'utf8');

    for (const key of requiredTestEnvKeys) {
      expect(envFile).toMatch(new RegExp(`^${key}=.+`, 'm'));
    }
    expect(envFile).toMatch(/^CLI_MODEL=mock-model$/m);
  });

  it('defines independent CI jobs for each validation gate', () => {
    expect(workflow).toMatch(/^  build:\n/m);
    expect(workflow).toMatch(/^  unit-contract-coverage:\n/m);
    expect(workflow).toMatch(/^  integration-tests:\n/m);
    expect(workflow).toMatch(/^  lint:\n/m);
    expect(workflow).toContain('run: npm run build');
    expect(workflow).toContain('run: npm run test:coverage');
    expect(workflow).toContain('run: npm run test:integration');
    expect(workflow).toContain('run: npm run lint');
  });

  it('prepares the integration database before running integration tests in CI', () => {
    expect(workflow).toMatch(/^  integration-tests:\n(?:.|\n)*?^    services:\n(?:.|\n)*?^      postgres:\n/m);
    expect(workflow).toContain('image: postgres:17-alpine');
    expect(workflow).toContain('5433:5432');
    expect(workflow).toContain("DB_INIT_SKIP_DOCKER: '1'");
    expect(workflow.indexOf('run: npm run db:init -- --env .env.test')).toBeGreaterThan(-1);
    expect(workflow.indexOf('run: npm run test:integration')).toBeGreaterThan(
      workflow.indexOf('run: npm run db:init -- --env .env.test'),
    );
  });

  it('does not run a separate npm test step in CI', () => {
    expect(workflow).not.toContain('run: npm test');
  });

  it('keeps Node and Nest baselines aligned with guide policy', () => {
    const nodeVersion = packageJson.engines?.node ?? '';

    expect(nodeVersion).toContain('24');
    expect(packageJson.dependencies?.['@nestjs/common']).toMatch(/^\^11\./);
    expect(packageJson.dependencies?.['@nestjs/core']).toMatch(/^\^11\./);
  });

  it('runs Android bootstrap after db init and before Android Gradle tasks', () => {
    const dbInitIndex = workflow.indexOf('run: npm run db:init -- --env .env.test');
    const bootstrapIndex = workflow.indexOf('run: npx jest --runInBand --runTestsByPath tests/bootstrap/android-ci-bootstrap.test.ts');
    const gradleIndex = workflow.indexOf(
      'run: ./gradlew --no-daemon :app:testDebugUnitTest :app:androidCoverageVerify :app:assembleDebug',
    );

    expect(dbInitIndex).toBeGreaterThan(-1);
    expect(bootstrapIndex).toBeGreaterThan(dbInitIndex);
    expect(gradleIndex).toBeGreaterThan(bootstrapIndex);
  });

  it('does not keep inline seed payload markers in workflow YAML', () => {
    expect(workflow).not.toContain('name: Seed Maestro accounts');
    expect(workflow).not.toContain("usr_maestro_us3");
    expect(workflow).not.toContain("msr_maestro_us5");
    expect(workflow).not.toContain("maestro-salt");
  });

  it('does not invoke android bootstrap outside android-mobile job', () => {
    const bootstrapCommand = 'run: npx jest --runInBand --runTestsByPath tests/bootstrap/android-ci-bootstrap.test.ts';
    const androidJobStart = workflow.indexOf('  android-mobile:\n');

    expect(androidJobStart).toBeGreaterThan(-1);
    const firstIndex = workflow.indexOf(bootstrapCommand);
    expect(firstIndex).toBeGreaterThan(androidJobStart);

    const secondIndex = workflow.indexOf(bootstrapCommand, firstIndex + 1);
    expect(secondIndex).toBe(-1);

    const buildJobBlock = workflow.slice(workflow.indexOf('  build:\n'), workflow.indexOf('  unit-contract-coverage:\n'));
    const coverageJobBlock = workflow.slice(
      workflow.indexOf('  unit-contract-coverage:\n'),
      workflow.indexOf('  integration-tests:\n'),
    );
    const integrationJobBlock = workflow.slice(workflow.indexOf('  integration-tests:\n'), workflow.indexOf('  lint:\n'));
    const lintJobBlock = workflow.slice(workflow.indexOf('  lint:\n'), workflow.indexOf('  android-mobile:\n'));

    expect(buildJobBlock).not.toContain(bootstrapCommand);
    expect(coverageJobBlock).not.toContain(bootstrapCommand);
    expect(integrationJobBlock).not.toContain(bootstrapCommand);
    expect(lintJobBlock).not.toContain(bootstrapCommand);
  });
});
