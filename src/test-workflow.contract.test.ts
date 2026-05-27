import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
const scripts = packageJson.scripts ?? {};
const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

describe('test workflow contract', () => {
  it('defines unit and contract scripts without integration test selection', () => {
    expect(scripts.test).toBe('jest --runInBand --testPathIgnorePatterns=tests/integration');
    expect(scripts['test:coverage']).toBe('jest --runInBand --coverage --testPathIgnorePatterns=tests/integration');
    expect(scripts.test).not.toContain('--testPathPatterns=tests/integration');
    expect(scripts['test:coverage']).not.toContain('--testPathPatterns=tests/integration');
  });

  it('defines an integration-only script', () => {
    expect(scripts['test:integration']).toBe('jest --runInBand --testPathPatterns=tests/integration/.*\\.test\\.ts$');
    expect(scripts['test:integration']).not.toContain('--coverage');
    expect(scripts['test:integration']).not.toContain('src/');
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

  it('does not run a separate npm test step in CI', () => {
    expect(workflow).not.toContain('run: npm test');
  });

  it('keeps validation jobs eligible for parallel execution', () => {
    expect(workflow).not.toMatch(/^\s+needs:/m);
  });
});
