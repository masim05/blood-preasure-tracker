# CLI Contract: Provider Metadata Extraction

## Command Surface

### `npm run cli -- predict`

Processes local images from the configured input directory and emits one JSONL prediction record per image.

**Options**:

- `--input <path>`: override input image directory; defaults to `data/eval`
- `--provider <name>`: override extraction provider; defaults to configured provider
- `--model <name>`: override extraction model; defaults to configured model
- `--help`: show usage, defaults, provider/model configuration behavior, and metadata timestamp rules

### `npm run cli -- eval`

Processes local images, loads a ground-truth CSV, and emits JSONL comparison records followed by one summary JSONL record.

**Options**:

- `--input <path>`: override input image directory; defaults to `data/eval`
- `--csv <path>`: override evaluation CSV path; defaults to `data/eval/a.csv`
- `--provider <name>`: override extraction provider; defaults to configured provider
- `--model <name>`: override extraction model; defaults to configured model
- `--help`: show usage, defaults, provider/model configuration behavior, and metadata timestamp rules

## Environment Contract

The CLI loads configuration from `.env` when present.

- `OPENAI_API_KEY`: required when provider is `openai`
- `CLI_INPUT_DIR`: optional fallback for `--input`
- `CLI_EVAL_CSV`: optional fallback for `--csv`
- `CLI_PROVIDER`: optional fallback for `--provider`
- `CLI_MODEL`: optional fallback for `--model`

CLI arguments take precedence over `.env` values.

## Predict Output Record (JSONL)

Each output line is a JSON object shaped like this:

```json
{
  "type": "prediction",
  "imageId": "img001",
  "imagePath": "data/eval/img001.jpg",
  "time": "2026-05-20 14:01:23",
  "hand": "right",
  "systolic": 127,
  "diastolic": 72,
  "pulse": 69,
  "confidence": 0.95,
  "status": "complete",
  "uncertainFields": [],
  "provider": "openai",
  "model": "gpt-5.4-mini",
  "metadataSource": "DateTimeOriginal"
}
```

**Rules**:

- `time` comes only from image metadata.
- Provider responses for `hand`, `systolic`, `diastolic`, and `pulse` must not be treated as a source of `time`.
- If metadata is missing or invalid, `time` is `null` and `uncertainFields` includes `time` unless the whole reading is already in `error` state.
- `status` is one of `complete`, `partial`, `unreadable`, or `error`.

## Eval Output Records (JSONL)

Per-image comparison records use this shape:

```json
{
  "type": "comparison",
  "imageId": "img001",
  "matchStatus": "matched",
  "prediction": { "status": "complete", "provider": "openai" },
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
  "metadataMissingCount": 2
}
```

## Matching Contract

- Eval mode matches images to CSV rows by filename stem.
- CSV rows must expose a unique `imageId` column representing that stem.
- Duplicate stems in either source are validation failures.

## Help Output Contract

Help output must include:

- usage for both `predict` and `eval`
- default input directory and evaluation CSV path
- provider/model configuration behavior
- required provider credentials for supported providers
- the rule that `time` is extracted from image metadata and never from model output
