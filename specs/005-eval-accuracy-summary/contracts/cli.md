# CLI Contract: Eval Accuracy Summary

## Command

```bash
npm run cli -- eval --input <input-directory> --csv <reference-csv>
```

## Existing Output Preserved

The command continues to emit one JSONL `comparison` record per comparison, followed by one JSONL `summary` record.

Existing JSONL record fields, names, and order semantics are not removed or renamed by this feature.

## New Output

After the JSONL `summary` record, eval appends aligned human-readable accuracy lines.

Example shape:

```text
hand:             27/31 ( 87.1%)
systolic:         31/31 (100.0%)
diastolic:        30/31 ( 96.8%)
pulse:            31/31 (100.0%)
2 params correct: 31/31 (100.0%)
3 params correct: 30/31 ( 96.8%)
4 params correct: 27/31 ( 87.1%)
```

The exact counts depend on the eval comparison results. The contract requires the fraction column and percentage column to align across all rows.

## Metric Semantics

- Target fields: `hand`, `systolic`, `diastolic`, `pulse`.
- Excluded field: `time`.
- Comparable denominator: comparison records with both prediction and ground truth present.
- Correct field result: `match` only.
- Incorrect field results: `mismatch` and `missing`.
- Threshold rows: records with at least 2, at least 3, and at least 4 target fields correct.
- Percentage format: one decimal place.
- Zero comparable records: render each row as `0/0 (0.0%)` with alignment preserved.

## Ordering

The output order is:

1. Existing JSONL `comparison` records
2. Existing JSONL `summary` record
3. New aligned human-readable accuracy lines

## Compatibility

Consumers that parse only JSONL lines can continue reading records until the `summary` record. Consumers that need strict JSONL-only output are not introduced by this feature; the clarified requirement is human-readable text appended after JSONL.