# Feature Specification: Fix Time Extraction

**Feature Branch**: `003-fix-time-extraction`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "fix the bug with time extraction: a JPEG image reports EXIF datetime `2026:05:19 06:05:20` via the `file` command, but `npm run cli -- predict` emits `\"time\": null` for the same image."

## Clarifications

### Session 2026-05-25

- Q: Which embedded timestamp field precedence should the metadata extractor use? → A: `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`.
- Q: What timestamp format should `predict` and `eval` emit after normalizing EXIF values? → A: `YYYY-MM-DD HH:mm:ss`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read EXIF DateTime in Predict Output (Priority: P1)

As a CLI user processing blood-pressure monitor photos, I want `predict` to emit the timestamp already embedded in a JPEG's metadata so that each prediction can be matched to the actual measurement time without manual correction.

**Why this priority**: The current behavior loses a timestamp that is visibly present in the image metadata, which breaks the core promise that `time` comes from photo metadata.

**Independent Test**: Run `predict` on a fixture JPEG whose metadata contains `datetime=2026:05:19 06:05:20` and verify the JSONL prediction contains that timestamp instead of `null`.

**Acceptance Scenarios**:

1. **Given** a JPEG image whose embedded metadata includes the timestamp `2026:05:19 06:05:20`, **When** the user runs `npm run cli -- predict` for that image, **Then** the emitted prediction has a non-null `time` value representing `2026-05-19 06:05:20`.
2. **Given** the same JPEG image is processed with provider-backed value extraction, **When** the prediction is emitted, **Then** `hand`, `systolic`, `diastolic`, and `pulse` remain provider-derived while `time` is metadata-derived.
3. **Given** the timestamp is successfully read from image metadata, **When** the prediction is emitted, **Then** `uncertainFields` does not include `time` solely because of timestamp extraction.

---

### User Story 2 - Preserve Null for Truly Missing Metadata (Priority: P2)

As a CLI user processing mixed photo sets, I want images without a usable embedded timestamp to continue producing `time: null` with clear uncertainty so that missing metadata remains visible and does not block the batch.

**Why this priority**: Fixing the bug must not invent timestamps or weaken the metadata-only rule.

**Independent Test**: Run `predict` on an image without a usable embedded timestamp and verify the record remains processable with `time: null` and a timestamp uncertainty indicator.

**Acceptance Scenarios**:

1. **Given** an image has no embedded timestamp, **When** the user runs `predict`, **Then** the prediction emits `time: null` and marks `time` as uncertain unless the whole image is in an error state.
2. **Given** an image has malformed or unsupported timestamp metadata, **When** the user runs `predict`, **Then** the prediction does not use file modification time, provider output, or filename text as a fallback.

---

### User Story 3 - Use Fixed Metadata Time in Evaluation (Priority: P3)

As a CLI user evaluating predictions against a CSV dataset, I want `eval` to compare against the timestamp extracted from image metadata so that timestamp accuracy reports reflect the real photo metadata.

**Why this priority**: Evaluation depends on the same prediction timestamp field and should benefit automatically from the corrected extraction behavior.

**Independent Test**: Run `eval` against a fixture image and CSV row where the expected time matches the embedded JPEG timestamp and verify the timestamp comparison succeeds.

**Acceptance Scenarios**:

1. **Given** a CSV row expects `2026-05-19 06:05:20` for an image whose metadata contains that timestamp, **When** the user runs `eval`, **Then** the comparison treats the predicted time as matching the expected time.
2. **Given** an evaluated image lacks usable timestamp metadata, **When** the user runs `eval`, **Then** the report preserves metadata-missing accounting instead of treating a model-inferred or filesystem-derived timestamp as correct.

---

### Edge Cases

- JPEG metadata may expose the timestamp through a generic image `DateTime` field rather than the more camera-specific original-date field.
- Metadata timestamps may use the EXIF format `YYYY:MM:DD HH:MM:SS` and must be normalized to `YYYY-MM-DD HH:mm:ss`.
- Metadata timestamps may include missing timezone information; the CLI must preserve the local timestamp value without inventing a timezone.
- Images with multiple timestamp tags must use the deterministic precedence order `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`, and document it in tests.
- Images without readable metadata, with corrupt metadata, or with unsupported timestamp formats must continue to emit `time: null` with timestamp uncertainty.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Existing image metadata extraction port behavior is affected; no new domain port is required.
- **Adapters Affected**: Filesystem image metadata adapter and prediction/evaluation flows that consume metadata-backed timestamps.
- **Boundary Guarantee**: Timestamp parsing remains behind the metadata port; domain logic receives metadata extraction results and does not depend on filesystem or metadata parsing libraries.
- **Node.js Version Baseline**: Node.js 22.13.1 or newer, matching the project baseline.
- **NestJS Version Baseline**: Latest active NestJS LTS major already used by the CLI application.
- **Dependency Selection Rationale**: Prefer the existing metadata dependency selected for image EXIF parsing; add no new third-party dependency unless the current parser cannot access the required EXIF `DateTime` field.
- **Existing Test Impact**: Existing metadata-null tests must remain valid for images that truly lack usable timestamp metadata.
- **New Test Coverage**: Add fixture-backed metadata adapter tests, predict integration coverage for the provided JPEG timestamp case, and evaluation coverage for timestamp comparison using metadata-derived time.
- **Coverage Plan**: Preserve CI coverage at `>= 95%`; pursue full coverage for changed timestamp parsing branches including success, missing metadata, malformed metadata, and precedence behavior.
- **Worktree Path**: `/Users/max/src/github.com/masim05/blood-preasure-tracker/tmp/001-add-cli-eval`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST extract a non-null `time` from JPEG metadata when the image contains a readable EXIF/TIFF `DateTime` value such as `2026:05:19 06:05:20`.
- **FR-002**: The CLI MUST normalize readable EXIF timestamps into `YYYY-MM-DD HH:mm:ss` for prediction and evaluation output.
- **FR-003**: The CLI MUST treat image metadata as the only allowed source for `time`; it MUST NOT use provider output, file modification time, or filename text as timestamp fallback.
- **FR-004**: The CLI MUST keep provider-backed extraction for `hand`, `systolic`, `diastolic`, and `pulse` separate from metadata-backed extraction for `time`.
- **FR-005**: The CLI MUST leave `time` as `null` when no supported embedded timestamp can be read.
- **FR-006**: The CLI MUST mark `time` as uncertain when timestamp metadata is missing, unreadable, malformed, or unsupported, unless the entire image record is already in an error state.
- **FR-007**: The metadata extraction behavior MUST use `DateTimeOriginal` first, `CreateDate` second, and generic `DateTime` third when multiple supported embedded timestamp fields are present.
- **FR-008**: Evaluation MUST compare ground-truth timestamps against the metadata-derived prediction timestamp after this fix.
- **FR-009**: Batch processing MUST continue when one image has missing or malformed timestamp metadata.
- **FR-010**: Error and uncertainty output MUST make timestamp extraction failures actionable without disclosing secrets or provider credentials.
- **FR-011**: Implementation MUST preserve hexagonal boundaries: domain depends on ports only, adapters depend on domain interfaces.
- **FR-012**: Each new bug-fix behavior MUST add new tests; existing tests MUST remain unchanged unless the specification documents why a change is required.
- **FR-013**: Development workflow MUST remain MCP-free and execute in a dedicated feature worktree under `tmp/`.
- **FR-014**: Runtime stack MUST target the latest active Node.js LTS and latest active NestJS LTS.
- **FR-015**: Dependency decisions MUST prefer official Node.js/NestJS modules and existing project dependencies; third-party additions require explicit justification.

### Key Entities *(include if feature involves data)*

- **Image Metadata Timestamp**: The embedded timestamp read from image metadata, including the source tag, raw value, normalized value, and parse status.
- **Prediction Record**: The JSONL prediction emitted by `predict`, containing metadata-derived `time`, provider-derived vitals, confidence, status, uncertainty, provider, model, and notes.
- **Evaluation Comparison**: The per-image comparison emitted by `eval`, including whether the metadata-derived predicted time matches the CSV ground-truth time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The provided JPEG case that reports `datetime=2026:05:19 06:05:20` emits a non-null `time` in 100% of prediction runs.
- **SC-002**: 100% of test fixtures with supported embedded EXIF timestamps produce the expected normalized timestamp in `YYYY-MM-DD HH:mm:ss` format.
- **SC-003**: 100% of test fixtures without usable embedded timestamps continue to emit `time: null` without using provider output, file modification time, or filename text.
- **SC-004**: Evaluation timestamp comparisons pass for fixture rows whose expected time matches the embedded image timestamp.
- **SC-005**: Changed timestamp extraction paths preserve project coverage at or above 95% in CI.

## Assumptions

- The timestamp shown by the `file` command as `datetime=2026:05:19 06:05:20` is available in embedded image metadata and should be considered a supported timestamp source.
- Timestamp output should preserve the local wall-clock value from metadata because the example metadata does not provide timezone context.
- This bug fix does not change provider selection, provider credentials, blood-pressure value recognition, CSV matching by filename stem, or JSONL record types.
