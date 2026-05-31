import { generateGuideSyncSnapshot, parseGuideRules } from './guide-rules';

describe('guide-rules helpers', () => {
  it('parses expected policy rules from guide content', () => {
    const readme = `
      Canonical checks:
      npm run build
      npm run lint
      npm run test:coverage
    `;

    const contributing = `
      dedicated Git worktree
      tmp/
      001-<feature-name>
      1234-<feature-name>
      YYYYMMDD-HHMMSS-<feature-name>
    `;

    const rules = parseGuideRules(readme, contributing);
    const ruleIds = rules.map((rule) => rule.id);

    expect(ruleIds).toContain('guide.worktree.required');
    expect(ruleIds).toContain('guide.branch.naming.speckit');
    expect(ruleIds).toContain('guide.validation.profile.pre-pr');
  });

  it('creates sync snapshots with unmapped and stale detection', () => {
    const snapshot = generateGuideSyncSnapshot(
      ['guide.worktree.required', 'guide.branch.naming.speckit'],
      ['check.guide.worktree.required:guide.worktree.required', 'check.legacy:guide.old.rule'],
    );

    expect(snapshot.ruleCount).toBe(2);
    expect(snapshot.checkCount).toBe(2);
    expect(snapshot.unmappedRules).toEqual(['guide.branch.naming.speckit']);
    expect(snapshot.staleChecks).toEqual(['check.legacy:guide.old.rule']);
    expect(typeof snapshot.generatedAt).toBe('string');
  });
});