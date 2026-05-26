# CLI Contract: CLI Eval Tool

## Command Surface

### `npm run cli -- predict`

Processes local images from the configured input directory and emits one JSONL prediction record per image.

**Options**:

- `--input <path>`: override input image directory; defaults to `data/eval`
- `--help`: show usage, default paths, `.env` configuration behavior, and metadata timestamp rules

### `npm run cli -- eval`

Processes local images, loads a ground-truth CSV, and emits JSONL comparison records followed by one summary JSONL record.

**Options**:

- `--input <path>`: override input image directory; defaults to `data/eval`
- `--csv <path>`: override evaluation CSV path; defaults to `data/eval/a.csv`
- `--help`: show usage, default paths, `.env` configuration behavior, and metadata timestamp rules

## Environment Contract

The CLI loads local configuration from `.env` when present.

- `CLI_INPUT_DIR`: optional fallback for `--input`
- `CLI_EVAL_CSV`: optional fallback for `--csv`
- `CLI_OCR_CONFIDENCE_THRESHOLD`: optional local OCR threshold between `0` and `1`

CLI arguments take precedence over `.env` values.

## Predict Output Record (JSONL)

Each output line is a JSON object with this shape:

```json
{
  "type": "prediction",
  "imageId": "img001",
  "imagePath": "data/eval/img001.jpg",
  "time": "2026-05-19 06:05:20",
  "hand": "right",
  "systolic": 121,
  "diastolic": 75,
  "pulse": 75,
  "confidence": 0.98,
  "status": "complete",
  "uncertainFields": []
}
```

**Rules**:

- `time` comes only from image metadata.
- If metadata is missing or invalid, `time` is `null` and `uncertainFields` includes `time` unless the whole reading is unreadable.
- `status` is one of `complete`, `partial`, `unreadable`, or `error`.
- `uncertainFields` contains field names only from `time`, `hand`, `systolic`, `diastolic`, and `pulse`.

## Eval Output Records (JSONL)

Per-image comparison records use this shape:

```json
{
  "type": "comparison",
  "imageId": "img001",
  "matchStatus": "matched",
  "prediction": { "status": "complete" },
  "groundTruth": { "imageId": "img001" },
  "fieldResults": {
    "time": "match",
    "hand": "match",
    "systolic": "match",
    "diastolic": "match",
    "pulse": "match"
  },
  "notes": []
}
```

The final line of an eval run is a summary record:

```json
{
  "type": "summary",
  "totalImages": 10,
  "totalGroundTruthRows": 10,
  "matchedRecords": 8,
  "mismatchedRecords": 1,
  "predictionMissing": 0,
  "groundTruthMissing": 1,
  "errorCount": 0
}
```

## Matching Contract

- Eval mode matches images to CSV rows by filename stem.
- CSV rows must expose a unique `imageId` column representing that stem.
- Duplicate stems in either source are validation failures.

## Help Output Contract

Help output must include:

- command usage for `predict` and `eval`
- default directories and CSV path
- `.env`-backed local configuration behavior
- the fact that `time` is extracted from image metadata
- OpenAI provider credential and model selection behavior

> Note: This `001` contract is historical. The implemented CLI behavior is the provider-backed workflow refined in later specs, with `OPENAI_API_KEY` required for the default OpenAI provider and no `metadataMissingCount` summary field.
