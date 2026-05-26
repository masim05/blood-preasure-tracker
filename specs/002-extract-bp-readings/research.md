# Research: Provider Metadata Extraction

## Decision 1: Keep the existing provider-backed extraction path for blood pressure values

**Decision**: Reuse the existing `openai` SDK integration and provider/model CLI flow for `hand`, `systolic`, `diastolic`, and `pulse`, rather than replacing it with a local OCR pipeline.

**Rationale**: The current repository already contains a working OpenAI adapter, provider/model configuration, help rendering, predict/eval orchestration, and extensive tests around that behavior. Reusing that path keeps the new feature aligned with the clarified spec while minimizing architectural churn.

**Alternatives considered**:

- Replace the provider path with local OCR: rejected because it conflicts with the clarified feature scope and would discard working provider infrastructure.
- Hard-code OpenAI without a provider abstraction: rejected because the constitution and spec require ports-and-adapters boundaries.

## Decision 2: Extract `time` through a dedicated image-metadata port

**Decision**: Add a dedicated `ImageMetadataPort` and filesystem-backed metadata adapter that reads embedded image metadata and returns the timestamp independently of the provider response.

**Rationale**: This is the cleanest way to enforce the rule that `time` must never come from model output. It keeps timestamp sourcing auditable and lets predict/eval orchestration merge metadata with provider-extracted vitals in one place.

**Alternatives considered**:

- Leave `time` in the provider contract and overwrite it later: rejected because it weakens the boundary and makes timestamp policy easier to violate accidentally.
- Parse metadata directly inside the use case: rejected because it mixes I/O concerns into application logic.

## Decision 3: Use `exif-parser` for timestamp extraction

**Decision**: Use `exif-parser` to read embedded EXIF metadata from image buffers and normalize supported timestamp tags such as `DateTimeOriginal`, `CreateDate`, or equivalent image metadata fields.

**Rationale**: Node.js has no built-in EXIF parser, and `exif-parser` is a focused, lightweight JavaScript dependency suitable for a CLI. It introduces much less surface area than a full image-processing stack while satisfying the metadata-only timestamp rule.

**Alternatives considered**:

- Hand-rolled buffer parsing: rejected because the format edge cases are not worth the maintenance burden.
- File mtime fallback: rejected because filesystem timestamps are not image metadata and would violate the requirement.

## Decision 4: Preserve predict/eval JSONL behavior and filename-stem matching

**Decision**: Keep the existing JSONL output model and the existing eval matcher that uses filename stem identity between images and CSV rows.

**Rationale**: Those behaviors are already implemented, tested, and still match the clarified feature scope. The feature change is about timestamp sourcing and provider boundaries, not about output transport or eval matching rules.

**Alternatives considered**:

- Redesign output to arrays or nested reports: rejected because JSONL streaming is already suitable for batch CLI runs.
- Rework eval matching strategy: rejected because the current filename-stem approach is already deterministic and understood.

## Decision 5: Normalize metadata timestamps without inventing timezone information

**Decision**: When metadata provides a parseable timestamp without timezone information, preserve it in normalized local timestamp form (for example `YYYY-MM-DD HH:mm:ss`) without appending or inferring a timezone.

**Rationale**: The feature forbids inferring time from model output, and timezone inference would introduce a similar class of fabricated data. Preserving the embedded timestamp value keeps the result faithful to the metadata source.

**Alternatives considered**:

- Convert naive timestamps to UTC using local runtime timezone: rejected because that invents timezone semantics.
- Mark every naive timestamp as a hard failure: rejected because useful timestamp information would be discarded unnecessarily.

## Decision 6: Enforce timestamp policy through domain and contract tests

**Decision**: Update domain, adapter, and integration tests so provider mocks no longer own `time`, metadata extraction is tested separately, and predict/eval flows prove that missing metadata leaves `time` null or uncertain while unaffected inputs continue.

**Rationale**: The clarified feature changes behavior at a contract boundary, so the most durable protection is executable coverage around that boundary.

**Alternatives considered**:

- Rely on code review alone: rejected because the boundary is easy to regress during future adapter changes.
- Add only integration coverage: rejected because domain and port-level tests are needed to keep the split explicit.

## Risks to Call Out in the Plan

- Some supported image formats may not contain usable EXIF-style timestamp metadata even when the monitor values are readable.
- Existing provider/domain contracts currently include `time`; those contracts and tests will need coordinated updates.
- Help text, CLI config validation, and README content still reflect the older provider-plus-model timestamp assumptions and must be updated together.
