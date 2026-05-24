# CLI Contract: CLI Eval Tool

## Command Surface

### `npm run cli -- predict`

Processes images from the configured input directory and emits one JSONL prediction record per image.

**Options**:

- `--input <path>`: override input image directory; defaults to `data/eval`
- `--provider <name>`: provider adapter key; defaults to `openai`
- `--model <name>`: model override; defaults to adapter default (`gpt-5.4-mini` for OpenAI)
- `--help`: show usage, options, default provider/model behavior, and adapter model catalogs

### `npm run cli -- eval`

Processes images, loads a ground-truth CSV, and emits JSONL comparison records followed by one summary JSONL record.

**Options**:

- `--input <path>`: override input image directory; defaults to `data/eval`
- `--csv <path>`: override evaluation CSV path; defaults to `data/eval/a.csv`
- `--provider <name>`: provider adapter key; defaults to `openai`
- `--model <name>`: model override; defaults to adapter default (`gpt-5.4-mini` for OpenAI)
- `--help`: show usage, options, default provider/model behavior, and adapter model catalogs

## Environment Contract

- `OPENAI_API_KEY`: required when `--provider openai` is selected
- `CLI_INPUT_DIR`: optional fallback for `--input`
- `CLI_EVAL_CSV`: optional fallback for `--csv`
- `CLI_PROVIDER`: optional fallback for `--provider`
- `CLI_MODEL`: optional fallback for `--model`

CLI arguments take precedence over environment variables.

## Predict Output Record (JSONL)

Each output line is a JSON object with this shape:

```json
{
  "type": "prediction",
  "imageId": "img001",
  "imagePath": "data/eval/img001.jpg",
  "time": "2026-05-20 14:01:23 GMT+7",
  "hand": "right",
  "systolic": 127,
  "diastolic": 72,
  "pulse": 69,
  "confidence": 0.95,
  "status": "complete",
  "uncertainFields": [],
  "provider": "openai",
  "model": "gpt-5.4-mini"
}
```

**Rules**:

- `status` is one of `complete`, `partial`, `unreadable`, `error`.
- `uncertainFields` lists only field names from `time`, `hand`, `systolic`, `diastolic`, `pulse`.
- Null field values are allowed when uncertainty or unreadability prevents extraction.

## Eval Output Record (JSONL)

Per-image comparison lines use this shape:

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
  "errorCount": 0,
  "provider": "openai",
  "model": "gpt-5.4-mini"
}
```

## Matching Contract

- Eval mode matches image files to CSV rows by filename stem.
- CSV rows must expose a unique `imageId` column representing that stem.
- Duplicate stems in either source are validation failures.

## Help Output Contract

Help output must include:

- command usage for `predict` and `eval`
- default directories/CSV path
- provider selection behavior
- default model behavior
- statically configured model catalogs for installed adapters

Help output must not rely on live provider discovery.
