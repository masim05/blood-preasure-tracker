# Data Model: Fix Time Extraction

## ImageMetadataTimestamp

**Purpose**: Represents one supported embedded timestamp candidate discovered in image metadata.

**Fields**:

- `sourceTag`: `DateTimeOriginal` | `CreateDate` | `DateTime`; metadata tag that supplied the value
- `rawValue`: string; original metadata value, for example `2026:05:19 06:05:20`
- `normalizedValue`: string; normalized `YYYY-MM-DD HH:mm:ss` value

**Validation rules**:

- `sourceTag` must be one of the supported tags.
- `rawValue` must parse as a complete date and time.
- `normalizedValue` must use `YYYY-MM-DD HH:mm:ss` and preserve the local wall-clock value from metadata.

## TimestampExtractionResult

**Purpose**: Represents metadata timestamp extraction for one image before it is merged with provider-derived vitals.

**Fields**:

- `imageId`: string; filename-stem identifier used throughout the CLI
- `imagePath`: string; path reported in JSONL output
- `time`: string | null; normalized metadata timestamp or null
- `sourceTag`: `DateTimeOriginal` | `CreateDate` | `DateTime` | null
- `rawValue`: string | null; metadata value used to derive `time`
- `issues`: string[]; missing, malformed, unreadable, or unsupported timestamp notes

**Validation rules**:

- `imageId` and `imagePath` are required.
- `sourceTag` and `rawValue` must be non-null when `time` is non-null.
- `sourceTag` and `rawValue` must be null when no supported timestamp is extracted.
- Multiple valid candidates must be resolved using `DateTimeOriginal`, then `CreateDate`, then `DateTime`.

## ProviderVitalsResult

**Purpose**: Represents provider-backed extraction for blood-pressure values only.

**Fields**:

- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null
- `confidence`: number | null
- `uncertainFields`: string[]
- `rawNotes`: string | null

**Validation rules**:

- `time` is intentionally absent.
- `uncertainFields` from the provider may only describe provider-owned fields: `hand`, `systolic`, `diastolic`, and `pulse`.
- `confidence` is null or between 0 and 1 inclusive.

## PredictionRecord

**Purpose**: Final JSONL prediction record emitted by `predict` and reused by `eval`.

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
- `uncertainFields`: string[]
- `provider`: string
- `model`: string
- `rawNotes`: string | null

**Validation rules**:

- `time` is copied only from `TimestampExtractionResult.time`.
- `uncertainFields` includes `time` when timestamp extraction returns null for a non-error record.
- `status=complete` requires no uncertain fields.
- `status=partial` requires at least one uncertain field.

## EvaluationTimestampComparison

**Purpose**: Represents timestamp comparison behavior inside `eval`.

**Fields**:

- `imageId`: string
- `predictedTime`: string | null
- `expectedTime`: string | null
- `matches`: boolean
- `notes`: string[]

**Validation rules**:

- `predictedTime` is the metadata-derived prediction timestamp.
- Null predicted timestamps never match non-null expected timestamps.
- Missing metadata is reported as metadata-missing, not as provider failure.
