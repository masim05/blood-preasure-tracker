# Research: CLI Eval Tool

## Runtime and App Composition

**Decision**: Use TypeScript on Node.js 22.13.1 LTS with a NestJS 11 standalone application context for dependency wiring, while keeping all business logic outside Nest-specific classes.

**Rationale**: Node 22.13.1 matches the constitution baseline observed in the local toolchain. NestJS 11.1.x is the current baseline package version and can be used without an HTTP server, giving consistent provider wiring while keeping the domain hexagonal.

**Alternatives considered**:

- Pure manual wiring with no NestJS: smaller, but conflicts with the project constitution requiring a NestJS baseline.
- Full Nest HTTP application: unnecessary for a local batch CLI and adds irrelevant transport concerns.

## LLM Provider Integration

**Decision**: Default to the official OpenAI SDK 6.39.0 behind an `LlmProviderPort`, with a provider/model registry that exposes a static model catalog and allows additional adapters later.

**Rationale**: The spec requires OpenAI by default with `gpt-5.4-mini`, model selection, and adapter-based support for future providers. The official SDK satisfies the official-first dependency rule and is the thinnest way to reach the API.

**Alternatives considered**:

- Direct `fetch` calls to provider endpoints: workable, but duplicates auth/request logic already handled by the official SDK.
- Live model discovery for help output: rejected because the spec clarification requires statically configured models from installed adapters.

## CLI and Help Surface

**Decision**: Implement CLI parsing with `process.argv` plus a small parser/renderer layer, and use JSONL as the default output format for `predict` and `eval`.

**Rationale**: This keeps the CLI dependency-light and aligned with official Node modules. JSONL matches the clarified spec, streams naturally for batches, and is easy to snapshot-test.

**Alternatives considered**:

- `commander`, `yargs`, or `nest-commander`: not necessary for the limited command surface and would add third-party dependencies where built-ins are sufficient.
- JSON array output: simpler to reason about, but forces full buffering and is less stream-friendly.

## Evaluation Dataset Handling

**Decision**: Match images to CSV rows by filename stem and parse the CSV with a small validated parser over Node filesystem input, assuming a simple flat file shape.

**Rationale**: Filename-stem matching is now part of the clarified spec. The evaluation dataset is local and narrow in scope, so a minimal parser with explicit header validation keeps dependencies down while still covering the required behavior.

**Alternatives considered**:

- Row-order matching: rejected by clarification.
- `csv-parse` or similar parser library: deferred unless the real dataset introduces escaping/quoting complexity that exceeds the validated simple parser.

## Testing and Coverage

**Decision**: Use Jest with Nest testing utilities for unit, contract, and integration tests, and enforce repository coverage thresholds of at least 95% in CI.

**Rationale**: The feature needs high-coverage TypeScript tests, CLI integration tests, and adapter contract tests. Jest handles coverage thresholds and TS-centric testing ergonomically without adding custom coverage plumbing.

**Alternatives considered**:

- `node:test` only: official-first, but would require extra TypeScript and coverage orchestration that adds more setup complexity than it removes.
- Vitest: viable, but less aligned with NestJS defaults and not materially better for this small CLI.
