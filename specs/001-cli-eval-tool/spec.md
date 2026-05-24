# Feature Specification: CLI Eval Tool

**Feature Branch**: `[001-add-cli-eval]`

**Created**: 2026-05-24

**Status**: Draft

**Input**: User description: "implement a simple CLI eval tool.
it will take several images and Extract hand side and blood pressure monitor values (eg, `{
    \"time\":\"2026-05-20 14:01:23 GMT+7\",
    \"hand\": \"right\",
    \"systolic\": 127,
    \"diastolic\": 72,
    \"pulse\": 69,
    \"confidence\": 0.95
}`). If unsure, return clear indication of that.
the images will be in data/eval (should be configurable) folder. the tool should work in two modes:

- eval (check against data/eval/a.csv): `npm run cli -- eval`
- predict (predict values): `npm run cli -- predict`

 it should use openAI API, gpt-5.4-mini model by default.
 it should be possible to pick model to use.
 it should be possile to use another LLM API instead of openAI API, utilise port-adapter pattern for that.
 help message should show available models."

## Clarifications

### Session 2026-05-24

- Q: How should eval match each image to a CSV row? → A: Match by image filename stem.
- Q: How should the CLI represent uncertain extracted values? → A: Return the normal fields plus `status` and `uncertain_fields`.
- Q: What should help show as available models? → A: Show statically configured models exposed by installed adapters.
- Q: What should the CLI output by default for predict and eval? → A: Newline-delimited JSON records (JSONL).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Predict Blood Pressure Readings (Priority: P1)

As an evaluator, I can point the CLI at a folder of blood pressure monitor images and receive structured predictions for timestamp, hand side, systolic, diastolic, pulse, and confidence so I can review extracted readings quickly.

**Why this priority**: This is the core product value. Without prediction from images, the tool does not exist.

**Independent Test**: Can be fully tested by placing sample images in the configured input folder, running `npm run cli -- predict`, and verifying that each image produces a structured result with extracted values or an explicit uncertainty indication.

**Acceptance Scenarios**:

1. **Given** a configured image folder containing supported blood pressure monitor images, **When** the user runs predict mode, **Then** the CLI returns one structured prediction per image with time, hand, systolic, diastolic, pulse, confidence, and image identity.
2. **Given** multiple images are processed in one run, **When** the user runs predict mode, **Then** the CLI emits one JSONL record per image in processing order.
3. **Given** an image where one or more values cannot be read reliably, **When** the user runs predict mode, **Then** the CLI preserves any confident values, sets `status` accordingly, and lists the affected fields in `uncertain_fields` instead of presenting unsupported values as certain.
4. **Given** a user-selected model/provider option, **When** the user runs predict mode, **Then** the CLI uses that selection and reports failures clearly if the provider or model is unavailable.

---

### User Story 2 - Evaluate Predictions Against Ground Truth (Priority: P2)

As an evaluator, I can run the CLI in evaluation mode against images and `data/eval/a.csv` so I can compare extracted results to known answers and assess extraction quality.

**Why this priority**: Once prediction exists, evaluation is the next highest-value capability because it allows measuring whether the extractor is useful.

**Independent Test**: Can be fully tested by running `npm run cli -- eval` against a folder of images and a matching CSV file, then confirming the CLI outputs per-image comparisons and aggregate evaluation results.

**Acceptance Scenarios**:

1. **Given** a configured image folder and a matching evaluation CSV, **When** the user runs eval mode, **Then** the CLI compares predicted fields against expected fields and reports matches, mismatches, and missing values.
2. **Given** missing ground-truth rows or unmatched image files, **When** the user runs eval mode, **Then** the CLI reports which items were skipped or unmatched without terminating the full run unexpectedly.
3. **Given** image files and CSV rows share the same filename stem, **When** the user runs eval mode, **Then** the CLI matches them deterministically using that stem rather than row order.
4. **Given** an eval run completes, **When** results are emitted, **Then** the CLI outputs JSONL records for per-image comparisons and a final JSONL summary record for aggregate totals.

---

### User Story 3 - Configure Provider, Model, and Help Output (Priority: P3)

As an operator, I can choose the LLM provider, choose a supported model, and inspect help output that lists available models so I can control cost, compatibility, and runtime behavior.

**Why this priority**: This improves usability and adaptability, but it depends on prediction and evaluation behavior already existing.

**Independent Test**: Can be fully tested by running the CLI help output, selecting the default model, selecting a non-default supported model, and confirming that provider/model configuration is reflected in execution.

**Acceptance Scenarios**:

1. **Given** the CLI is installed, **When** the user runs the help command, **Then** the help text lists supported modes, configurable input path, provider selection, default model, and the statically configured models exposed by installed adapters.
2. **Given** more than one LLM adapter is available, **When** the user selects a non-default provider and model, **Then** the CLI routes the request through the selected adapter without changing the CLI contract.

### Edge Cases

- What happens when the configured image directory does not exist, is empty, or contains unsupported file types?
- How does the system handle an evaluation CSV row that has no matching image or an image that has no matching CSV row?
- What happens when two images or two CSV rows resolve to the same filename stem?
- What happens when the provider API rejects the request, times out, or returns malformed structured output?
- How does the system indicate partial uncertainty when some fields are readable and others are not?
- What happens when two providers expose different model names or capabilities?
- What happens when a provider adapter is installed but has no configured models?

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: LLM inference port, image input port, evaluation dataset port, and result rendering/reporting port.
- **Adapters Affected**: OpenAI adapter, future third-party LLM adapters, filesystem adapter for image/CSV loading, and CLI adapter for command parsing/output.
- **Boundary Guarantee**: Extraction and evaluation rules remain in the domain layer; provider APIs, filesystem access, and CLI concerns stay behind adapters connected through ports.
- **Node.js Version Baseline**: Latest active LTS release of Node.js.
- **NestJS Version Baseline**: Latest active LTS major of NestJS for any framework-backed application wiring used by the project.
- **Dependency Selection Rationale**: Official Node.js modules and official vendor SDKs are preferred first; additional third-party libraries require a documented reason.
- **Existing Test Impact**: No changes to pre-existing tests are expected because this feature adds a new CLI capability.
- **New Test Coverage**: Unit tests for extraction orchestration, uncertainty handling, provider/model selection, evaluation scoring, CSV/image matching, and CLI argument validation; adapter tests for OpenAI integration boundaries; CLI behavior tests for help, predict, and eval commands.
- **Coverage Plan**: New modules are added with unit tests by default, CLI behavior is covered by focused integration tests, and changed areas target 100% coverage while preserving repository-wide CI coverage at or above 95%.
- **Worktree Path**: `tmp/001-add-cli-eval`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a CLI command that supports `predict` and `eval` modes.
- **FR-002**: In `predict` mode, the system MUST process multiple images from a configurable input directory and return one structured result per image.
- **FR-003**: Each structured result MUST include image identity, extracted time, hand side, systolic, diastolic, pulse, and confidence when the values can be determined.
- **FR-004**: When any extracted value is uncertain, the system MUST return a clear uncertainty indication using a top-level `status` field and an `uncertain_fields` list instead of implying certainty.
- **FR-005**: The system MUST default to the OpenAI API using the `gpt-5.4-mini` model unless the user selects a different configured provider or model.
- **FR-006**: The system MUST allow users to choose the model used for extraction.
- **FR-007**: The system MUST allow an LLM provider other than OpenAI to be introduced without changing the CLI contract, using ports and adapters.
- **FR-008**: In `eval` mode, the system MUST compare predictions against a configurable ground-truth CSV file, defaulting to `data/eval/a.csv`.
- **FR-008a**: In `eval` mode, the system MUST match each image to a ground-truth CSV row using the image filename stem as the deterministic key.
- **FR-009**: The system MUST report evaluation results that identify correct matches, mismatches, missing values, and unmatched inputs.
- **FR-009a**: The default output format for both `predict` and `eval` modes MUST be newline-delimited JSON records (JSONL).
- **FR-010**: The CLI help output MUST list supported modes, configuration options, default provider/model behavior, and available models.
- **FR-010a**: Available models in help output MUST come from the statically configured model lists exposed by installed provider adapters, not from live provider discovery.
- **FR-011**: The system MUST validate required configuration such as provider credentials, input directory, and evaluation CSV path before processing begins.
- **FR-012**: The system MUST surface provider, parsing, and file-matching failures with actionable error messages while continuing to process unaffected inputs where possible.
- **FR-013**: Implementation MUST preserve hexagonal boundaries: domain depends on ports only, adapters depend on domain interfaces.
- **FR-014**: Each new feature MUST add new tests; existing tests MUST remain unchanged unless the specification documents why a change is required.
- **FR-015**: Development workflow MUST remain MCP-free and execute in a dedicated feature worktree under `tmp/`.
- **FR-016**: Runtime stack MUST target the latest active Node.js LTS and latest active NestJS LTS.
- **FR-017**: Dependency decisions MUST prefer official Node.js/NestJS modules; third-party additions require explicit justification.

### Key Entities *(include if feature involves data)*

- **Image Input**: A source image to be processed, identified by file path or file name and associated with one predicted result.
- **Predicted Reading**: The structured extraction result for one image, containing timestamp, hand side, systolic, diastolic, pulse, confidence, a `status` field, and an `uncertain_fields` list.
- **Ground Truth Record**: One evaluation CSV row containing the expected values for a specific image.
- **Evaluation Match Key**: The filename stem shared between an image input and a ground-truth CSV row.
- **Evaluation Report**: A summary of per-image comparisons and aggregate correctness/mismatch counts for a full eval run.
- **LLM Provider Configuration**: Runtime selection data describing provider name, model name, credentials source, and adapter availability.
- **Provider Model Catalog**: The statically configured list of models that an installed provider adapter exposes to the CLI for selection and help output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can run `predict` against a configured folder of sample images and receive structured results for 100% of processable files in a single command execution.
- **SC-002**: Users can run `eval` against the default dataset and receive a report that accounts for 100% of images and CSV rows as matched, unmatched, or skipped.
- **SC-003**: In user validation with the initial evaluation dataset, at least 90% of clearly readable images produce either a correct value set or an explicit uncertainty indication via `status` and `uncertain_fields` rather than a silent failure.
- **SC-004**: Users can switch from the default model to another supported model through CLI configuration without changing command shape or code paths outside provider configuration.
- **SC-005**: Help output exposes all supported modes and available models in one command, allowing a first-time user to start a run in under 2 minutes.

## Assumptions

- The evaluation dataset contains images of blood pressure monitors where the displayed values are visually legible in at least a meaningful subset of samples.
- The ground-truth CSV includes enough identifying information to match each row to an image deterministically, such as file name or equivalent image identifier.
- Provider credentials are supplied through standard runtime configuration outside the spec scope.
- Predict and eval are local CLI workflows and do not require a persistent server.
- A single result format is acceptable across providers as long as provider-specific behavior stays behind adapters.
