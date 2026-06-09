# Blood Pressure Tracker

Blood Pressure Tracker has three deliverables in one repository: a CLI predictor/evaluator for blood-pressure monitor images, a NestJS mobile API for accounts and measurement lifecycle, and an Android app that captures images and displays saved history.

## CLI Predictor/Evaluator

### Requirements

- Node.js 24.x LTS or newer
- npm 11 or newer
- `OPENAI_API_KEY` when using the default OpenAI adapter

### Installation And Build

```bash
npm install
npm run build
```

Show usage and static model catalog:

```bash
npm run cli -- --help
```

Predict readings for all images in a directory:

```bash
npm run cli -- predict --input ./data/eval
```

Evaluate predictions against a CSV matched by filename stem:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

Generated prediction CSV files can be reused as eval reference data:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/p.csv
```

### Configuration Options

- CLI flags override env defaults: `--input`, `--csv`, `--provider`, and `--model`
- Supported env variables:
    - `OPENAI_API_KEY`
    - `CLI_INPUT_DIR`
    - `CLI_EVAL_CSV`
    - `CLI_PROVIDER`
    - `CLI_MODEL`

Output behavior:

- `predict` emits one JSONL `prediction` record per image and writes `<input>/p.csv`.
- Generated `p.csv` uses header `imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes`.
- `eval` emits JSONL `comparison` records, then a JSONL `summary`, plus an aligned human-readable accuracy block.
- Metadata time extraction order is `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`/`ModifyDate` parser output.
- If no supported embedded timestamp exists, `time` remains `null` and `uncertainFields` includes `time`.

Dataset expectations:

- Images are read from a directory such as `data/eval/`.
- Supported image formats: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Eval CSV must include headers `imageId,time,hand,systolic,diastolic,pulse`.
- Additional generated columns (`status`, `confidence`, `uncertainFields`, `provider`, `model`, `rawNotes`) are ignored during eval.
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

### Relevant CI Checks

- [Build job](.github/workflows/ci.yml#L10)
- [Unit/Contract Coverage job](.github/workflows/ci.yml#L27)
- [Integration Tests job](.github/workflows/ci.yml#L44)
- [Lint job](.github/workflows/ci.yml#L81)

## API

### Requirements

- Node.js 24.x LTS or newer
- npm 11 or newer
- Docker daemon for local `db:init` database bootstrap
- PostgreSQL connection string in `DATABASE_URL`

### Installation And Build

```bash
npm install
npm run build
```

Create/start local Docker PostgreSQL and run migrations:

```bash
npm run db:init
```

Choose a specific env file when needed:

```bash
npm run db:init -- --env .env.example
```

Apply migrations to the database from `DATABASE_URL` in `.env`:

```bash
npm run db:migrate
```

Run the API:

```bash
npm run api
```

Integration test flow:

```bash
npm run db:init -- --env .env.test
npm run test:integration
```

Clean matching DB container and data directory for an env file:

```bash
npm run db:clean -- --env .env.example
```

Primary endpoints:

- `POST /api/v1/signin`
- `POST /api/v1/login`
- `POST /api/v1/measurements`
- `GET /api/v1/measurements/<id>`
- `GET /api/v1/measurements/<id>/image`
- `POST /api/v1/measurements/<id>/save`
- `GET /api/v1/measurements`

OpenAPI docs:

- Source: [docs/openapi.yaml](docs/openapi.yaml)
- Regenerate: `npm run openapi:generate`
- Serve Swagger UI only: `npm run openapi:serve`

### Configuration Options

- Required for runtime:
    - `DATABASE_URL`
    - `MEASUREMENT_IMAGE_DIR`
    - `ACCESS_TOKEN_TTL_SECONDS`
    - `API_PORT`
    - `OPENAI_API_KEY`
- Optional worker tuning:
    - `RECOGNITION_WORKER_INTERVAL_SECONDS` (default `10`)
    - `RECOGNITION_WORKER_BATCH_SIZE` (default `4`)
- Logging mode:
    - `NODE_ENV=production` suppresses debug request logs
    - any other value enables debug request logs
- DB init override:
    - `DB_INIT_POSTGRES_IMAGE` chooses another postgres image

### Relevant CI Checks

- [Build job](.github/workflows/ci.yml#L10)
- [Integration Tests job](.github/workflows/ci.yml#L44)
- [Lint job](.github/workflows/ci.yml#L81)

## Mobile App

### Requirements

- Xcode 16+ with iOS Simulator runtime (for iOS build/tests)
- Android Studio with Android SDK
- Android Studio bundled JDK (Java 17)
- Running API server reachable from emulator/device

### Android Installation And Build

Open Android project:

```text
mobile/android
```

Build debug APK from repository root:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:assembleDebug
```

Run Android unit tests and coverage gate:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android :app:testDebugUnitTest :app:androidCoverageVerify
```

Debug builds default to local emulator API host `http://10.0.2.2:3000` (release builds default to `https://bpt.crptmax.com`). Start API from repository root with:

```bash
npm run api
```

### Configuration Options

- App API base URL comes from `apiBaseUrl` in `mobile/android/local.properties` or Gradle property `apiBaseUrl`, and maps to `BuildConfig.API_BASE_URL`
- Default `apiBaseUrl` when unset: debug builds use `http://10.0.2.2:3000`, release builds use `https://bpt.crptmax.com`
- One-off override example:

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" mobile/android/gradlew -p mobile/android -PapiBaseUrl=http://192.168.1.25:3000 :app:assembleDebug
```

- Persistent local override: set `apiBaseUrl` in `~/.gradle/gradle.properties`
- Maestro happy-path flows for US1-US6 live under `mobile/android/maestro`
- More Android-specific details: [mobile/android/README.md](mobile/android/README.md)

### iOS Build And Test

Build iOS app from repository root:

```bash
xcodebuild build \
  -project "mobile/ios/Blood pressure tracker/Blood pressure tracker.xcodeproj" \
  -scheme "Blood pressure tracker" \
  -destination "generic/platform=iOS Simulator"
```

Run iOS tests from repository root:

```bash
./scripts/ios-test-local.sh
```

### Relevant CI Checks

- [Android Mobile Tests job](.github/workflows/ci.yml#L98)
- [iOS Mobile Build job](.github/workflows/ci.yml)
- [Build job](.github/workflows/ci.yml#L10)

## Environment Example

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
export ACCESS_TOKEN_TTL_SECONDS="604800"
export RECOGNITION_WORKER_INTERVAL_SECONDS="10"
export RECOGNITION_WORKER_BATCH_SIZE="4"
export NODE_ENV="development"
```

## Validation

Validation is enforced by CI checks in [.github/workflows/ci.yml](.github/workflows/ci.yml).

For latest status and required checks, see repository Actions.

## Contributing

Contribution guidelines are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

All feature and bugfix work must be done in separate Git worktrees, with one worktree per change.