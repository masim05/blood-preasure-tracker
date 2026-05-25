# Quickstart: CLI Eval Tool

## Prerequisites

- Node.js 22 LTS
- npm 11+
- Local fixture images in `data/eval`

## Setup

```bash
npm install
cp .env.example .env
```

Optional `.env` values for local execution:

```bash
CLI_INPUT_DIR=./data/eval
CLI_EVAL_CSV=./data/eval/a.csv
CLI_OCR_CONFIDENCE_THRESHOLD=0.85
```

## Predict Mode

Run against the default dataset directory:

```bash
npm run cli -- predict
```

Run against a custom directory:

```bash
npm run cli -- predict --input ./data/eval
```

## Eval Mode

Run against the default image directory and CSV:

```bash
npm run cli -- eval
```

Run against explicit paths:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

## Help and Model Catalog

```bash
npm run cli -- --help
```

The help output must list supported commands, default paths, `.env` configuration behavior, and the rule that `time` is extracted from image metadata.

## Test and Coverage Workflow

```bash
npm test
npm run test:coverage
```

Coverage must remain at or above 95%, with changed modules driven toward 100% where feasible.

## Expected Layout for Local Evaluation Data

```text
data/
└── eval/
    ├── a.csv
    ├── img001.jpg
    ├── img002.jpg
    └── ...
```

The CSV must contain an `imageId` column matching each image filename stem.

Duplicate `imageId` values and duplicate normalized filename stems are treated as validation failures.

## Fixture Notes

- Supported input image extensions are `.jpg`, `.jpeg`, `.png`, and `.webp`.
- The CLI matches `a.csv` rows to image files by filename stem only.
- Blank optional values in the CSV are parsed as `null`.
- `time` is extracted from image metadata only; when metadata is absent or malformed, `time` must remain null or uncertain.
- OCR runs locally and may mark fields uncertain when confidence is below the configured threshold.

## Validated Command Set

These commands were run successfully in this workspace during implementation:

```bash
npm run build
npm run cli -- --help
npm test
npm run test:coverage
```

These commands remain the supported runtime flow and require local fixtures:

```bash
npm run cli -- predict --input ./data/eval
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

These commands require only local fixtures and optional `.env` configuration; they do not require external API credentials.
