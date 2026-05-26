# Feature Specification: Eval Accuracy Summary

**Feature Branch**: `005-eval-accuracy-summary`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "now eval works by emitting per-image comparison JSONL records; provide absolute number and ratio of correctly predicted params hand, systolic, diastolic, pulse, plus counts for 2, 3, and 4 params correct, with vertically aligned output."

## Clarifications

### Session 2026-05-26

- Q: How should the new accuracy summary be emitted relative to the existing JSONL eval output? → A: Emit aligned human-readable text lines after existing JSONL records.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Per-Field Accuracy Totals (Priority: P1)

After running eval, a user can immediately see how often each target prediction parameter was correct across all compared records, without manually scanning JSONL comparison rows.

**Why this priority**: This is the core requested value. Users need a compact accuracy summary for `hand`, `systolic`, `diastolic`, and `pulse` after eval finishes.

**Independent Test**: Run eval against a controlled dataset with known comparison outcomes and verify the summary reports the correct numerator, denominator, and percentage for each target parameter.

**Acceptance Scenarios**:

1. **Given** eval processes 31 comparable records, **When** 27 predicted `hand` values match reference values, **Then** the output includes a vertically aligned `hand` summary showing `27/31` and `87.1%`.
2. **Given** eval processes records where all `systolic` values match, **When** eval completes, **Then** the `systolic` summary shows all comparable records as correct and a 100.0% ratio.
3. **Given** eval emits existing per-image comparison records, **When** the new summary is added, **Then** those per-image comparison records remain available and unchanged before the aligned human-readable summary lines.

---

### User Story 2 - See Multi-Parameter Correctness Totals (Priority: P2)

After running eval, a user can see how many readings had at least 2, at least 3, and all 4 target parameters correct, making it easier to judge full-reading quality beyond individual fields.

**Why this priority**: A reading with several correct parameters is more useful than isolated field accuracy. This summary helps users understand practical prediction quality at a glance.

**Independent Test**: Run eval against a fixture with known per-record counts of correct target parameters and verify the `2 params correct`, `3 params correct`, and `4 params correct` rows.

**Acceptance Scenarios**:

1. **Given** 25 of 31 comparable records have at least two correct target parameters, **When** eval completes, **Then** the output includes `2 params correct: 25/31 (80.6%)` with vertical alignment matching the other rows.
2. **Given** 22 of 31 comparable records have all four target parameters correct, **When** eval completes, **Then** the output includes `4 params correct: 22/31 (71.0%)`.

---

### User Story 3 - Read A Polished Aligned Summary (Priority: P3)

After running eval in a terminal, a user can visually scan the summary because labels, counts, and percentages line up consistently across rows.

**Why this priority**: Alignment does not change the metric values, but it makes repeated evaluation runs easier to compare.

**Independent Test**: Run eval with labels of different lengths and verify the summary rows align the count column and percentage column consistently.

**Acceptance Scenarios**:

1. **Given** summary labels with different lengths, **When** eval prints the summary, **Then** count fractions begin at the same column and percentages begin at the same column.
2. **Given** denominators and numerators have different digit counts, **When** eval prints the summary, **Then** the output remains aligned and readable.

### Edge Cases

- When no comparable prediction/reference records are available, summary rows show `0/0` and `0.0%` rather than failing or dividing by zero.
- Records with missing predictions or missing references are excluded from denominators for these accuracy rows unless an existing comparison result marks the field as comparable.
- Field results marked `missing` are not counted as correct.
- The multi-parameter rows count records with at least the requested number of correct parameters, not exactly that number.
- Percentages are rounded to one decimal place.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Existing output writer port may be reused for a new eval summary record or formatted output; no new external service port is expected.
- **Adapters Affected**: CLI output formatting may be extended to render aligned human-readable summary lines after existing JSONL records.
- **Boundary Guarantee**: Accuracy aggregation rules belong in domain/application logic that consumes comparison outcomes; terminal formatting remains in CLI-facing code.
- **Node.js Version Baseline**: Latest active LTS, Node.js 24.x as of 2026-05-26.
- **NestJS Version Baseline**: Latest active LTS major, NestJS 11.
- **Dependency Selection Rationale**: Use existing project code and official Node.js formatting/string capabilities; no new dependency is required.
- **Existing Test Impact**: Existing eval tests may need additive assertions for the new summary output while preserving current comparison and summary records.
- **New Test Coverage**: Add unit tests for accuracy aggregation, formatting/alignment, no-comparable-record behavior, and integration or contract tests proving eval emits the summary after comparison output.
- **Coverage Plan**: Preserve CI coverage at `>= 95%`; target full branch coverage for the new aggregation and formatting paths.
- **Worktree Path**: `tmp/005-eval-accuracy-summary`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Eval output MUST include aligned human-readable accuracy summary lines for `hand`, `systolic`, `diastolic`, and `pulse` after existing JSONL comparison records.
- **FR-002**: Each per-field summary row MUST show the field label, correct count, total comparable count, and percentage correct.
- **FR-003**: Eval output MUST include multi-parameter summary rows for at least 2, at least 3, and all 4 of the target parameters correct.
- **FR-004**: Multi-parameter summary rows MUST use the same denominator as the set of comparable reading records used for the target parameter comparison summary.
- **FR-005**: Percentages MUST be displayed with one decimal place.
- **FR-006**: Summary rows MUST be vertically aligned so labels, fractions, and percentages are easy to scan in terminal output.
- **FR-007**: Existing per-image comparison records MUST remain available and unchanged in content before the human-readable summary lines are emitted.
- **FR-008**: Existing eval aggregate summary information MUST remain available; the new accuracy summary is additive.
- **FR-009**: Missing or non-comparable field outcomes MUST NOT be counted as correct.
- **FR-010**: Eval MUST handle zero comparable records without crashing and display `0/0` with `0.0%`.
- **FR-011**: The summary MUST be based on comparison outcomes already produced by eval, not by re-running predictions or reparsing provider output.
- **FR-012**: Implementation MUST preserve hexagonal boundaries: domain depends on ports only, adapters depend on domain interfaces.
- **FR-013**: Each new feature MUST add new tests; existing tests MUST remain unchanged unless the specification documents why a change is required.
- **FR-014**: Development workflow MUST remain MCP-free and execute in a dedicated feature worktree under `tmp/`.
- **FR-015**: Runtime stack MUST target the latest active Node.js LTS and latest active NestJS LTS.
- **FR-016**: Dependency decisions MUST prefer official Node.js/NestJS modules; third-party additions require explicit justification.

### Key Entities *(include if feature involves data)*

- **AccuracySummary**: Represents eval-wide correctness metrics for target fields and multi-parameter thresholds.
- **FieldAccuracyMetric**: Represents one parameter's label, correct count, comparable total, and percentage.
- **ParameterThresholdMetric**: Represents readings where at least N target parameters are correct, including correct count, comparable total, and percentage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given a fixture with known outcomes, eval reports exact per-field counts and percentages for all four target parameters with 100% test agreement.
- **SC-002**: Given a fixture with known outcomes, eval reports exact `2 params correct`, `3 params correct`, and `4 params correct` counts and percentages with 100% test agreement.
- **SC-003**: Summary rows appear after eval processing completes and add no more than 10 terminal lines for the requested metrics.
- **SC-004**: The count and percentage columns align consistently across all summary rows in terminal output.
- **SC-005**: Existing comparison output remains backward compatible, with no removed comparison fields or changed comparison field names.

## Assumptions

- The target parameters for this summary are exactly `hand`, `systolic`, `diastolic`, and `pulse`; `time` is intentionally excluded.
- Multi-parameter rows mean at least N correct target parameters, matching the user's example and usefulness for quality thresholds.
- Percentages use the same denominator shown in the fraction and are rounded to one decimal place.
- The summary is printed as aligned human-readable text in the existing eval command output stream after current JSONL comparison output.
