# Implementation Plan: CLI Eval Tool

**Branch**: `[001-add-cli-eval]` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-cli-eval-tool/spec.md`

**Note**: This plan covers Phase 0 research and Phase 1 design artifacts for a local CLI that predicts and evaluates blood-pressure readings from images through pluggable LLM adapters.

## Summary

Build a local batch CLI on TypeScript and Node.js 22 LTS using a NestJS 11 standalone application context for composition, with hexagonal boundaries around domain use cases, filesystem input/output, and LLM providers. The tool will scan a configurable image directory, call a provider adapter (default OpenAI with `gpt-5.4-mini`), emit JSONL prediction records, and support `eval` mode by matching image files to CSV rows via filename stem and emitting per-image comparison records plus a summary record.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22.13.1 LTS

**Primary Dependencies**: NestJS 11.1.x (`@nestjs/common`, `@nestjs/core`, `@nestjs/testing`), OpenAI SDK 6.39.0, TypeScript compiler toolchain, official Node.js built-ins (`node:fs`, `node:path`, `node:process`, `node:stream`)

**Storage**: Local filesystem only; images in configurable directories and ground-truth CSV files on disk; no database

**Testing**: Jest with Nest testing utilities for unit/integration/contract suites and CI coverage thresholds >= 95%

**Target Platform**: Local macOS/Linux CLI environments running Node.js 22 LTS

**Project Type**: CLI application using a NestJS standalone application context (no HTTP server)

**Performance Goals**: Stream JSONL output as each image is processed; support batches of roughly 10-200 images per run without holding full outputs in memory; keep CLI startup under 2 seconds before provider calls

**Constraints**: Hexagonal architecture, MCP-free workflow, worktree under `tmp/`, default OpenAI adapter with pluggable provider port, JSONL default output, filename-stem CSV matching, official Node/Nest modules first, CI coverage >= 95%

**Scale/Scope**: Single-operator local tool; one configured image directory and optional CSV per run; tens to low hundreds of images per invocation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Hexagonal boundaries defined**: Domain entities/use cases live under `src/domain` and `src/application`; CLI, filesystem, and LLM integrations are separate adapters.
- [x] **Unit test strategy present**: Use-case, parser, registry, and uncertainty behavior tests are planned under `tests/unit` with adapter contract tests and CLI integration tests.
- [x] **Coverage policy acknowledged**: Jest coverage thresholds will be set to at least 95%, with changed feature modules targeted at 100% where feasible.
- [x] **Additive test evolution respected**: This feature adds new tests only; no existing test rewrites are required.
- [x] **MCP-free implementation**: Implementation relies only on local Node/Nest tooling, repository scripts, and provider SDKs.
- [x] **Feature isolation via worktree**: Feature branch is `001-add-cli-eval` and the implementation worktree path is `tmp/001-add-cli-eval`.
- [x] **Tech stack baseline**: Runtime targets Node.js 22.13.1 LTS and NestJS 11.1.x.
- [x] **Dependency policy**: Official Node.js modules and official vendor SDKs are used first; only testing/tooling dependencies are added with justification.

**Post-Design Re-check**: PASS. Phase 1 artifacts preserve the same adapter boundaries, testing posture, and dependency policy.

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
├── app.module.ts
├── main.ts
├── application/
│   ├── ports/
│   │   ├── evaluation-dataset.port.ts
│   │   ├── image-source.port.ts
│   │   ├── llm-provider.port.ts
│   │   ├── model-catalog.port.ts
│   │   └── output-writer.port.ts
│   └── use-cases/
│       ├── evaluate-images.use-case.ts
│       ├── list-models.use-case.ts
│       └── predict-images.use-case.ts
├── domain/
│   ├── entities/
│   │   ├── evaluation-report.ts
│   │   ├── ground-truth-record.ts
│   │   └── predicted-reading.ts
│   └── services/
│       ├── evaluation-matcher.ts
│       └── uncertainty-policy.ts
├── adapters/
│   ├── inbound/
│   │   └── cli/
│   │       ├── cli-parser.ts
│   │       ├── help-renderer.ts
│   │       └── jsonl-output.writer.ts
│   └── outbound/
│       ├── filesystem/
│       │   ├── csv-dataset.adapter.ts
│       │   └── image-directory.adapter.ts
│       └── llm/
│           ├── model-registry.ts
│           └── openai-vision.adapter.ts
└── infrastructure/
    └── config/
        ├── cli-config.ts
        └── env-config.ts

tests/
├── contract/
│   └── llm-provider.contract.test.ts
├── integration/
│   └── cli.integration.test.ts
└── unit/
    ├── application/
    ├── domain/
    └── adapters/
```

**Structure Decision**: Use a single-project CLI layout with explicit `application`, `domain`, and adapter boundaries. NestJS is limited to composition/bootstrap in `app.module.ts` and provider wiring, avoiding transport/server layers while still satisfying the framework baseline and preserving testable ports.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| None | - | - |
