# Research: CLI Eval Tool

## Runtime and Composition

**Decision**: Keep TypeScript on Node.js 22.13.1 LTS with a NestJS 11 standalone application context for dependency wiring, while keeping business rules in framework-agnostic domain and application layers.

**Rationale**: This preserves the current constitution-aligned runtime baseline, keeps the CLI wiring consistent with the existing repository shape, and avoids introducing HTTP or server concerns into a purely local batch tool.

**Alternatives considered**:

- Pure manual wiring with no NestJS: smaller, but conflicts with the repository's NestJS baseline.
- Full Nest HTTP app: unnecessary for an offline CLI.

## Metadata Timestamp Extraction

**Decision**: Use `exif-parser` over image buffers to read embedded EXIF timestamp fields such as `DateTimeOriginal`; if no parseable metadata exists, emit `time: null` and mark the field uncertain rather than synthesizing time from another source.

**Rationale**: The clarified spec explicitly requires `time` to come from image metadata and forbids model-generated timestamps. `exif-parser` is a focused library with minimal surface area and no external binary dependency.

**Alternatives considered**:

- `piexifjs`: viable, but more browser-oriented than needed for this Node CLI.
- File mtime fallback: rejected because it is filesystem metadata, not image metadata, and could silently misrepresent capture time.

## Local Value Extraction

**Decision**: Use `sharp` for optional orientation and contrast normalization, then run `tesseract.js` offline OCR and apply deterministic regex/range validation to derive `hand`, `systolic`, `diastolic`, and `pulse`.

**Rationale**: Node and Nest do not provide built-in OCR. `tesseract.js` runs locally without network access and keeps the feature aligned with the no-LLM clarification. `sharp` improves OCR consistency on rotated or low-contrast monitor photos.

**Alternatives considered**:

- External OCR or vision APIs: rejected by clarification.
- Hand-written image recognition: too much risk for an MVP CLI.
- System-installed Tesseract binary: workable, but less reproducible than the npm/WASM path.

## Output and Evaluation Flow

**Decision**: Preserve JSONL output and filename-stem CSV matching, but remove provider/model concerns from emitted records, help text, and evaluation summaries.

**Rationale**: The existing JSONL and eval matching clarifications remain valid and fit the local-only design. Removing provider/model state keeps the output contract honest and easier to validate.

**Alternatives considered**:

- JSON array output: rejected because it forces buffering.
- Row-order matching: rejected by previous clarification.

## Local Configuration Surface

**Decision**: Keep `.env`-backed local execution, but reduce configuration to local file-path and extraction-tuning concerns, such as `CLI_INPUT_DIR`, `CLI_EVAL_CSV`, and an optional OCR confidence threshold.

**Rationale**: The user already clarified `.env` usage. With no external APIs, the remaining useful configuration is local and non-secret.

**Alternatives considered**:

- Hard-coded paths only: simpler, but less usable for repeated local runs.
- Provider/model environment variables: obsolete after the no-LLM clarification.

## Testing and Coverage

**Decision**: Cover metadata extraction, OCR parsing boundaries, uncertainty handling, eval matching, and CLI command flows with fixture-based Jest tests; update or replace the old provider-contract tests with local adapter-boundary tests.

**Rationale**: The clarified feature invalidates the earlier provider-focused test plan. High-confidence local parsing requires fixtures for EXIF presence/absence, OCR noise, and deterministic CSV matching.

**Alternatives considered**:

- Snapshot-only CLI tests: insufficient for OCR and metadata boundary behavior.
- Live external validation datasets only: too slow and nondeterministic for CI.

## Risks to Capture in Implementation

**Decision**: Treat missing metadata, OCR misreads, and monitor-layout variance as first-class uncertainty/error cases in the implementation plan and tests.

**Rationale**: These are the most likely sources of real-world extraction defects in a local-only pipeline.

**Alternatives considered**:

- Assuming high-quality images only: unrealistic and would hide required uncertainty behavior.
