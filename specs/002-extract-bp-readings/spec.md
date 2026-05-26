# Feature Specification: Provider Metadata Extraction

**Feature Branch**: `[002-extract-bp-readings]`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: Blood pressure values (`hand`, `systolic`, `diastolic`, `pulse`) may be extracted using OpenAI or similar vision APIs behind ports and adapters; `time` must be extracted from image metadata only; the system must not use LLM or vision model output to infer `time`.

## Clarifications

### Session 2026-05-25

- Q: Should the CLI keep both `predict` and `eval` modes? → A: Yes, keep both `predict` and `eval` modes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Predict Readings from Images (Priority: P1)

As an evaluator, I can run the CLI in `predict` mode against blood-pressure monitor images and receive structured readings where blood pressure values come from a vision provider and the timestamp comes from image metadata so I can review results confidently.

**Why this priority**: This is the core feature behavior. Without a valid split between provider-based value extraction and metadata-only time extraction, the feature does not deliver its intended result.

**Independent Test**: Can be fully tested by running `predict` against fixture images with embedded metadata and verifying that `hand`, `systolic`, `diastolic`, and `pulse` may come from the configured vision provider while `time` always matches image metadata when present.

**Acceptance Scenarios**:

1. **Given** a supported image with usable metadata and readable monitor values, **When** the user runs `predict`, **Then** the system returns `hand`, `systolic`, `diastolic`, and `pulse` from the configured vision extraction flow and returns `time` from image metadata.
2. **Given** multiple supported images are processed in one run, **When** the user runs `predict`, **Then** the system returns one structured result per image without substituting model output for missing metadata timestamps.
3. **Given** an image lacks usable timestamp metadata, **When** the user runs `predict`, **Then** the system leaves `time` unset or marked uncertain rather than inferring it from vision model output.

---

### User Story 2 - Evaluate Predictions Against Ground Truth (Priority: P2)

As an evaluator, I can run the CLI in `eval` mode against images and a ground-truth CSV so I can compare provider-backed predictions with expected values and measure extraction quality.

**Why this priority**: Evaluation is the next highest-value workflow after prediction because it makes the extracted results measurable and reviewable.

**Independent Test**: Can be fully tested by running `eval` against a fixture image set and matching CSV, then confirming per-image comparisons, aggregate results, and continued processing when individual items fail.

**Acceptance Scenarios**:

1. **Given** a configured image set and matching CSV dataset, **When** the user runs `eval`, **Then** the system compares predicted values against expected values and emits per-image comparison results plus aggregate totals.
2. **Given** metadata extraction fails for one image in a batch, **When** the user runs `eval`, **Then** unaffected images still produce comparison results and the failed item includes an actionable error or uncertainty indication for `time`.
3. **Given** the configured vision provider fails for one image or request, **When** the user runs `eval`, **Then** unaffected images are still processed and the failed item is reported without inventing values.
4. **Given** an image or CSV row has no match, **When** the user runs `eval`, **Then** the system reports the unmatched item without terminating the full run unexpectedly.

---

### User Story 3 - Configure Provider Use and Metadata Rules (Priority: P3)

As an operator, I can inspect help output and configuration expectations so I can choose a supported provider/model for value extraction while understanding that timestamps are always metadata-derived.

**Why this priority**: This improves usability and reduces setup mistakes, but it depends on the extraction behavior already being defined.

**Independent Test**: Can be fully tested by reviewing help output and configuration behavior to confirm that provider/model options are documented for value extraction and that metadata-only timestamp handling is explained clearly.

**Acceptance Scenarios**:

1. **Given** the CLI is installed, **When** the user runs the help command, **Then** the help output lists supported modes, provider/model configuration for value extraction, input path configuration, evaluation CSV configuration, and the rule that `time` comes only from image metadata.
2. **Given** provider credentials and model configuration are valid, **When** the user starts an extraction run, **Then** the system accepts the provider configuration for monitor-value extraction and still forbids model-derived timestamps.

### Edge Cases

- What happens when an image is readable enough for blood pressure values but contains no usable timestamp metadata?
- What happens when the configured input directory contains unsupported file types or corrupt images?
- What happens when an image file has no matching CSV row or a CSV row has no matching image during `eval` mode?
- How does the system respond when provider credentials are missing or invalid before processing begins?
- What happens when the provider returns partial or low-confidence output for only some of the requested fields?
- How does the system handle malformed or unsupported metadata timestamp formats?

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Vision extraction provider port, image metadata extraction port, image input port, evaluation dataset port, result rendering/reporting port, and configuration port.
- **Adapters Affected**: Vision API adapter, filesystem metadata adapter, filesystem image input adapter, filesystem CSV dataset adapter, and CLI adapter for command parsing and output.
- **Boundary Guarantee**: Domain logic remains responsible for normalization, uncertainty, and timestamp policy, while provider calls, metadata access, filesystem access, and CLI concerns stay behind adapters connected through ports.
- **Node.js Version Baseline**: Latest active LTS release of Node.js.
- **NestJS Version Baseline**: Latest active LTS major of NestJS.
- **Dependency Selection Rationale**: Official Node.js and NestJS modules are preferred first; metadata parsing or provider SDK dependencies require brief justification when built-ins are insufficient.
- **Existing Test Impact**: Existing tests may need targeted updates only where they assume timestamps or value extraction come from the same source.
- **New Test Coverage**: Unit tests for provider-backed extraction orchestration, metadata timestamp extraction, timestamp policy enforcement, uncertainty handling, evaluation matching, configuration validation, and CLI help behavior; integration tests for `predict`, `eval`, and mixed-success batch execution.
- **Coverage Plan**: New modules add unit tests by default, CLI behavior is covered by focused integration tests, and changed areas target 100% coverage while preserving repository-wide CI coverage at or above 95%.
- **Worktree Path**: `tmp/001-add-cli-eval`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide both `predict` and `eval` CLI modes.
- **FR-002**: The system MUST support extraction of `hand`, `systolic`, `diastolic`, and `pulse` using OpenAI or similar vision APIs behind ports and adapters.
- **FR-003**: The system MUST extract `time` from image metadata only.
- **FR-004**: The system MUST NOT use LLM or vision model output to infer `time`.
- **FR-005**: In `predict` mode, the system MUST return one structured result per processed image containing image identity, extracted values, extracted time when available, and a confidence or uncertainty indication.
- **FR-006**: In `eval` mode, the system MUST compare predictions against a configurable ground-truth CSV file and report per-image comparisons plus aggregate totals.
- **FR-007**: When any extracted value is uncertain, the system MUST expose that uncertainty explicitly using a status field and a list of affected fields.
- **FR-008**: The system MUST validate required configuration such as input paths, evaluation CSV path, provider credentials, provider/model settings, and metadata prerequisites before processing begins.
- **FR-009**: The system MUST surface metadata, provider, parsing, and matching failures with actionable messages while continuing to process unaffected inputs where possible.
- **FR-010**: The CLI help output MUST describe both modes, provider/model configuration for value extraction, and MUST state that timestamps come only from image metadata.
- **FR-011**: Implementation MUST preserve hexagonal boundaries: domain depends on ports only, adapters depend on domain interfaces.
- **FR-012**: Each new feature MUST add new tests; existing tests MUST remain unchanged unless the specification documents why a change is required.
- **FR-013**: Development workflow MUST remain MCP-free and execute in a dedicated feature worktree under `tmp/`.
- **FR-014**: Runtime stack MUST target the latest active Node.js LTS and latest active NestJS LTS.
- **FR-015**: Dependency decisions MUST prefer official Node.js/NestJS modules; third-party additions require explicit justification.

### Key Entities *(include if feature involves data)*

- **Image Metadata**: Embedded metadata associated with an image file, used as the only authoritative source of extracted timestamp information.
- **Extracted Reading**: The structured result for one processed image, containing image identity, timestamp, hand side, systolic, diastolic, pulse, confidence, status, and uncertain field markers.
- **Ground Truth Record**: A CSV-backed expected result for one image, used during `eval` mode to compare predicted values with expected values.
- **Extraction Configuration**: Runtime selection data describing input paths, provider credentials, provider/model settings, and metadata-handling rules.
- **Extraction Issue**: A user-visible problem associated with metadata parsing, provider execution, or field uncertainty for a single processed image.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can run `predict` against a representative batch of supported images and receive one structured result for 100% of processable files in a single run.
- **SC-002**: Users can run `eval` against a representative image set and CSV dataset and receive comparison results that account for 100% of processed images and ground-truth rows as matched, unmatched, or failed.
- **SC-003**: For images with usable embedded timestamp metadata, 100% of emitted `time` values come from metadata rather than model output.
- **SC-004**: In validation with the initial fixture set, at least 90% of clearly readable images produce either a correct value set or an explicit uncertainty indication rather than a silent failure.
- **SC-005**: Help output enables a first-time operator to configure provider-based value extraction, `predict`/`eval` mode usage, and metadata-only timestamp behavior in under 2 minutes.

## Assumptions

- Supported runs process local image files supplied by an operator from a configured input directory.
- Vision-provider credentials and model access are available for environments that perform value extraction.
- Image files may contain embedded metadata that can be used as the authoritative source for timestamps.
- If embedded metadata is absent or malformed, the system leaves `time` unset or uncertain rather than deriving it from model output.
- The feature is delivered as a CLI-oriented workflow and does not require a persistent server.
