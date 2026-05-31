import { readFileSync } from 'node:fs';
import { detectGuideSyncDrift, evaluateBranchNamingGuard, evaluateWorktreeGuard, readValidationProfileFromPackage } from './test-support/guide-compliance';
import { parseGuideRules } from './test-support/guide-rules';

function indexOfSequence(content: string, values: string[]): number[] {
  return values.map((value) => content.indexOf(value));
}

describe('guide docs contract', () => {
  const readme = readFileSync('README.md', 'utf8');
  const contributing = readFileSync('CONTRIBUTING.md', 'utf8');
  const quickstart = readFileSync('specs/014-implement-repo-guides/quickstart.md', 'utf8');

  it('maps guide rules to contract checks without drift', () => {
    const rules = parseGuideRules(readme, contributing);
    const checks = [
      evaluateWorktreeGuard({
        branchName: '014-implement-repo-guides',
        isDetachedHead: false,
        repoRoot: '/repo',
        cwd: '/repo/tmp/014-implement-repo-guides',
      }),
      evaluateBranchNamingGuard({
        branchName: '014-implement-repo-guides',
        isDetachedHead: false,
        repoRoot: '/repo',
        cwd: '/repo/tmp/014-implement-repo-guides',
      }),
      {
        id: 'check.guide.validation.profile.pre-pr',
        ruleIds: ['guide.validation.profile.pre-pr'],
        kind: 'command-contract' as const,
        status: 'pass' as const,
        evidence: ['canonical-profile=pre-pr-default'],
        message: 'Validation profile mapped.',
      },
    ];

    const snapshot = detectGuideSyncDrift(rules, checks);
    expect(snapshot.unmappedRules).toEqual([]);
    expect(snapshot.staleChecks).toEqual([]);
  });

  it('detects stale or unmapped checks deterministically', () => {
    const rules = parseGuideRules(readme, contributing).slice(0, 1);
    const checks = [
      {
        id: 'check.legacy.rule',
        ruleIds: ['guide.legacy.rule'],
        kind: 'doc-sync' as const,
        status: 'fail' as const,
        evidence: ['legacy=true'],
        message: 'stale',
      },
    ];

    const snapshot = detectGuideSyncDrift(rules, checks);
    expect(snapshot.unmappedRules.length).toBe(1);
    expect(snapshot.staleChecks.length).toBe(1);
  });

  it('keeps docs aligned with canonical validation profile', () => {
    const profile = readValidationProfileFromPackage('package.json');
    expect(profile.commands).toEqual(['npm run build', 'npm run lint', 'npm run test:coverage']);

    const requiredCommands = profile.commands;
    const readmeIndices = indexOfSequence(readme, requiredCommands);
    const contributingIndices = indexOfSequence(contributing, requiredCommands);
    const quickstartIndices = indexOfSequence(quickstart, requiredCommands);

    expect(readmeIndices.every((index) => index >= 0)).toBe(true);
    expect(contributingIndices.every((index) => index >= 0)).toBe(true);
    expect(quickstartIndices.every((index) => index >= 0)).toBe(true);

    expect(readmeIndices[0]).toBeLessThan(readmeIndices[1]);
    expect(readmeIndices[1]).toBeLessThan(readmeIndices[2]);
    expect(contributingIndices[0]).toBeLessThan(contributingIndices[1]);
    expect(contributingIndices[1]).toBeLessThan(contributingIndices[2]);
    expect(quickstartIndices[0]).toBeLessThan(quickstartIndices[1]);
    expect(quickstartIndices[1]).toBeLessThan(quickstartIndices[2]);
  });

  it('keeps dependency policy aligned with existing repository stack', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const dependencies = Object.keys(packageJson.dependencies ?? {});
    const devDependencies = Object.keys(packageJson.devDependencies ?? {});
    const allDependencies = [...dependencies, ...devDependencies];

    const disallowedGuidePackages = ['markdownlint', 'remark', 'unified'];
    for (const packageName of disallowedGuidePackages) {
      expect(allDependencies).not.toContain(packageName);
    }

    expect(dependencies).toContain('@nestjs/common');
    expect(dependencies).toContain('@nestjs/core');
  });
});