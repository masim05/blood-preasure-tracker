# Quickstart: Mobile BP API

## Prerequisites

- Node.js 24.x or later, matching the repository `engines.node` baseline.
- Latest supported PostgreSQL major available for local development.
- OpenAI provider configuration for recognition, matching existing CLI provider setup.

## Planned Environment

The implementation should add server/API-specific environment variables without breaking existing CLI variables:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/blood_pressure_tracker
API_PORT=3000
MEASUREMENT_IMAGE_DIR=./tmp/measurement-images
ACCESS_TOKEN_TTL_SECONDS=3600
OPENAI_API_KEY=...
```

## Install And Validate

```bash
npm install
npm run build
npm test
npm run test:coverage
npm run lint
```

## Local Database

Start a local PostgreSQL instance using the latest supported major selected during implementation. Create the application database and run migrations/schema setup once migration scripts exist.

```bash
createdb blood_pressure_tracker
```

## API Smoke Flow

After implementation starts the API server, validate the primary mobile workflow.

### 1. Create Account

```bash
curl -sS -X POST http://localhost:3000/api/v1/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"correct horse battery staple"}'
```

Expected: `201` with `accessToken`, `tokenType: Bearer`, `expiresAt`, and user identity.

### 2. Login

```bash
curl -sS -X POST http://localhost:3000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"correct horse battery staple"}'
```

Expected: `200` with an expiring bearer access token.

### 3. Upload Measurement Image

```bash
TOKEN='<access token from signin or login>'
curl -sS -X POST http://localhost:3000/api/v1/measurements \
  -H "Authorization: Bearer $TOKEN" \
  -F 'image=@tests/fixtures/images/sample.jpg;type=image/jpeg'
```

Expected: `202` with measurement id, `pending` status, and server-assigned measurement time.

### 4. Fetch Measurement Detail

```bash
curl -sS http://localhost:3000/api/v1/measurements/<id> \
  -H "Authorization: Bearer $TOKEN"
```

Expected while pending: status and image link. Expected after recognition: systolic, diastolic, pulse, arm side, measurement time, and image link.

### 5. Save Recognized Measurement

```bash
curl -sS -X POST http://localhost:3000/api/v1/measurements/<id>/save \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200` with `saved` status when the measurement is recognized and owned by the authenticated user.

### 6. Browse History

```bash
curl -sS 'http://localhost:3000/api/v1/measurements?page=1&pageSize=20&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z' \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Saved measurements for the authenticated user only, no original image binary data, stable pagination metadata.

## Negative Checks

- Upload without `Authorization` returns `401`.
- Uploading a non-JPEG/PNG file returns `400` and creates no measurement.
- Uploading a JPEG/PNG larger than 10 MB returns `400` and creates no measurement.
- Saving another user's measurement returns `404`.
- Saving a pending or failed measurement returns `409`.
- History excludes pending, failed, and unconfirmed recognized measurements.

## Regression Checks

The existing CLI commands must continue to build and test unchanged:

```bash
npm run cli -- --help
npm run test:coverage
```
