# Blood Pressure CLI Eval Tool

This project provides a local CLI for extracting blood-pressure monitor readings from image files and evaluating those predictions against a CSV ground-truth dataset.

## Requirements

- Node.js 24.x LTS or newer
- npm 11 or newer
- `OPENAI_API_KEY` when using the default OpenAI adapter

## Install

```bash
npm install
```

## Commands

Show usage and the static model catalog:

```bash
npm run cli -- --help
```

Predict readings for every image in the input directory:

```bash
npm run cli -- predict --input ./data/eval
```

Each predict run also creates or replaces `./data/eval/p.csv` with one CSV row per processed image. The generated file is overwritten on every predict run for that input directory.

Evaluate predictions against the CSV dataset matched by filename stem:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

Generated prediction CSV files can be reused as eval reference data:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/p.csv
```

CLI arguments override environment defaults for `--input`, `--csv`, `--provider`, and `--model`.

## Output

- `predict` emits one JSONL `prediction` record per image and writes `<input>/p.csv` at the same time.
- Generated `p.csv` files use the fixed header `imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes`.
- Missing prediction values are empty CSV cells; `uncertainFields` is encoded as a JSON array string in one CSV cell.
- `eval` emits one JSONL `comparison` record per image or unmatched row, followed by one `summary` record.
- `time` is read only from embedded image metadata, using `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`/`ModifyDate` parser output.
- Metadata timestamps are emitted as `YYYY-MM-DD HH:mm:ss`, for example `2026-05-19 06:05:20`.
- If no supported embedded timestamp is present, `time` remains `null` and `uncertainFields` includes `time`; the CLI does not fall back to provider output, filename text, file modification time, or runtime timezone inference.

## Dataset Expectations

- Input images are read from a directory such as `data/eval/`.
- Supported image formats are `.jpg`, `.jpeg`, `.png`, and `.webp`.
- Eval CSV files must include `imageId,time,hand,systolic,diastolic,pulse` headers.
- Eval ignores additional columns such as generated `p.csv` service fields: `status`, `confidence`, `uncertainFields`, `provider`, `model`, and `rawNotes`.
- `imageId` must uniquely match the image filename stem.
- Duplicate `imageId` values or duplicate normalized filename stems are rejected.

Example layout:

```text
data/
└── eval/
    ├── a.csv
    ├── img001.jpg
    ├── img002.png
    └── ...
```

## Environment

Copy values from `.env.example` into your shell or environment manager.

```bash
export OPENAI_API_KEY="your-key"
export CLI_INPUT_DIR="./data/eval"
export CLI_EVAL_CSV="./data/eval/a.csv"
export CLI_PROVIDER="openai"
export CLI_MODEL="gpt-5.4-mini"
```

## Validation

The following commands were validated in this workspace:

```bash
npm run build
npm run cli -- --help
npm test
npm run test:coverage
npm run lint
```