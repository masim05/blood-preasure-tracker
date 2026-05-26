# Implementation Plan: CLI Eval Tool

**Branch**: `[001-add-cli-eval]` | **Date**: 2026-05-25 | **Spec**: [specs/001-cli-eval-tool/spec.md](specs/001-cli-eval-tool/spec.md)

**Input**: Feature specification from `/specs/001-cli-eval-tool/spec.md`

## Summary

Replace the older LLM-based extraction direction with a fully local CLI pipeline: load images from a local directory, extract `time` from image metadata, derive monitor values offline with local OCR plus deterministic parsing, and emit JSONL prediction/evaluation output matched to CSV ground truth by filename stem.

> Superseded note: This early `001` plan was replaced by the later provider-backed extraction design. The current implementation uses OpenAI for monitor value extraction and embedded metadata only for `time`; see `specs/003-fix-time-extraction/plan.md` for the active timestamp behavior.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js 22.13.1 LTS

**Primary Dependencies**: NestJS 11 standalone application context for wiring, Jest 30 for tests, `exif-parser` for metadata extraction, `sharp` for image preprocessing, `tesseract.js` for offline OCR

**Storage**: Local filesystem only (`data/eval`, `.env`, fixture images, local CSV files)

**Testing**: Jest unit, integration, and adapter-boundary tests with fixture-based metadata and OCR coverage

**Target Platform**: Local Node.js CLI execution on macOS/Linux developer machines and CI

**Project Type**: Single-project CLI application

**Performance Goals**: Stream JSONL without full buffering; target typical local predict throughput of a few seconds per image with deterministic offline behavior

**Constraints**: Offline-capable, no external LLM/network APIs, metadata is the only valid source for `time`, maintain CI coverage >= 95%, keep changed feature areas near 100%

**Scale/Scope**: Single-operator local batch runs over tens to low hundreds of images per invocation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Domain owns normalization, uncertainty, and evaluation rules behind image parsing, metadata extraction, dataset, and output ports.
- [X] **Unit test strategy present**: Planned tests cover metadata extraction, OCR parsing, uncertainty handling, eval matching, and CLI integration.
- [X] **Coverage policy acknowledged**: CI remains `>= 95%`, with local extraction and metadata modules targeted for near-100% coverage.
- [X] **Additive test evolution respected**: New behavior is introduced with new tests; existing tests only change where the clarified spec invalidates prior LLM-specific assumptions.
- [X] **MCP-free implementation**: Plan relies on local Node/Nest tooling, fixture files, and offline OCR libraries only.
- [X] **Feature isolation via worktree**: Work continues in `tmp/001-add-cli-eval` on branch `001-add-cli-eval`.
- [X] **Tech stack baseline**: Plan keeps Node.js LTS and NestJS LTS in place.
- [X] **Dependency policy**: Node built-ins remain first choice; `exif-parser`, `sharp`, and `tesseract.js` are justified because Node/Nest have no built-in EXIF or OCR capability.

## Project Structure

### Documentation (this feature)

```text
specs/001-cli-eval-tool/
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
│       └── ocr/
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

**Structure Decision**: Keep the existing single-project CLI layout and replace the old provider/model-oriented outbound adapter slice with local metadata/OCR adapters under `src/adapters/outbound/filesystem` and `src/adapters/outbound/ocr`.

## Complexity Tracking

No constitution violations are expected for this plan.
