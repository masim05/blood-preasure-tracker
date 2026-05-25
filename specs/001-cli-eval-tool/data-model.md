# Data Model: CLI Eval Tool

## ImageMetadata

**Purpose**: Represents the timestamp-bearing metadata extracted from one image before monitor-value parsing.

**Fields**:

- `imageId`: string; stable identifier derived from the file name stem
- `imagePath`: string; original path processed in the current run
- `capturedAt`: string | null; normalized timestamp extracted from embedded image metadata
- `sourceTag`: string | null; metadata field used, such as `DateTimeOriginal`
- `parseErrors`: string[]; metadata parse failures or unsupported formats encountered while loading the image

**Validation rules**:

- `imageId` must equal the filename stem used by eval matching.
- `capturedAt` is null when no usable metadata exists.
- `sourceTag` must be null when `capturedAt` is null.

## OcrObservation

**Purpose**: Captures raw local OCR output before domain normalization.

**Fields**:

- `rawText`: string; OCR text extracted from the monitor image
- `confidence`: number | null; normalized overall OCR confidence
- `fieldCandidates`: map of tentative values for `hand`, `systolic`, `diastolic`, and `pulse`
- `warnings`: string[]; OCR anomalies such as low confidence, conflicting digits, or incomplete patterns

**Validation rules**:

- `confidence` must be null or between 0 and 1 inclusive.
- Candidate values are nullable until validated against range and pattern rules.

## PredictedReading

**Purpose**: Represents the normalized reading emitted for one image after metadata extraction and local OCR parsing.

**Fields**:

- `imageId`: string
- `imagePath`: string
- `time`: string | null; populated only from image metadata
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null
- `confidence`: number | null; derived from OCR confidence or deterministic validation confidence
- `status`: `complete` | `partial` | `unreadable` | `error`
- `uncertainFields`: string[]; zero or more field names from `time`, `hand`, `systolic`, `diastolic`, `pulse`
- `metadataSource`: string | null; copied from `ImageMetadata.sourceTag`
- `rawText`: string | null; optional retained OCR text for debugging and fixture analysis

**Validation rules**:

- `status=complete` requires `uncertainFields.length === 0`.
- `status=partial` requires at least one confident field and at least one uncertain field.
- `status=unreadable` requires no confident medical values.
- `time` must be null when `metadataSource` is null.

## GroundTruthRecord

**Purpose**: Represents one CSV row used as expected output for eval mode.

**Fields**:

- `imageId`: string
- `time`: string | null
- `hand`: `left` | `right` | `unknown` | null
- `systolic`: number | null
- `diastolic`: number | null
- `pulse`: number | null

**Validation rules**:

- `imageId` is required and unique within a CSV file.
- Numeric values must parse as integers when present.
- Duplicate normalized filename stems fail fast before evaluation begins.

## EvaluationComparison

**Purpose**: Represents the per-image result emitted during eval mode.

**Fields**:

- `imageId`: string
- `prediction`: PredictedReading | null
- `groundTruth`: GroundTruthRecord | null
- `fieldResults`: map keyed by `time`, `hand`, `systolic`, `diastolic`, `pulse`
- `matchStatus`: `matched` | `mismatch` | `prediction-missing` | `ground-truth-missing` | `error`
- `notes`: string[]; human-readable reasons for mismatch, missing metadata, or OCR uncertainty

**Validation rules**:

- Comparisons may exist with one side missing.
- `fieldResults` must be present for all tracked fields.

## EvaluationReport

**Purpose**: Aggregate summary emitted after the final comparison record in eval mode.

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

- Aggregate counters must reconcile with emitted comparison records.
- `metadataMissingCount` counts predictions where `time` is null because image metadata was unavailable or invalid.

## LocalExtractionConfiguration

**Purpose**: Represents local runtime settings that influence input paths and parsing thresholds.

**Fields**:

- `inputDirectory`: string
- `evaluationCsvPath`: string
- `ocrConfidenceThreshold`: number
- `metadataTags`: string[]; ordered list of metadata tags accepted as timestamp sources

**Validation rules**:

- `ocrConfidenceThreshold` must be between 0 and 1 inclusive.
- `metadataTags` must preserve deterministic lookup order.
