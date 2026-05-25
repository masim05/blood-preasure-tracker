# Blood Pressure CLI Eval Tool

This project provides a local CLI for extracting blood-pressure monitor readings from image files and evaluating those predictions against a CSV ground-truth dataset.

## Requirements

- Node.js 22.13.1 or newer
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

Evaluate predictions against the CSV dataset matched by filename stem:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

CLI arguments override environment defaults for `--input`, `--csv`, `--provider`, and `--model`.

## Output

- `predict` emits one JSONL `prediction` record per image.
- `eval` emits one JSONL `comparison` record per image or unmatched row, followed by one `summary` record.

## Dataset Expectations

- Input images are read from a directory such as `data/eval/`.
- Supported image formats are `.jpg`, `.jpeg`, `.png`, and `.webp`.
- The CSV must include `imageId,time,hand,systolic,diastolic,pulse` headers.
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
```