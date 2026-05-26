# Data Model: Provider Metadata Extraction

## ImageMetadata

**Purpose**: Represents metadata extracted from one image file before prediction output is assembled.

**Fields**:

- `imageId`: string; filename-stem identifier for the image
- `imagePath`: string; original path processed by the CLI
- `time`: string | null; timestamp extracted from embedded image metadata
- `sourceTag`: string | null; metadata field used to derive `time`
- `issues`: string[]; metadata parse failures or unsupported-format notes

**Validation rules**:

- `imageId` must match the filename stem used for eval matching.
- `sourceTag` must be null when `time` is null.
- `time` may be null when metadata is absent, malformed, or unsupported.

## ProviderExtractedVitals

**Purpose**: Represents the provider-backed extraction result for blood pressure values only.

**Fields**:

- `provider`: string; provider identifier such as `openai`
- `model`: string; selected model name
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null
- `confidence`: number | null
- `uncertainFields`: string[]; affected value fields reported as uncertain
- `rawNotes`: string | null; adapter-provided notes for debugging or traceability

**Validation rules**:

- `confidence` is null or between 0 and 1 inclusive.
- `uncertainFields` may only contain `hand`, `systolic`, `diastolic`, or `pulse` at this stage.
- `time` is intentionally absent from this entity.

## ExtractedReading

**Purpose**: Represents the final structured result emitted for one image in `predict` mode and used as the prediction side in `eval` mode.

**Fields**:

- `imageId`: string
- `imagePath`: string
- `time`: string | null
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null
- `confidence`: number | null
- `status`: `complete` | `partial` | `unreadable` | `error`
- `uncertainFields`: string[]; zero or more field names from `time`, `hand`, `systolic`, `diastolic`, `pulse`
- `provider`: string
- `model`: string
- `metadataSource`: string | null; copied from `ImageMetadata.sourceTag`
- `rawNotes`: string | null

**Validation rules**:

- `status=complete` requires `uncertainFields.length === 0`.
- `status=partial` requires at least one uncertain field.
- `status=unreadable` cannot include medical values.
- `time` must be null when `metadataSource` is null.

## GroundTruthRecord

**Purpose**: Represents one CSV row used during `eval` mode.

**Fields**:

- `imageId`: string
- `time`: string | null
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null

**Validation rules**:

- `imageId` is required and unique within a dataset.
- Numeric values must parse as integers when present.
- Duplicate normalized filename stems fail before comparison begins.

## EvaluationComparison

**Purpose**: Represents one per-image comparison emitted during `eval` mode.

**Fields**:

- `imageId`: string
- `prediction`: ExtractedReading | null
- `groundTruth`: GroundTruthRecord | null
- `fieldResults`: map keyed by `time`, `hand`, `systolic`, `diastolic`, `pulse`
- `matchStatus`: `matched` | `mismatch` | `prediction-missing` | `ground-truth-missing` | `error`
- `notes`: string[]

**Validation rules**:

- Comparisons may exist with one side missing.
- `fieldResults` must cover all tracked fields.

## EvaluationReport

**Purpose**: Aggregate summary emitted after the final comparison record.

**Fields**:

- `totalImages`: number
- `totalGroundTruthRows`: number
- `matchedRecords`: number
- `mismatchedRecords`: number
- `predictionMissing`: number
- `groundTruthMissing`: number
- `errorCount`: number
- `metadataMissingCount`: number
- `startedAt`: string
- `completedAt`: string

**Validation rules**:

- Aggregate counters must reconcile with comparison records.
- `metadataMissingCount` counts predictions where `time` is null because metadata was unavailable or invalid.

## ExtractionConfiguration

**Purpose**: Represents runtime configuration for provider-backed extraction and metadata handling.

**Fields**:

- `command`: `predict` | `eval`
- `inputDirectory`: string
- `evaluationCsvPath`: string
- `provider`: string
- `model`: string
- `openAiApiKey`: string | null
- `metadataTags`: string[]; ordered list of accepted timestamp fields

**Validation rules**:

- `evaluationCsvPath` is required for `eval` mode and optional for `predict` mode.
- Provider credentials must satisfy the selected provider.
- `metadataTags` preserve deterministic lookup order.
