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

## Mobile API

The mobile API runs beside the CLI as a NestJS HTTP adapter. It supports email account creation, login, bearer-protected measurement image upload, measurement detail and original image retrieval, explicit save confirmation, and saved measurement history.

Start the API after setting `DATABASE_URL`, `MEASUREMENT_IMAGE_DIR`, `ACCESS_TOKEN_TTL_SECONDS`, `API_PORT`, and `OPENAI_API_KEY`:

```bash
npm run api
```

Primary endpoints:

- `POST /api/v1/signin` creates an account and returns an expiring bearer token.
- `POST /api/v1/login` returns an expiring bearer token for an existing user.
- `POST /api/v1/measurements` accepts an authenticated JPEG/PNG image up to 10 MB and returns a pending measurement id.
- `GET /api/v1/measurements/<id>` returns owned measurement detail and an `imageUrl`.
- `GET /api/v1/measurements/<id>/image` returns the owner-protected original image bytes.
- `POST /api/v1/measurements/<id>/save` saves a recognized measurement into history.
- `GET /api/v1/measurements` returns saved measurement history without image binary data.

## Output

- `predict` emits one JSONL `prediction` record per image and writes `<input>/p.csv` at the same time.
- Generated `p.csv` files use the fixed header `imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes`.
- Missing prediction values are empty CSV cells; `uncertainFields` is encoded as a JSON array string in one CSV cell.
- `eval` emits one JSONL `comparison` record per image or unmatched row, followed by one JSONL `summary` record and an aligned human-readable accuracy block.
- Eval accuracy lines report `hand`, `systolic`, `diastolic`, `pulse`, plus readings with at least 2, at least 3, and all 4 target parameters correct. Counts use comparable prediction/reference pairs as the denominator and percentages are shown to one decimal place.
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
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/blood_pressure_tracker"
export API_PORT="3000"
export MEASUREMENT_IMAGE_DIR="./tmp/measurement-images"
export ACCESS_TOKEN_TTL_SECONDS="3600"
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