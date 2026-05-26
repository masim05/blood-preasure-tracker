# Data Model: Eval Accuracy Summary

## AccuracySummary

Represents eval-wide correctness metrics for target prediction parameters.

**Fields**:

- `comparableTotal`: number of comparison records with both prediction and ground truth present
- `fields`: ordered list of `FieldAccuracyMetric` for `hand`, `systolic`, `diastolic`, `pulse`
- `thresholds`: ordered list of `ParameterThresholdMetric` for thresholds 2, 3, and 4

**Validation rules**:

- `comparableTotal` must be zero or greater.
- Field metrics must appear in the order `hand`, `systolic`, `diastolic`, `pulse`.
- Threshold metrics must appear in ascending threshold order: 2, 3, 4.
- Percentages are derived values and must not be stored independently from counts in a way that can drift.

## FieldAccuracyMetric

Represents one target parameter's correctness over comparable records.

**Fields**:

- `field`: one of `hand`, `systolic`, `diastolic`, `pulse`
- `correct`: number of comparable records where the field result is `match`
- `total`: comparable denominator used for the row
- `ratio`: derived percentage as `correct / total * 100`, or `0` when total is zero

**Validation rules**:

- `correct` must be zero or greater.
- `total` must be zero or greater.
- `correct` must not exceed `total`.
- `missing` and `mismatch` field results are not correct.

## ParameterThresholdMetric

Represents how many comparable readings have at least a threshold number of correct target parameters.

**Fields**:

- `threshold`: one of `2`, `3`, `4`
- `correct`: number of comparable records where at least `threshold` target parameters are correct
- `total`: comparable denominator used for the row
- `ratio`: derived percentage as `correct / total * 100`, or `0` when total is zero

**Validation rules**:

- `threshold` must be between 2 and 4 inclusive.
- `correct` must be zero or greater.
- `correct` must not exceed `total`.
- Correct target parameters are counted only from `hand`, `systolic`, `diastolic`, and `pulse`; `time` is excluded.

## ComparableEvaluationRecord

Represents an `EvaluationComparison` that participates in accuracy denominators.

**Fields**:

- `imageId`: normalized image identifier
- `fieldResults`: existing field comparison results

**Validation rules**:

- Source comparison must have both a prediction and a ground truth row.
- Existing unmatched comparison records remain in JSONL output but are excluded from this model.

## AlignedAccuracyOutput

Represents the final human-readable text block appended after JSONL eval output.

**Fields**:

- `lines`: ordered text lines for field metrics and threshold metrics

**Validation rules**:

- Count fractions must align to the same starting column.
- Percentages must align to the same starting column.
- Percentages must be formatted with one decimal place.
- Zero comparable totals must render as `0/0` and `0.0%`.