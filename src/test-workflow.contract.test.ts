import { existsSync, readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
const scripts = packageJson.scripts ?? {};
const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const unitContractSelection = '--testPathIgnorePatterns=tests/integration';
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
});
