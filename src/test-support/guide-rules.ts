export type GuideSourceFile = 'README.md' | 'CONTRIBUTING.md';
export type GuideSeverity = 'error' | 'warning';

export interface GuideRule {
  id: string;
  sourceFile: GuideSourceFile;
  sourceSection: string;
  statement: string;
  severity: GuideSeverity;
  remediation: string;
}

export interface GuideSyncSnapshot {
  generatedAt: string;
  ruleCount: number;
  checkCount: number;
  unmappedRules: string[];
  staleChecks: string[];
}

const BRANCH_RULE_PATTERNS = [
  '001-<feature-name>',
  '1234-<feature-name>',
  'YYYYMMDD-HHMMSS-<feature-name>',
] as const;

const CANONICAL_VALIDATION_COMMANDS = ['npm run build', 'npm run lint', 'npm run test:coverage'] as const;

function hasAllBranchPatterns(content: string): boolean {
  return BRANCH_RULE_PATTERNS.every((pattern) => content.includes(pattern));
}

function hasCanonicalValidationSequence(content: string): boolean {
  let previousIndex = -1;
  for (const command of CANONICAL_VALIDATION_COMMANDS) {
    const commandIndex = content.indexOf(command);
    if (commandIndex === -1 || commandIndex < previousIndex) {
      return false;
    }
    previousIndex = commandIndex;
  }
  return true;
}

export function parseGuideRules(readmeContent: string, contributingContent: string): GuideRule[] {
  const rules: GuideRule[] = [];

  if (contributingContent.includes('dedicated Git worktree') && contributingContent.includes('tmp/')) {
    rules.push({
      id: 'guide.worktree.required',
      sourceFile: 'CONTRIBUTING.md',
      sourceSection: 'Branch And Worktree Policy',
      statement: 'Feature and bugfix work must run in a dedicated worktree under tmp/.',
      severity: 'error',
      remediation: 'Create a dedicated worktree under tmp/ and continue development from there.',
    });
  }

  if (hasAllBranchPatterns(contributingContent)) {
    rules.push({
      id: 'guide.branch.naming.speckit',
      sourceFile: 'CONTRIBUTING.md',
      sourceSection: 'Branch Naming',
      statement:
        'Branch names must match Speckit conventions: 001-<feature-name>, 1234-<feature-name>, or YYYYMMDD-HHMMSS-<feature-name>.',
      severity: 'error',
      remediation: 'Rename the branch to a valid Speckit format before opening a pull request.',
    });
  }

  if (hasCanonicalValidationSequence(readmeContent)) {
    rules.push({
      id: 'guide.validation.profile.pre-pr',
      sourceFile: 'README.md',
      sourceSection: 'Relevant CI Checks',
      statement: 'Contributors must run npm run build, npm run lint, and npm run test:coverage before PR.',
      severity: 'error',
      remediation: 'Run the canonical pre-PR sequence and resolve failures before pushing.',
    });
  }

  return rules;
}

export function generateGuideSyncSnapshot(ruleIds: string[], checkIds: string[]): GuideSyncSnapshot {
  const normalizedRuleIds = Array.from(new Set(ruleIds));
  const normalizedCheckIds = Array.from(new Set(checkIds));

  const unmappedRules = normalizedRuleIds.filter((ruleId) => !normalizedCheckIds.some((checkId) => checkId.includes(ruleId)));
  const staleChecks = normalizedCheckIds.filter((checkId) =>
    !normalizedRuleIds.some((ruleId) => checkId.includes(ruleId)),
  );

  return {
    generatedAt: new Date().toISOString(),
    ruleCount: normalizedRuleIds.length,
    checkCount: normalizedCheckIds.length,
    unmappedRules,
    staleChecks,
  };
}

export const guideRuleScaffold: GuideRule[] = [];