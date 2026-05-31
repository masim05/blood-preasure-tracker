import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import type { GuideRule, GuideSyncSnapshot } from './guide-rules';

export interface GitMetadata {
  branchName: string | null;
  isDetachedHead: boolean;
  repoRoot: string | null;
  cwd: string;
}

export interface ValidationProfile {
  name: string;
  commands: string[];
  required: boolean;
  scope: 'repository';
  owner: string;
}

export interface ComplianceCheckResult {
  id: string;
  ruleIds: string[];
  kind: 'git-metadata' | 'command-contract' | 'doc-sync';
  status: 'pass' | 'fail';
  evidence: string[];
  message: string;
}

const SPECKIT_BRANCH_REGEX = /^(?:\d{3,4}-[a-z0-9][a-z0-9-]*|\d{8}-\d{6}-[a-z0-9][a-z0-9-]*)$/;
const CANONICAL_COMMANDS = ['build', 'lint', 'test:coverage'];

function safeExec(command: string): string | null {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function readGitMetadata(cwd: string = process.cwd()): GitMetadata {
  const repoRoot = safeExec('git rev-parse --show-toplevel');
  const symbolicHead = safeExec('git symbolic-ref --quiet --short HEAD');
  const branchName = symbolicHead ?? safeExec('git branch --show-current');

  return {
    branchName: branchName && branchName.length > 0 ? branchName : null,
    isDetachedHead: !symbolicHead,
    repoRoot,
    cwd,
  };
}

export function isSpeckitBranchName(branchName: string): boolean {
  return SPECKIT_BRANCH_REGEX.test(branchName);
}

export function evaluateWorktreeGuard(metadata: GitMetadata): ComplianceCheckResult {
  const inTmpWorktree = metadata.cwd.includes('/tmp/');

  if (inTmpWorktree) {
    return {
      id: 'check.guide.worktree.required',
      ruleIds: ['guide.worktree.required'],
      kind: 'git-metadata',
      status: 'pass',
      evidence: [`cwd=${metadata.cwd}`],
      message: 'Worktree policy satisfied.',
    };
  }

  return {
    id: 'check.guide.worktree.required',
    ruleIds: ['guide.worktree.required'],
    kind: 'git-metadata',
    status: 'fail',
    evidence: [`cwd=${metadata.cwd}`],
    message: formatRemediationMessage('worktree', metadata.cwd),
  };
}

export function evaluateBranchNamingGuard(metadata: GitMetadata): ComplianceCheckResult {
  if (metadata.isDetachedHead || !metadata.branchName) {
    return {
      id: 'check.guide.branch.naming.speckit',
      ruleIds: ['guide.branch.naming.speckit'],
      kind: 'git-metadata',
      status: 'fail',
      evidence: ['detached-head=true'],
      message: formatRemediationMessage('detached-head'),
    };
  }

  if (isSpeckitBranchName(metadata.branchName)) {
    return {
      id: 'check.guide.branch.naming.speckit',
      ruleIds: ['guide.branch.naming.speckit'],
      kind: 'git-metadata',
      status: 'pass',
      evidence: [`branch=${metadata.branchName}`],
      message: 'Branch naming policy satisfied.',
    };
  }

  return {
    id: 'check.guide.branch.naming.speckit',
    ruleIds: ['guide.branch.naming.speckit'],
    kind: 'git-metadata',
    status: 'fail',
    evidence: [`branch=${metadata.branchName}`],
    message: formatRemediationMessage('branch', metadata.branchName),
  };
}

export function readValidationProfileFromPackage(packageJsonPath: string = 'package.json'): ValidationProfile {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };

  const scripts = packageJson.scripts ?? {};
  const missingCommands = CANONICAL_COMMANDS.filter((scriptName) => !scripts[scriptName]);
  if (missingCommands.length > 0) {
    throw new Error(`Missing required scripts: ${missingCommands.join(', ')}`);
  }

  return {
    name: 'pre-pr-default',
    commands: CANONICAL_COMMANDS.map((scriptName) => `npm run ${scriptName}`),
    required: true,
    scope: 'repository',
    owner: 'README.md + CONTRIBUTING.md + contracts/guide-compliance-contract.md',
  };
}

export function formatRemediationMessage(kind: 'worktree' | 'branch' | 'detached-head', observed?: string): string {
  if (kind === 'worktree') {
    return `Guide policy violation: expected a dedicated worktree under tmp/, observed path '${observed ?? 'unknown'}'.`;
  }

  if (kind === 'branch') {
    return `Guide policy violation: branch '${observed ?? 'unknown'}' does not match Speckit naming conventions.`;
  }

  return 'Guide policy violation: detached HEAD detected; switch to a named feature branch in a tmp/ worktree.';
}

export function detectGuideSyncDrift(rules: GuideRule[], checks: ComplianceCheckResult[]): GuideSyncSnapshot {
  const ruleIds = rules.map((rule) => rule.id);
  const checkRuleIds = checks.flatMap((check) => check.ruleIds.map((ruleId) => `${check.id}:${ruleId}`));

  const unmappedRules = ruleIds.filter(
    (ruleId) => !checkRuleIds.some((checkRuleId) => checkRuleId.endsWith(`:${ruleId}`)),
  );
  const staleChecks = checkRuleIds.filter((checkRuleId) => !ruleIds.some((ruleId) => checkRuleId.endsWith(`:${ruleId}`)));

  return {
    generatedAt: new Date().toISOString(),
    ruleCount: ruleIds.length,
    checkCount: checks.length,
    unmappedRules,
    staleChecks,
  };
}

export const guideComplianceScaffold = {
  canonicalProfileName: 'pre-pr-default',
};