# Quickstart: CLI Eval Tool

## Prerequisites

- Node.js 22 LTS
- npm 11+
- OpenAI API key for the default provider

## Setup

```bash
npm install
export OPENAI_API_KEY="your-key"
```

## Predict Mode

Run against the default dataset directory:

```bash
npm run cli -- predict
```

Run against a custom directory and model:

```bash
npm run cli -- predict --input ./data/eval --provider openai --model gpt-5.4-mini
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

The help output must list supported commands, default paths, provider options, the default model, and the statically configured models exposed by installed adapters.

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
