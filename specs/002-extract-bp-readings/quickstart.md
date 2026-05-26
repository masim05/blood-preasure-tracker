# Quickstart: Provider Metadata Extraction

## Prerequisites

- Node.js 22.13.1 LTS or newer
- npm 11 or newer
- Access to provider credentials for the selected extraction provider
- Local image fixtures under `data/eval`

## Setup

```bash
npm install
cp .env.example .env
```

Populate `.env` with the provider-backed runtime settings you need:

```bash
OPENAI_API_KEY=your-key
CLI_INPUT_DIR=./data/eval
CLI_EVAL_CSV=./data/eval/a.csv
CLI_PROVIDER=openai
CLI_MODEL=gpt-5.4-mini
```

## Predict Mode

Run against the default dataset directory:

```bash
npm run cli -- predict
```

Run against a custom directory and explicit provider/model:

```bash
npm run cli -- predict --input ./data/eval --provider openai --model gpt-5.4-mini
```

Expected behavior:

- `hand`, `systolic`, `diastolic`, and `pulse` come from the configured provider path.
- `time` comes only from embedded image metadata.
- Missing metadata leaves `time` null or uncertain rather than inferred.

## Eval Mode

Run against the default image directory and CSV:

```bash
npm run cli -- eval
```

Run against explicit paths:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv --provider openai --model gpt-5.4-mini
```

Expected behavior:

- Images and CSV rows are matched by filename stem.
- Eval emits JSONL comparison records followed by one summary record.
- Per-image provider or metadata failures do not stop unaffected inputs from being processed.

## Help Output

```bash
npm run cli -- --help
```

Help output should list:

- both CLI modes
- default paths
- provider/model configuration behavior
- provider credential expectations
- the rule that `time` is extracted from image metadata only

## Test and Coverage Workflow

```bash
npm test
npm run test:coverage
npm run build
node dist/main.js --help
```

Coverage must remain at or above 95%, with changed modules pushed toward 100% where feasible.

## Dataset Expectations

```text
data/
└── eval/
    ├── a.csv
    ├── img001.jpg
    ├── img002.png
    └── ...
```

The CSV must contain an `imageId` column matching the image filename stem.
Supported image extensions remain `.jpg`, `.jpeg`, `.png`, and `.webp`.

## Validation Notes

- Provider configuration may vary by environment, but timestamp behavior must not.
- If image metadata is absent or malformed, the CLI must not derive `time` from provider output.
- The CLI remains a local batch tool even when extraction uses a remote provider.
