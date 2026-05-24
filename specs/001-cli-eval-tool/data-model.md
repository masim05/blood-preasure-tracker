# Data Model: CLI Eval Tool

## PredictedReading

**Purpose**: Represents the extracted reading for one image after provider normalization.

**Fields**:

- `imageId`: string; stable identifier derived from the input file name
- `imagePath`: string; original file path processed in the current run
- `time`: string | null; extracted monitor timestamp in normalized display form
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null; expected positive integer
- `diastolic`: number | null; expected positive integer less than systolic when both exist
- `pulse`: number | null; expected positive integer
- `confidence`: number | null; normalized to `0.0..1.0`
- `status`: `complete` | `partial` | `unreadable` | `error`
- `uncertainFields`: string[]; zero or more field names whose extracted values are uncertain
- `provider`: string; adapter key such as `openai`
- `model`: string; selected model name such as `gpt-5.4-mini`
- `rawNotes`: string | null; optional provider explanation used for debugging/trace output

**Validation rules**:

- `imageId` must equal the filename stem used for eval matching.
- `status=complete` requires `uncertainFields.length === 0`.
- `status=partial` requires at least one populated field and at least one uncertain field.
- `status=unreadable` requires no confident medical values.
- `confidence` must be null or between 0 and 1 inclusive.

**State transitions**:

- `complete` -> terminal successful extraction
- `partial` -> terminal extraction with one or more uncertain values
- `unreadable` -> terminal extraction with no reliable reading values
- `error` -> terminal failure caused by provider, parsing, or input processing errors

## GroundTruthRecord

**Purpose**: Represents one CSV row used as the expected answer for eval mode.

**Fields**:

- `imageId`: string; filename stem matching the input image
- `time`: string | null
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null

**Validation rules**:

- `imageId` is required and unique within a single CSV file.
- Numeric values must parse as integers when present.
- Duplicate `imageId` rows fail fast before evaluation begins.

## EvaluationComparison

**Purpose**: Represents the per-image result produced in eval mode.

**Fields**:

- `imageId`: string
- `prediction`: PredictedReading | null
- `groundTruth`: GroundTruthRecord | null
- `fieldResults`: map keyed by `time`, `hand`, `systolic`, `diastolic`, `pulse`
- `matchStatus`: `matched` | `mismatch` | `prediction-missing` | `ground-truth-missing` | `error`
- `notes`: string[]; human-readable reasons for mismatch/unmatched conditions

**Validation rules**:

- A comparison can exist even if one side is missing.
- `fieldResults` must include each tracked field for matched rows.

## EvaluationReport

**Purpose**: Aggregate summary emitted at the end of an eval run.

**Fields**:

- `totalImages`: number
- `totalGroundTruthRows`: number
- `matchedRecords`: number
- `mismatchedRecords`: number
- `predictionMissing`: number
- `groundTruthMissing`: number
- `errorCount`: number
- `provider`: string
- `model`: string
- `startedAt`: string
- `completedAt`: string

**Validation rules**:

- Aggregate counters must sum consistently with the emitted comparison records.

## ProviderModelCatalog

**Purpose**: Represents the statically configured models advertised by installed adapters.

**Fields**:

- `provider`: string
- `models`: string[]
- `defaultModel`: string
- `available`: boolean

**Validation rules**:

- `defaultModel` must exist in `models` when `available=true`.
- Adapters with no configured models are marked unavailable and surfaced in help/errors.
