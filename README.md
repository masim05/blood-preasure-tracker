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

Start the API after setting `DATABASE_URL`, `MEASUREMENT_IMAGE_DIR`, `ACCESS_TOKEN_TTL_SECONDS`, `API_PORT`, and `OPENAI_API_KEY`. `RECOGNITION_WORKER_INTERVAL_SECONDS` and `RECOGNITION_WORKER_BATCH_SIZE` are optional and default to `10` and `4`:

```bash
npm run api
```

API logging uses `NODE_ENV=production` for production mode, where debug request logs are suppressed and warning/error logs remain enabled. Any other `NODE_ENV` value, including unset, uses development mode and logs each HTTP request at debug level with its response status.

Create the local Docker PostgreSQL database from `DATABASE_URL` and run project migrations:

```bash
npm run db:init
```

By default this reads `.env`. Use `-e` or `--env` to choose another env file:

```bash
npm run db:init -- --env .env.example
```

The command requires a running Docker daemon, creates or starts a local `postgres:17-alpine` container, creates the database named in `DATABASE_URL`, and applies SQL migrations from `src/infrastructure/database/migrations`. Set `DB_INIT_POSTGRES_IMAGE` to use another Postgres image.

The container and data directory are named `bpt-db-<hash>`, where `<hash>` is a 4-character hash derived from `DATABASE_URL` and the project root path. Database files are stored in `data/bpt-db-<hash>`.

Integration tests use the tracked non-secret `.env.test` file. Prepare the real test database before running them:

```bash
npm run db:init -- --env .env.test
npm run test:integration
```

The mobile API integration suite uses PostgreSQL and filesystem storage from `.env.test`, while replacing only the OpenAI recognition boundary with deterministic test output.

Delete the matching Docker container and local data directory for an env file:

```bash
npm run db:clean -- --env .env.example
```

Primary endpoints:

- `POST /api/v1/signin` creates an account and returns an expiring bearer token.
- `POST /api/v1/login` returns an expiring bearer token for an existing user.
- `POST /api/v1/measurements` accepts an authenticated JPEG/PNG image up to 10 MB and returns a pending measurement id.
- `GET /api/v1/measurements/<id>` returns owned measurement detail and an `imageUrl`.
- `GET /api/v1/measurements/<id>/image` returns the owner-protected original image bytes.
- `POST /api/v1/measurements/<id>/save` saves a recognized measurement into history.
- `GET /api/v1/measurements` returns saved measurement history without image binary data.

The OpenAPI document lives at [docs/openapi.yaml](docs/openapi.yaml). Regenerate it from the API contract and controllers with the local Copilot CLI:

```bash
npm run openapi:generate
```

Serve an interactive Swagger UI for the OpenAPI document without starting the main API:

```bash
npm run openapi:serve
```

The docs server listens on `http://localhost:3001/` by default, loads [docs/openapi.yaml](docs/openapi.yaml), and supports Swagger UI "Try it out" requests against the API server declared in the OpenAPI `servers` section. The raw YAML remains available at `http://localhost:3001/openapi.yaml`. Set `OPENAPI_DOCS_PORT` to use another port.

## Android Mobile App

Android mobile app source belongs under `mobile/android`. Android implementation
must target the latest active LTS Kotlin release. User-facing mobile flows must
show every API error returned by the API, include a happy-path Maestro flow for
each user story, localize every visible string or text value, and maintain at
least 95% Android unit-test coverage in CI.

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
export RECOGNITION_WORKER_INTERVAL_SECONDS="10"
export RECOGNITION_WORKER_BATCH_SIZE="4"
export NODE_ENV="development"
```

## Validation

Validation is enforced by CI checks in [.github/workflows/ci.yml](.github/workflows/ci.yml).

For the latest status and required checks, see the repository Actions tab.