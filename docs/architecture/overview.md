# Architecture Overview

This document describes the high-level architecture of the project.

## System shape

The repository delivers three runtimes:

- CLI predictor/evaluator (`src/` CLI entrypoints)
- Web/API server (`src/api-main.ts`, NestJS)
- Android mobile client (`mobile/android`)

This architecture definition keeps existing system-level context and adds explicit Android mobile architecture guidance. iOS architecture remains out of scope.

## Web server

The web server is a Node.js 24 / NestJS 11 application started by `src/api-main.ts` through `npm run api`. It creates `ApiModule`, selects log levels from `NODE_ENV`, loads runtime API config, and listens on `API_PORT` (default `3000`).

The server has two inbound web surfaces:

- Public pages (`/`, `/policy`) from `HomeController` and `PolicyController`.
- Mobile API (`/api/v1`) from `AuthController` and `MeasurementsController`.

`ApiModule` is the server composition root. It binds application ports to adapters for Postgres persistence, filesystem image storage, crypto/token handling, and LLM recognition.

Primary mobile API flow:

1. `POST /api/v1/signin` and `POST /api/v1/login` validate credentials and issue expiring bearer tokens.
2. Protected routes validate authorization token ownership and expiry.
3. `POST /api/v1/measurements` validates and stores image upload, then enqueues recognition.
4. Recognition worker processes queued jobs and updates measurement state.
5. Detail/image routes are owner-scoped reads.
6. Save route confirms recognized measurement (with optional corrections).
7. History route returns paginated/time-filtered records without image binary payload.

Data is persisted by migration `src/infrastructure/database/migrations/001_mobile_api.sql` (`user_accounts`, `bearer_tokens`, `measurements`, `measurement_images`, `recognition_tasks`).

## Android mobile app

The Android app (`mobile/android/app`) is a single-process Jetpack Compose app with explicit boundaries:

- UI + navigation: `MainActivity` and `ui/screens/*`
- App flows (business orchestration): `core/flow/*`
- Domain model + validation: `core/model/*`, `core/validation/*`
- Side-effect adapters: `adapters/api/*`, `adapters/camera/*`, `adapters/session/*`

### Runtime composition

`MainActivity` is the Android composition root. It builds concrete adapters:

- `HttpApiClient` (Auth/History/Upload/Detail gateways)
- `CameraXCameraGateway` (camera capture handoff)
- `EncryptedSessionStore` (Android Keystore + SharedPreferences)

It injects them into:

- `AuthFlow`
- `CaptureFlow`
- `HistoryFlow`
- `MeasurementDetailFlow`

Flows return immutable `ScreenState`; the activity maps that into `MobileUiState` for Compose rendering.

### Route and state model

App routes are strict and finite: `Auth`, `Guide`, `Camera`, `History`, `MeasurementDetail`, `Profile`.

State transitions:

1. Startup loads encrypted session; active session starts at camera route, invalid session is cleared and redirected to auth.
2. Auth screen calls `AuthFlow`; validation occurs before network calls; success persists session and routes to guide/camera.
3. Camera screen publishes captured `MeasurementImage`; `CaptureFlow` verifies readiness, validates image (JPEG/PNG, <=10 MB), uploads, and routes to history.
4. History screen applies date-filter validation (`yyyy-mm-dd`) and fetches `/api/v1/measurements`.
5. Measurement detail screen loads and saves via detail endpoints and fetches protected image bytes with authorization.
6. Profile screen changes language preference and triggers logout/session clear.

### Operational constraints

- API host comes from `BuildConfig.API_BASE_URL` via Gradle property `apiBaseUrl`.
- Defaults: debug `http://10.0.2.2:3000`, release `https://bpt.crptmax.com`.
- Manifest permissions: `CAMERA`, `INTERNET`; cleartext traffic is currently enabled app-wide (`android:usesCleartextTraffic="true"`).
- Network and camera operations run off the UI thread; failures are mapped to typed API/validation errors and rendered as user-safe UI messages.

### Architectural intent

Business decisions (route transitions, validation, session semantics) remain in flows/domain code. Compose screens and Android framework classes handle rendering, lifecycle, and transport-trigger wiring, but do not own domain rules.
