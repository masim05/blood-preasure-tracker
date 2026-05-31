import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  detectGuideSyncDrift,
  evaluateBranchNamingGuard,
  evaluateWorktreeGuard,
  formatRemediationMessage,
  isSpeckitBranchName,
  readValidationProfileFromPackage,
  type ComplianceCheckResult,
} from './guide-compliance';
import type { GuideRule } from './guide-rules';

describe('guide-compliance helpers', () => {
  it('validates Speckit branch naming patterns', () => {
    expect(isSpeckitBranchName('014-implement-repo-guides')).toBe(true);
    expect(isSpeckitBranchName('1234-auth-improvement')).toBe(true);
    expect(isSpeckitBranchName('20260531-093000-mobile-login')).toBe(true);
    expect(isSpeckitBranchName('feature/login')).toBe(false);
    expect(isSpeckitBranchName('main')).toBe(false);
  });

  it('evaluates worktree guard from cwd', () => {
    const passResult = evaluateWorktreeGuard({
      branchName: '014-implement-repo-guides',
      isDetachedHead: false,
      repoRoot: '/Users/max/src/github.com/masim05/blood-preasure-tracker',
      cwd: '/Users/max/src/github.com/masim05/blood-preasure-tracker/tmp/014-implement-repo-guides',
    });
    expect(passResult.status).toBe('pass');

    const failResult = evaluateWorktreeGuard({
      branchName: '014-implement-repo-guides',
      isDetachedHead: false,
      repoRoot: '/Users/max/src/github.com/masim05/blood-preasure-tracker',
      cwd: '/Users/max/src/github.com/masim05/blood-preasure-tracker',
    });
    expect(failResult.status).toBe('fail');
    expect(failResult.message).toContain('tmp/');
  });

  it('fails safe when branch policy cannot be evaluated in detached HEAD', () => {
    const result = evaluateBranchNamingGuard({
      branchName: null,
      isDetachedHead: true,
      repoRoot: '/Users/max/src/github.com/masim05/blood-preasure-tracker',
      cwd: '/Users/max/src/github.com/masim05/blood-preasure-tracker/tmp/014-implement-repo-guides',
    });

    expect(result.status).toBe('fail');
    expect(result.message).toContain('detached HEAD');
  });

  it('reads canonical validation profile from package scripts', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'bpt-guide-profile-'));
    const packageJsonPath = join(tempDir, 'package.json');
    writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          scripts: {
            build: 'tsc -p tsconfig.json',
            lint: 'eslint .',
            'test:coverage': 'jest --coverage',
          },
        },
        null,
        2,
      ),
    );

    const profile = readValidationProfileFromPackage(packageJsonPath);
    expect(profile.name).toBe('pre-pr-default');
    expect(profile.commands).toEqual(['npm run build', 'npm run lint', 'npm run test:coverage']);

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects unmapped rules and stale checks', () => {
    const rules: GuideRule[] = [
      {
        id: 'guide.worktree.required',
        sourceFile: 'CONTRIBUTING.md',
        sourceSection: 'Branch And Worktree Policy',
        statement: 'Dedicated worktree required.',
        severity: 'error',
        remediation: 'Use tmp worktree.',
      },
      {
        id: 'guide.branch.naming.speckit',
        sourceFile: 'CONTRIBUTING.md',
        sourceSection: 'Branch Naming',
        statement: 'Speckit naming required.',
        severity: 'error',
        remediation: 'Rename branch.',
      },
    ];

    const checks: ComplianceCheckResult[] = [
      {
        id: 'check.guide.worktree.required',
        ruleIds: ['guide.worktree.required'],
        kind: 'git-metadata',
        status: 'pass',
        evidence: ['ok'],
        message: 'ok',
      },
      {
        id: 'check.legacy.rule',
        ruleIds: ['guide.legacy.rule'],
        kind: 'doc-sync',
        status: 'fail',
        evidence: ['stale'],
        message: 'stale',
      },
    ];

    const snapshot = detectGuideSyncDrift(rules, checks);
    expect(snapshot.unmappedRules).toEqual(['guide.branch.naming.speckit']);
    expect(snapshot.staleChecks).toEqual(['check.legacy.rule:guide.legacy.rule']);
  });

  it('formats remediation messages', () => {
    expect(formatRemediationMessage('worktree', '/repo')).toContain('tmp/');
    expect(formatRemediationMessage('branch', 'main')).toContain('main');
    expect(formatRemediationMessage('detached-head')).toContain('detached HEAD');
  });

  it('keeps guide checks runtime under 30 seconds', () => {
    const startedAt = Date.now();

    for (let index = 0; index < 2500; index += 1) {
      evaluateWorktreeGuard({
        branchName: '014-implement-repo-guides',
        isDetachedHead: false,
        repoRoot: '/repo',
        cwd: '/repo/tmp/014-implement-repo-guides',
      });
      evaluateBranchNamingGuard({
        branchName: '014-implement-repo-guides',
        isDetachedHead: false,
        repoRoot: '/repo',
        cwd: '/repo/tmp/014-implement-repo-guides',
      });
    }

    const durationMs = Date.now() - startedAt;
    expect(durationMs).toBeLessThan(30000);
  });
});