# Research: Eval Accuracy Summary

## Decision: Compute Accuracy From Existing Comparison Results

**Rationale**: `EvaluationMatcher` already compares prediction and ground truth fields and records `match`, `mismatch`, or `missing` in `EvaluationComparison.fieldResults`. Reusing those outcomes keeps one source of truth for matching semantics and satisfies the requirement that the summary must not re-run predictions or reparse provider output.

**Alternatives considered**:

- Recompare prediction and ground truth fields inside the formatter: rejected because it duplicates domain matching logic.
- Derive accuracy from the existing JSONL text after writing it: rejected because parsing emitted output would be brittle and adapter-driven.

## Decision: Comparable Denominator Uses Matched Prediction/Ground Truth Pairs

**Rationale**: Accuracy is meaningful only when both prediction and reference rows exist. Comparisons with `prediction-missing` or `ground-truth-missing` are still reported in JSONL but are excluded from accuracy denominators. Within comparable rows, `missing` field results are counted as not correct.

**Alternatives considered**:

- Use all comparison rows as denominator: rejected because unmatched rows would mix dataset completeness with prediction accuracy.
- Use per-field denominators that exclude missing values: rejected because it would make field rows harder to compare and would hide missing predictions.

## Decision: Threshold Rows Mean At Least N Correct Target Parameters

**Rationale**: The clarified spec asks for counts for 2, 3, and 4 params correct, and prior clarification defines these as threshold rows. Threshold metrics answer how many readings meet minimum quality levels and are easier to scan than exact-bucket rows.

**Alternatives considered**:

- Exact counts for exactly 2, exactly 3, and exactly 4 correct: rejected because it does not match the clarified spec and is less useful for quality threshold checks.

## Decision: Extend Existing Output Writer With Text Output

**Rationale**: The current eval command writes JSONL through `OutputWriterPort` and `JsonlOutputWriter`. Adding a text-writing method keeps all stdout writes serialized through one port and adapter, avoids output interleaving, and allows human-readable text without JSON string quoting.

**Alternatives considered**:

- Write strings through the existing `write(record)` method: rejected because `JsonlOutputWriter` JSON-encodes records, producing quoted JSON strings instead of human-readable lines.
- Inject a second stdout writer into the use case: rejected because multiple writers to the same stream make ordering and backpressure more fragile.

## Decision: Deterministic Fixed-Width Formatting With One Decimal Place

**Rationale**: The summary requires vertical alignment and one-decimal percentages. Built-in string padding is sufficient for stable columns across labels, fractions, and percentages, with no new runtime dependency.

**Alternatives considered**:

- Add a table-formatting package: rejected because the output is small and official/built-in functionality is sufficient.
- Emit CSV or JSON for the summary: rejected by clarification; the output must be aligned human-readable text after existing JSONL records.