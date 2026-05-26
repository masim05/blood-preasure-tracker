# Implementation Plan: Fix Time Extraction

**Branch**: `003-fix-time-extraction` | **Date**: 2026-05-25 | **Spec**: [specs/003-fix-time-extraction/spec.md](specs/003-fix-time-extraction/spec.md)

**Input**: Feature specification from `/specs/003-fix-time-extraction/spec.md`

## Summary

Fix the CLI bug where a JPEG with embedded EXIF/TIFF `DateTime` metadata, visible as `datetime=2026:05:19 06:05:20`, still emits `"time": null` during `predict`. The implementation will add a dedicated image metadata port and filesystem adapter, normalize supported EXIF timestamps to `YYYY-MM-DD HH:mm:ss`, merge metadata-derived `time` with provider-derived blood-pressure values, and ensure `eval` compares against the corrected metadata timestamp without introducing provider, filename, or file modification time fallback.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js 22.13.1 LTS

**Primary Dependencies**: NestJS 11 standalone application context, `openai` SDK for provider-backed vitals extraction, `exif-parser` for embedded image metadata timestamps, Jest 30 for tests

**Storage**: Local filesystem only (`data/eval`, CSV ground truth, fixture images, `.env`)

**Testing**: Jest unit, contract, and integration tests; CLI validation through existing npm scripts

**Target Platform**: Local Node.js CLI on macOS/Linux developer machines and CI

**Project Type**: Single-project CLI application

**Performance Goals**: Metadata extraction remains local and negligible relative to provider latency; prediction/evaluation continue processing small to medium image batches without full-output buffering

**Constraints**: `time` must come only from embedded image metadata; no provider, filename, or file modification time fallback; preserve provider-backed `hand`, `systolic`, `diastolic`, and `pulse`; preserve CI coverage `>= 95%`

**Scale/Scope**: Single-operator local CLI workflow over tens to low hundreds of images per invocation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Add `ImageMetadataPort` for timestamp extraction; keep EXIF parsing in a filesystem adapter and provider inference behind `LlmProviderPort`.
- [X] **Unit test strategy present**: Add metadata adapter, timestamp normalization, precedence, predict orchestration, and eval comparison tests.
- [X] **Coverage policy acknowledged**: CI gate remains `>= 95%`; changed timestamp extraction and orchestration branches target `100%` where practical.
- [X] **Additive test evolution respected**: Existing tests change only where the defect fix removes provider-owned timestamp behavior.
- [X] **MCP-free implementation**: Plan uses local repository scripts, npm, Jest, TypeScript, and local fixtures only.
- [X] **Feature isolation via worktree**: Work remains in `tmp/001-add-cli-eval` on branch `003-fix-time-extraction`.
- [X] **Tech stack baseline**: Plan targets Node.js 22.13.1+ and NestJS 11.
- [X] **Dependency policy**: Use `exif-parser` because Node.js/NestJS provide no official EXIF parser; no broader image-processing dependency is planned.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-time-extraction/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── inbound/
│   │   └── cli/
│   └── outbound/
│       ├── filesystem/
│       └── llm/
├── application/
│   ├── ports/
│   └── use-cases/
├── domain/
│   ├── entities/
│   └── services/
├── infrastructure/
│   └── config/
├── app.module.ts
└── main.ts

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Keep the existing single-project CLI layout. Add `src/application/ports/image-metadata.port.ts` and `src/adapters/outbound/filesystem/image-metadata.adapter.ts`; update prediction/evaluation use cases to consume the new port while keeping EXIF parsing out of domain logic.

## Phase 0: Research Output

Research completed in [specs/003-fix-time-extraction/research.md](specs/003-fix-time-extraction/research.md). Key outcomes:

- Use a metadata port and filesystem adapter for timestamp extraction.
- Add/use `exif-parser` for EXIF/TIFF timestamp tags because no official Node/Nest parser exists.
- Apply timestamp precedence: `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`.
- Normalize timestamps to `YYYY-MM-DD HH:mm:ss` without inventing timezone information.
- Remove provider ownership of `time`; missing metadata stays `null` and uncertain.

## Phase 1: Design Output

### Planned Port and Adapter Changes

- Add `src/application/ports/image-metadata.port.ts` with timestamp extraction result fields for raw value, normalized time, source tag, and issues.
- Add `src/adapters/outbound/filesystem/image-metadata.adapter.ts` to parse image buffers for EXIF timestamp tags.
- Update `src/application/ports/llm-provider.port.ts` and provider adapter tests so provider responses no longer own `time`.
- Update `src/application/use-cases/predict-images.use-case.ts` and `src/application/use-cases/evaluate-images.use-case.ts` to merge metadata timestamp output with provider vitals.
- Update `src/domain/services/uncertainty-policy.ts` and `src/domain/entities/predicted-reading.ts` only as needed to preserve `time` uncertainty when metadata is missing.
- Wire the metadata adapter through `src/app.module.ts` and `src/main.ts`.

### Data Model

Detailed in [specs/003-fix-time-extraction/data-model.md](specs/003-fix-time-extraction/data-model.md). Core entities:

- `ImageMetadataTimestamp`
- `TimestampExtractionResult`
- `ProviderVitalsResult`
- `PredictionRecord`
- `EvaluationTimestampComparison`

### Contracts

Detailed in [specs/003-fix-time-extraction/contracts/cli.md](specs/003-fix-time-extraction/contracts/cli.md). The CLI contract preserves `predict` and `eval` JSONL output while clarifying that `time` is metadata-only, normalized to `YYYY-MM-DD HH:mm:ss`, and resolved by the accepted tag precedence order.

### Quickstart

Documented in [specs/003-fix-time-extraction/quickstart.md](specs/003-fix-time-extraction/quickstart.md), including fixture setup, predict/eval reproduction commands, and coverage validation.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: EXIF parsing remains in the filesystem adapter behind `ImageMetadataPort`; domain/application code receives port results.
- [X] **Unit test strategy present**: Tests cover adapter parsing, precedence, malformed/missing metadata, predict output, and eval comparison.
- [X] **Coverage policy acknowledged**: Coverage remains `>= 95%`, with changed timestamp extraction paths targeted for full branch coverage.
- [X] **Additive test evolution respected**: Existing tests are updated only to correct the timestamp-source defect and provider contract boundary.
- [X] **MCP-free implementation**: Design uses local npm/Jest/TypeScript workflow only.
- [X] **Feature isolation via worktree**: Plan remains scoped to `tmp/001-add-cli-eval` on `003-fix-time-extraction`.
- [X] **Tech stack baseline**: Node.js and NestJS baselines remain unchanged.
- [X] **Dependency policy**: `exif-parser` is the only planned third-party addition and is justified by missing official EXIF support.

## Complexity Tracking

No constitution violations are expected for this plan.
