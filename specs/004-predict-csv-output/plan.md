# Implementation Plan: Predict CSV Output

**Branch**: `004-predict-csv-output` | **Date**: 2026-05-26 | **Spec**: [specs/004-predict-csv-output/spec.md](specs/004-predict-csv-output/spec.md)

**Input**: Feature specification from `/specs/004-predict-csv-output/spec.md`

## Summary

Add a durable prediction CSV artifact for the `predict` command. Each run creates or replaces `<input>/p.csv`, writes the header immediately, streams one CSV row as each image is processed, preserves the existing JSONL prediction output, and emits the stable schema `imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes`. The existing `eval --csv` path will accept generated `p.csv` files as reference data by parsing the six core reading columns while ignoring service columns, then comparing fresh predictions against those rows.

## Technical Context

**Language/Version**: TypeScript 5.8 on the latest active Node.js LTS, Node.js 24.x as of 2026-05-26

**Primary Dependencies**: NestJS 11 standalone application context, Node.js built-in `fs`/stream APIs for CSV file writing, existing OpenAI SDK adapter for provider-backed vitals extraction, existing `exif-parser` adapter for metadata timestamps, Jest 30 for tests

**Storage**: Local filesystem only; `predict` writes `<input-directory>/p.csv`, `eval` reads CSV files from local paths, tests use local fixtures and temp directories

**Testing**: Jest unit, contract, and integration tests; local validation through `npm run build`, `npm test`, `npm run test:coverage`, and `npm run lint`

**Target Platform**: Local Node.js CLI on macOS/Linux developer machines and GitHub Actions CI

**Project Type**: Single-project CLI application

**Performance Goals**: CSV row writing is streaming and bounded to one row per processed image; prediction throughput remains dominated by provider inference and metadata extraction, not CSV buffering

**Constraints**: Preserve existing JSONL prediction output; write `p.csv` inside the exact `--input` directory; replace stale `p.csv` before streaming current rows; write null values as empty cells; encode `uncertainFields` as a JSON array string inside one CSV cell; maintain CI coverage `>= 95%`

**Scale/Scope**: Single-operator local CLI workflow over tens to low hundreds of images per invocation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [X] **Hexagonal boundaries defined**: Add or extend an output port for prediction CSV artifacts; keep concrete filesystem CSV writing in an adapter; CSV parsing remains in the filesystem CSV adapter behind `EvaluationDatasetPort`.
- [X] **Unit test strategy present**: Add tests for CSV row formatting, streaming writer behavior, predict orchestration, eval parsing with service columns, empty directories, replacement behavior, and write failures.
- [X] **Coverage policy acknowledged**: CI gate remains `>= 95%`; changed CSV writing/parsing/orchestration paths target `100%` branch coverage where practical.
- [X] **Additive test evolution respected**: Existing tests change only where they assert output side effects affected by the new `p.csv` artifact or CSV parsing compatibility.
- [X] **MCP-free implementation**: Plan uses local repository scripts, npm, Jest, TypeScript, and Node.js built-ins only.
- [X] **Feature isolation via worktree**: Implementation will use branch `004-predict-csv-output` and worktree path `tmp/004-predict-csv-output`.
- [X] **Tech stack baseline**: Plan targets the latest active Node.js LTS, Node.js 24.x as of 2026-05-26, and NestJS 11.
- [X] **Dependency policy**: No new third-party runtime dependency is planned; Node.js built-in file/stream APIs are sufficient for CSV artifact writing.

## Project Structure

### Documentation (this feature)

```text
specs/004-predict-csv-output/
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
│   │       ├── cli-parser.ts
│   │       ├── help-renderer.ts
│   │       └── jsonl-output.writer.ts
│   └── outbound/
│       ├── filesystem/
│       │   ├── csv-dataset.adapter.ts
│       │   ├── image-directory.adapter.ts
│       │   ├── image-metadata.adapter.ts
│       │   └── prediction-csv.writer.ts      # planned
│       └── llm/
├── application/
│   ├── ports/
│   │   ├── evaluation-dataset.port.ts
│   │   ├── image-metadata.port.ts
│   │   ├── image-source.port.ts
│   │   ├── llm-provider.port.ts
│   │   ├── model-catalog.port.ts
│   │   ├── output-writer.port.ts
│   │   └── prediction-csv-writer.port.ts     # planned
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

**Structure Decision**: Keep the existing single-project CLI layout. Add a prediction CSV writer port and filesystem adapter; update the predict use case to stream CSV rows while continuing JSONL output; update the CSV dataset adapter to tolerate generated `p.csv` service columns while preserving required core column validation.

## Phase 0: Research Output

Research completed in [specs/004-predict-csv-output/research.md](specs/004-predict-csv-output/research.md). Key outcomes:

- Use a dedicated prediction CSV writer port and filesystem adapter instead of embedding filesystem writes in use cases.
- Use Node.js built-in file/stream APIs and a local CSV escaping helper; no new CSV dependency is needed for the fixed schema.
- Stream rows as each image is processed after replacing stale `p.csv` and writing the header at run start.
- Encode `uncertainFields` as `JSON.stringify(string[])` inside one escaped CSV cell.
- Keep eval semantics unchanged: supplied CSV is reference data; generated service columns are ignored.

## Phase 1: Design Output

### Planned Port and Adapter Changes

- Add `src/application/ports/prediction-csv-writer.port.ts` with lifecycle methods for starting a run, writing one prediction row, and closing/releasing the writer.
- Add `src/adapters/outbound/filesystem/prediction-csv.writer.ts` to replace `<input>/p.csv`, write the stable header, stream escaped rows, handle backpressure/errors, and close cleanly.
- Update `src/application/use-cases/predict-images.use-case.ts` to open the CSV writer before processing images, write one CSV row for each produced `PredictedReading`, continue existing JSONL output, and close the writer in success/error paths.
- Update `src/adapters/outbound/filesystem/csv-dataset.adapter.ts` only as needed to ignore extra service columns while still requiring `imageId,time,hand,systolic,diastolic,pulse`.
- Wire the new CSV writer adapter through `src/app.module.ts` and `src/main.ts`.

### Data Model

Detailed in [specs/004-predict-csv-output/data-model.md](specs/004-predict-csv-output/data-model.md). Core entities:

- `PredictionCsvFile`
- `PredictionCsvRow`
- `PredictionCsvServiceInfo`
- `EvaluationReferenceRow`

### Contracts

Detailed in [specs/004-predict-csv-output/contracts/cli.md](specs/004-predict-csv-output/contracts/cli.md). The CLI contract adds `<input>/p.csv` creation to `predict` and confirms `eval --csv <input>/p.csv` treats the file as reference data while ignoring service columns.

### Quickstart

Documented in [specs/004-predict-csv-output/quickstart.md](specs/004-predict-csv-output/quickstart.md), including prediction CSV generation, eval reuse, empty-cell/null behavior, and validation commands.

## Post-Design Constitution Check

- [X] **Hexagonal boundaries defined**: Filesystem CSV writing is isolated behind `PredictionCsvWriterPort`; eval CSV reading stays behind `EvaluationDatasetPort`; use cases depend on ports.
- [X] **Unit test strategy present**: Tests are planned for writer escaping/backpressure/error behavior, predict CSV streaming, eval extra-column compatibility, and integration round trip.
- [X] **Coverage policy acknowledged**: Coverage remains `>= 95%`, with changed CSV writer and parsing branches targeted for full branch coverage where feasible.
- [X] **Additive test evolution respected**: Existing tests will be updated only for the intentional new predict side effect and CSV compatibility requirement.
- [X] **MCP-free implementation**: Design uses local npm/Jest/TypeScript workflow and Node.js built-ins only.
- [X] **Feature isolation via worktree**: Implementation remains scoped to `tmp/004-predict-csv-output` on `004-predict-csv-output`.
- [X] **Tech stack baseline**: The latest active Node.js LTS, Node.js 24.x as of 2026-05-26, and NestJS 11 remain the baseline.
- [X] **Dependency policy**: No new third-party dependency is needed; official Node.js APIs are preferred.

## Complexity Tracking

No constitution violations are expected for this plan.
