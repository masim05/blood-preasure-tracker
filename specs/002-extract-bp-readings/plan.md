# Implementation Plan: Provider Metadata Extraction

**Branch**: `[002-extract-bp-readings]` | **Date**: 2026-05-25 | **Spec**: [specs/002-extract-bp-readings/spec.md](specs/002-extract-bp-readings/spec.md)

**Input**: Feature specification from `/specs/002-extract-bp-readings/spec.md`

## Summary

Adapt the existing provider-backed CLI so `predict` and `eval` still use OpenAI or similar vision adapters for `hand`, `systolic`, `diastolic`, and `pulse`, while a new metadata extraction port becomes the sole source of `time`. The plan preserves the current predict/eval JSONL workflows, CSV filename-stem matching, and provider/model configuration while refactoring contracts and tests to forbid model-derived timestamps.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js 22.13.1 LTS

**Primary Dependencies**: NestJS 11 standalone application context, `openai` SDK for provider-backed value extraction, `exif-parser` for image metadata timestamps, Jest 30 for testing

**Storage**: Local filesystem only (`data/eval`, `.env`, local CSV files, fixture images)

**Testing**: Jest unit, contract, and integration tests with CLI and adapter-boundary coverage

**Target Platform**: Local Node.js CLI execution on macOS/Linux developer machines and CI

**Project Type**: Single-project CLI application

**Performance Goals**: Stream JSONL output without full buffering; keep metadata extraction negligible relative to provider latency; support batch runs over tens to low hundreds of images per invocation

**Constraints**: `time` must come only from embedded image metadata, provider output must never infer `time`, existing predict/eval CLI behavior remains in scope, CI coverage stays `>= 95%`, changed feature areas should approach `100%`

**Scale/Scope**: Single-operator local CLI workflow with provider-backed extraction over small to medium image batches

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Domain logic stays behind ports for provider extraction, metadata extraction, image input, evaluation dataset, and output rendering.
- [X] **Unit test strategy present**: Plan includes new/updated tests for provider contract changes, metadata extraction, timestamp policy enforcement, eval matching, and CLI integration.
- [X] **Coverage policy acknowledged**: CI remains `>= 95%`, with changed prediction/metadata modules driven toward `100%` where practical.
- [X] **Additive test evolution respected**: Existing tests are updated only where the clarified timestamp-source rule changes prior assumptions.
- [X] **MCP-free implementation**: Plan uses only repository scripts, Node/Nest tooling, and local test fixtures.
- [X] **Feature isolation via worktree**: Work continues in `tmp/001-add-cli-eval` on branch `002-extract-bp-readings`.
- [X] **Tech stack baseline**: Plan keeps Node.js LTS and NestJS LTS in place.
- [X] **Dependency policy**: Existing official Node/NestJS modules remain primary; `exif-parser` is justified because Node/Nest provide no built-in EXIF parser.

## Project Structure

### Documentation (this feature)

```text
specs/002-extract-bp-readings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli.md
└── tasks.md
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

**Structure Decision**: Keep the existing single-project CLI layout and extend it with a new filesystem-backed metadata adapter under `src/adapters/outbound/filesystem`, while retaining the current provider-backed `src/adapters/outbound/llm` slice for value extraction.

## Phase 0: Research Output

Research completed in [specs/002-extract-bp-readings/research.md](specs/002-extract-bp-readings/research.md). Key outcomes:

- Keep the current provider-backed CLI and OpenAI adapter for blood pressure value extraction.
- Introduce a dedicated `ImageMetadataPort` so timestamps come only from embedded metadata.
- Use `exif-parser` to extract supported metadata timestamps.
- Preserve JSONL output and filename-stem eval matching.
- Normalize metadata timestamps without inventing timezone information.

## Phase 1: Design Output

### Planned Port and Adapter Changes

- Add `src/application/ports/image-metadata.port.ts` for metadata extraction.
- Remove `time` from `LlmProviderResponse` in `src/application/ports/llm-provider.port.ts`.
- Add `src/adapters/outbound/filesystem/image-metadata.adapter.ts` to read embedded metadata.
- Keep `src/adapters/outbound/llm/openai-vision.adapter.ts` focused on `hand`, `systolic`, `diastolic`, and `pulse` only.
- Update `src/application/use-cases/predict-images.use-case.ts` and `src/application/use-cases/evaluate-images.use-case.ts` to merge provider output with metadata output.
- Update `src/domain/entities/predicted-reading.ts` and `src/domain/services/uncertainty-policy.ts` to enforce metadata-only timestamp handling.

### Data Model

Detailed in [specs/002-extract-bp-readings/data-model.md](specs/002-extract-bp-readings/data-model.md). Core entities:

- `ImageMetadata`
- `ProviderExtractedVitals`
- `ExtractedReading`
- `GroundTruthRecord`
- `EvaluationComparison`
- `EvaluationReport`
- `ExtractionConfiguration`

### Contracts

Detailed in [specs/002-extract-bp-readings/contracts/cli.md](specs/002-extract-bp-readings/contracts/cli.md). The CLI contract preserves:

- `predict` and `eval` commands
- provider/model CLI configuration
- JSONL output for prediction and evaluation records
- filename-stem matching during `eval`

while adding the explicit rule that `time` is metadata-only.

### Quickstart

Documented in [specs/002-extract-bp-readings/quickstart.md](specs/002-extract-bp-readings/quickstart.md), including `.env` setup, predict/eval examples, validation commands, and dataset expectations.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: The design adds a metadata port instead of leaking EXIF parsing into use cases.
- [X] **Unit test strategy present**: Adapter, domain, and CLI boundaries are covered explicitly.
- [X] **Coverage policy acknowledged**: Contract and domain changes are scoped for high coverage.
- [X] **Additive test evolution respected**: Existing tests are updated only where timestamp ownership changes.
- [X] **MCP-free implementation**: No MCP dependency introduced.
- [X] **Feature isolation via worktree**: Planning remains isolated to the active feature worktree.
- [X] **Tech stack baseline**: Node/Nest baselines unchanged.
- [X] **Dependency policy**: The only new third-party dependency is a narrow EXIF parser justified by missing built-in support.

## Complexity Tracking

No constitution violations are expected for this plan.
