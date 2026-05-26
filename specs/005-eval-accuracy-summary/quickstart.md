# Quickstart: Eval Accuracy Summary

## Run Eval

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

## Expected Output Shape

Eval continues to emit JSONL comparison records and a JSONL summary record first.

After the JSONL summary, eval appends aligned text lines similar to:

```text
hand:             27/31 ( 87.1%)
systolic:         31/31 (100.0%)
diastolic:        30/31 ( 96.8%)
pulse:            31/31 (100.0%)
2 params correct: 31/31 (100.0%)
3 params correct: 30/31 ( 96.8%)
4 params correct: 27/31 ( 87.1%)
```

## Check Zero Comparable Records

Run eval with an empty input directory and an empty reference CSV containing only required headers. The command should not crash, and each summary line should show `0/0` and `0.0%`.

## Validate Locally

```bash
npm run build
npm test
npm run test:coverage
npm run lint
```

## Acceptance Checks

- Existing `comparison` JSONL records are still emitted.
- Existing `summary` JSONL record is still emitted before the text block.
- Accuracy text includes `hand`, `systolic`, `diastolic`, `pulse`.
- Accuracy text includes `2 params correct`, `3 params correct`, and `4 params correct`.
- Fractions and percentages align vertically.
- Percentages use one decimal place.