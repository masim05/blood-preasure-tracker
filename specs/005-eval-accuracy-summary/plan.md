# Implementation Plan: Eval Accuracy Summary

**Branch**: `005-eval-accuracy-summary` | **Date**: 2026-05-26 | **Spec**: [specs/005-eval-accuracy-summary/spec.md](specs/005-eval-accuracy-summary/spec.md)

**Input**: Feature specification from `/specs/005-eval-accuracy-summary/spec.md`

## Summary

Extend `npm run cli -- eval` so it preserves the existing JSONL comparison records and final JSONL summary record, then appends aligned human-readable accuracy lines. The new domain behavior computes per-field accuracy for `hand`, `systolic`, `diastolic`, and `pulse`, plus threshold rows for at least 2, at least 3, and all 4 target parameters correct. The CLI output adapter gains a text-writing capability so formatted text can follow JSONL records without being JSON-escaped.

## Technical Context

**Language/Version**: TypeScript 5.8 on the latest active Node.js LTS, Node.js 24.x as of 2026-05-26

**Primary Dependencies**: NestJS 11 standalone application context, existing OpenAI SDK adapter for provider-backed vitals extraction, existing `exif-parser` adapter for metadata timestamps, Node.js stream APIs for stdout writing, Jest 30 for tests

**Storage**: Local filesystem input only; eval reads image files and CSV reference data, then writes records/text to stdout

**Testing**: Jest unit, contract, and integration tests; local validation through `npm run build`, `npm test`, `npm run test:coverage`, and `npm run lint`

**Target Platform**: Local Node.js CLI on macOS/Linux developer machines and GitHub Actions CI

**Project Type**: Single-project CLI application

**Performance Goals**: Accuracy aggregation is linear over eval comparison records and adds negligible overhead compared with image metadata extraction and provider inference

**Constraints**: Preserve existing JSONL comparison and summary records unchanged; append aligned human-readable text after JSONL output; keep `time` excluded from accuracy metrics; display percentages to one decimal place; show `0/0 (0.0%)` for zero comparable records; maintain CI coverage `>= 95%`

**Scale/Scope**: Single-operator local CLI workflow over tens to low hundreds of images per invocation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Accuracy aggregation stays in domain entities/services; eval orchestration stays in the use case; concrete stdout text writing remains in the CLI output adapter behind `OutputWriterPort`.
- [X] **Unit test strategy present**: Add tests for summary aggregation, threshold counting, zero-denominator behavior, text alignment, output writer raw text behavior, and eval use-case emission order.
- [X] **Coverage policy acknowledged**: CI gate remains `>= 95%`; changed summary and formatting branches target `100%` branch coverage where practical.
- [X] **Additive test evolution respected**: Existing tests change only by additive assertions for the intentional new post-summary text output.
- [X] **MCP-free implementation**: Plan uses local repository scripts, npm, Jest, TypeScript, and Node.js built-ins only.
- [X] **Feature isolation via worktree**: Implementation will use branch `005-eval-accuracy-summary` and worktree path `tmp/005-eval-accuracy-summary`.
- [X] **Tech stack baseline**: Plan targets the latest active Node.js LTS, Node.js 24.x as of 2026-05-26, and NestJS 11.
- [X] **Dependency policy**: No new third-party dependency is planned; Node.js string formatting and stream APIs are sufficient.

## Project Structure

### Documentation (this feature)

```text
specs/005-eval-accuracy-summary/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── cli.md           # Eval output contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── inbound/
│   │   └── cli/
│   │       ├── cli-parser.ts
│   │       ├── help-renderer.ts
│   │       └── jsonl-output.writer.ts       # extend with raw text output
│   └── outbound/
│       ├── filesystem/
│       └── llm/
├── application/
│   ├── ports/
│   │   └── output-writer.port.ts            # extend text-writing contract
│   └── use-cases/
│       └── evaluate-images.use-case.ts      # emit accuracy text after summary
├── domain/
│   ├── entities/
│   │   └── evaluation-report.ts             # expose accuracy summary data
│   └── services/
│       └── evaluation-accuracy-formatter.ts # planned aligned text formatter
├── infrastructure/
└── main.ts

tests/
├── contract/
├── integration/
│   └── cli.integration.test.ts
└── unit/
    ├── adapters/
    ├── application/
    └── domain/
```

**Structure Decision**: Keep the existing single-project CLI layout. Extend the existing eval report/domain flow to compute accuracy metrics from comparison results, extend the existing output writer port/adapter to support raw text, and update the eval use case to write comparison records, the JSONL summary record, then the aligned text block.

## Phase 0: Research Output

Research completed in [specs/005-eval-accuracy-summary/research.md](specs/005-eval-accuracy-summary/research.md). Key outcomes:

- Derive accuracy from `EvaluationComparison.fieldResults` so eval does not repeat matching logic or provider parsing.
- Treat comparable records as comparisons that have both prediction and ground truth rows; missing prediction-only or ground-truth-only rows are excluded from accuracy denominators.
- Count a target parameter as correct only when its field result is `match`; `mismatch` and `missing` are not correct.
- Add a raw text capability to the existing output writer rather than creating a second stdout writer that could interleave output.
- Use deterministic fixed-width string formatting; no new formatting dependency is needed.

## Phase 1: Design Output

### Planned Port and Adapter Changes

- Extend `src/application/ports/output-writer.port.ts` with a text-writing method for appending human-readable output without JSON encoding.
- Extend `src/adapters/inbound/cli/jsonl-output.writer.ts` to implement the new text-writing method using the same backpressure-safe writable stream behavior as JSONL records.
- Update `src/domain/entities/evaluation-report.ts` to expose accuracy summary data computed from existing comparison records.
- Add `src/domain/services/evaluation-accuracy-formatter.ts` to render deterministic aligned rows from accuracy summary data.
- Update `src/application/use-cases/evaluate-images.use-case.ts` to write existing comparison records, existing summary record, then the formatted accuracy text block.
- Update README eval output documentation to describe the appended human-readable accuracy block.

### Data Model

Detailed in [specs/005-eval-accuracy-summary/data-model.md](specs/005-eval-accuracy-summary/data-model.md). Core entities:

- `AccuracySummary`
- `FieldAccuracyMetric`
- `ParameterThresholdMetric`
- `ComparableEvaluationRecord`
- `AlignedAccuracyOutput`

### Contracts

Detailed in [specs/005-eval-accuracy-summary/contracts/cli.md](specs/005-eval-accuracy-summary/contracts/cli.md). The CLI contract preserves existing JSONL records and appends aligned text rows after the JSONL summary.

### Quickstart

Documented in [specs/005-eval-accuracy-summary/quickstart.md](specs/005-eval-accuracy-summary/quickstart.md), including expected eval command output shape, zero-comparable behavior, and validation commands.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: Domain computes accuracy data from comparisons; the CLI adapter handles stdout text writing; use cases depend on `OutputWriterPort`.
- [X] **Unit test strategy present**: Tests are planned for `EvaluationReport` accuracy data, formatter alignment, output writer text writing, use-case write order, and CLI integration output.
- [X] **Coverage policy acknowledged**: Coverage remains `>= 95%`, with changed aggregation and formatting branches targeted for full branch coverage where feasible.
- [X] **Additive test evolution respected**: Existing eval tests receive additive expectations for new writes; no historical comparison fields are removed or renamed.
- [X] **MCP-free implementation**: Design uses local npm/Jest/TypeScript workflow and Node.js built-ins only.
- [X] **Feature isolation via worktree**: Implementation remains scoped to `tmp/005-eval-accuracy-summary` on `005-eval-accuracy-summary`.
- [X] **Tech stack baseline**: The latest active Node.js LTS, Node.js 24.x as of 2026-05-26, and NestJS 11 remain the baseline.
- [X] **Dependency policy**: No new third-party dependency is needed; official Node.js APIs and TypeScript string utilities are sufficient.

## Complexity Tracking

No constitution violations are expected for this plan.
