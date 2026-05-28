---
description: "Task list for Android mobile app implementation"
---

# Tasks: Android Mobile App

**Input**: Design documents from `/specs/009-android-mobile-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-client.md, contracts/maestro-flows.md, quickstart.md

**Tests**: Required. Each in-scope user story US1-US5 includes Android unit tests and one happy-path Maestro flow. Android unit coverage must verify `>= 95%`. The initial hello world scaffold remains exempt from tests only as a scaffold milestone.

**Implementation Boundary**: Application implementation changes for this feature must remain under `mobile/android`. Do not change API code, API tests, backend tests, or `docs/openapi.yaml`. Treat `docs/openapi.yaml` as a read-only API reference.

**Localization**: Every visible Android string or text value must come from localized resources or an equivalent localization mechanism. Hardcoded visible text in Kotlin, XML resources, tests, and Maestro flows is prohibited.

**Deferred Scope**: US6 is deferred. Do not implement measurement detail, image review, value override, or reviewed save workflows.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: Required for user story phase tasks only
- Every task includes a concrete file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Android-only project structure, toolchain, and local validation entry points.

- [ ] T001 Verify Kotlin 2.0.21, Android Gradle Plugin 8.7.3, JUnit 4.13.2, and Gradle wrapper versions in `mobile/android/gradle/libs.versions.toml` and `mobile/android/gradle/wrapper/gradle-wrapper.properties`
- [ ] T002 [P] Verify Android applicationId, namespace, SDK levels, Java/Kotlin 17 target, BuildConfig API base URL, JUnit, and JaCoCo coverage tasks in `mobile/android/app/build.gradle.kts`
- [ ] T003 [P] Verify Android manifest permissions and cleartext local API support in `mobile/android/app/src/main/AndroidManifest.xml`
- [ ] T004 [P] Verify Android README setup, Android Studio JBR guidance, API startup, build, coverage, and Maestro commands in `mobile/android/README.md`
- [ ] T005 [P] Verify local Android CI helper runs unit tests, coverage, build, and Maestro prerequisite checks in `mobile/android/scripts/ci.sh`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, ports, validation, localization, API error mapping, HTTP adapter, camera adapter, and test infrastructure that must exist before user-story completion.

**Critical**: No user story is complete until this phase is complete.

- [ ] T006 [P] Define MobileUser, Session, MeasurementImage, Measurement, HistoryFilter, HistoryTableRow, PasswordInput, and ApiError concepts in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt`
- [ ] T007 [P] Add domain model unit tests for sessions, measurements, history filters, password input expectations, and API errors in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt`
- [ ] T008 [P] Define auth, session, upload, history, and camera ports in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt`
- [ ] T009 [P] Implement shared email, password, image, and history filter validators in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/validation/Validators.kt`
- [ ] T010 [P] Add validator unit tests for email, password, image metadata, date filter bounds, and deferred measurement detail behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/validation/ValidatorsTest.kt`
- [ ] T011 [P] Implement shared API error mapping from API message bodies and network, timeout, parse, and unexpected fallbacks in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapper.kt`
- [ ] T012 [P] Add API error mapper unit tests for API messages and every fallback source in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapperTest.kt`
- [ ] T013 Implement HTTP auth, upload, and history API client behavior against `http://10.0.2.2:3000` in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [ ] T014 [P] Add HTTP API client unit tests for signin, login, upload, history, JSON escaping, API error bodies, malformed responses, and network failures in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T015 [P] Implement session storage adapter for active session state in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/session/InMemorySessionStore.kt`
- [ ] T016 [P] Add session storage unit tests for save, load, clear, and replacement behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/session/InMemorySessionStoreTest.kt`
- [ ] T017 [P] Implement generated camera image gateway for deterministic capture/upload validation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGateway.kt`
- [ ] T018 [P] Add generated camera gateway unit tests for image URI, MIME type, and size metadata in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGatewayTest.kt`
- [ ] T019 [P] Define stable Android resource IDs for signin, login, guide, action, capture, and history screens in `mobile/android/app/src/main/res/values/ids.xml`
- [ ] T020 [P] Define localized labels, buttons, status messages, errors, accessibility text, history table labels, and date selector strings in `mobile/android/app/src/main/res/values/strings.xml`

**Checkpoint**: Foundation ready. User story tasks can complete independently after Phase 2.

---

## Phase 3: User Story 1 - Create Account And Enter Guide (Priority: P1) MVP

**Goal**: A signed-out new user creates an account with email/password, stores the returned session, and lands on the guide screen.

**Independent Test**: Run the app against the local API, submit valid new-account credentials, verify the guide screen appears, and verify signin API errors are visible on the signin screen.

### Tests for User Story 1 (Required)

- [ ] T021 [P] [US1] Add AuthFlow unit tests for signin validation, success session storage, guide navigation, API error display, and network error display in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T022 [P] [US1] Add HTTP client unit tests for `POST /api/v1/signin` success, validation error, duplicate email error, and malformed response mapping in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T023 [P] [US1] Add happy-path Maestro signin flow using stable resource IDs in `mobile/android/maestro/us1-signin.yaml`

### Implementation for User Story 1

- [ ] T024 [P] [US1] Add localized signin email, password, submit, login link, loading, validation, and error text in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T025 [US1] Implement signin flow validation, API call, session save, error state, and guide destination in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T026 [US1] Implement signin screen rendering, localized controls, API error display, and navigation to guide in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`
- [ ] T027 [US1] Configure signin password input to use Android standard password masking behavior in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Read Measurement Guide (Priority: P2)

**Goal**: An authenticated user sees localized placeholder guidance requesting a clear picture with the tonometer and arm visible, then continues to the measurement action screen.

**Independent Test**: Start after signin, verify guide content is visible, continue, and verify capture/history actions appear.

### Tests for User Story 2 (Required)

- [ ] T028 [P] [US2] Add guide flow unit tests for guide display state and continue-to-actions navigation in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T029 [P] [US2] Add happy-path Maestro guide flow using stable resource IDs in `mobile/android/maestro/us2-guide.yaml`

### Implementation for User Story 2

- [ ] T030 [P] [US2] Add localized guide title, clear-picture guidance, continue button, and accessibility labels in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T031 [US2] Implement guide flow state and continue destination in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T032 [US2] Implement guide screen rendering and guide-to-actions navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US2 works independently after authenticated setup and does not require US3-US5.

---

## Phase 5: User Story 3 - Log In And Enter Measurement Actions (Priority: P3)

**Goal**: A signed-out existing user logs in with email/password, stores the returned session, and lands on the measurement action screen.

**Independent Test**: Run the app against the local API with an existing user, submit valid credentials, verify the action screen appears, and verify login API errors are visible on the login screen.

### Tests for User Story 3 (Required)

- [ ] T033 [P] [US3] Add AuthFlow unit tests for login validation, success session storage, action navigation, unauthorized error display, and network error display in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T034 [P] [US3] Add HTTP client unit tests for `POST /api/v1/login` success, unauthorized error, validation error, rate limit error, and malformed response mapping in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T035 [P] [US3] Add happy-path Maestro login flow using stable resource IDs and seeded credentials in `mobile/android/maestro/us3-login.yaml`

### Implementation for User Story 3

- [ ] T036 [P] [US3] Add localized login title, email, password, submit, signin link, loading, validation, and error text in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T037 [US3] Implement login flow validation, API call, session save, error state, and actions destination in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T038 [US3] Implement login screen rendering, localized controls, API error display, and navigation to measurement actions in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`
- [ ] T039 [US3] Configure login password input to use Android standard password masking behavior in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US3 is independently functional for returning users.

---

## Phase 6: User Story 4 - Choose Capture Or History (Priority: P4)

**Goal**: An authenticated user can choose capture or saved history from the measurement action screen, and upload errors are visible with retry or navigation options.

**Independent Test**: Reach the measurement action screen, tap capture to upload a measurement image, return, tap history, and verify history filter UI appears.

### Tests for User Story 4 (Required)

- [ ] T040 [P] [US4] Add CaptureFlow unit tests for upload success, missing session, API error display, network error display, retry state, and navigate-away behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T041 [P] [US4] Add HTTP client unit tests for authenticated multipart `POST /api/v1/measurements` success, unauthorized error, validation error, and upload body formatting in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T042 [P] [US4] Add generated camera gateway unit tests for deterministic image metadata used by capture in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGatewayTest.kt`
- [ ] T043 [P] [US4] Add happy-path Maestro capture-or-history flow using stable resource IDs in `mobile/android/maestro/us4-capture-or-history.yaml`

### Implementation for User Story 4

- [ ] T044 [P] [US4] Add localized action hub, capture, upload complete, upload error, retry, back, and history strings in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T045 [US4] Implement capture flow for session lookup, generated image capture, authenticated upload, success state, and API error state in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T046 [US4] Implement measurement action screen, capture screen, upload status display, retry/back actions, and history navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`
- [ ] T047 [US4] Implement upload request construction and response parsing in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`

**Checkpoint**: US4 works independently from the authenticated action screen and does not implement measurement detail/review/save.

---

## Phase 7: User Story 5 - Browse Measurement History (Priority: P5)

**Goal**: An authenticated user sees saved measurement history rows in aligned columns, filters by inclusive date range using date selectors, sees empty/error states, and cannot open or edit measurement details.

**Independent Test**: Use seeded saved measurements, open history, select and apply a date range filter, verify aligned row values and selected filters remain visible, and confirm rows are non-editable.

### Tests for User Story 5 (Required)

- [ ] T048 [P] [US5] Add HistoryFlow unit tests for initial load, date selector state, date range validation, from-after-to validation, empty state, pagination state, API error display, network error display, retry, and non-editable row behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T049 [P] [US5] Add HTTP client unit tests for authenticated `GET /api/v1/measurements` query parameters, inclusive filters, pagination, success mapping, error mapping, and malformed responses in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T050 [P] [US5] Add domain model or formatter unit tests for HistoryTableRow column order, localized value mapping, and aligned row data in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt`
- [ ] T051 [P] [US5] Add happy-path Maestro history filter flow using stable resource IDs and seeded measurement data in `mobile/android/maestro/us5-history-filter.yaml`

### Implementation for User Story 5

- [ ] T052 [P] [US5] Add localized history title, table headers, date selector labels, selected date text, apply filter, clear filter, empty state, retry, return, arm labels, and status labels in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T053 [P] [US5] Add stable IDs for date selector controls and history table columns in `mobile/android/app/src/main/res/values/ids.xml`
- [ ] T054 [US5] Implement history flow for session lookup, date filter state, inclusive bounds, validation, API errors, empty state, retry, and non-editable rows in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T055 [US5] Implement history list API request, query parameters, response parsing, pagination flags, and error mapping in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [ ] T056 [US5] Replace free-text history date inputs with Android date selector controls in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`
- [ ] T057 [US5] Render history rows as vertically aligned table columns for measurement time, systolic, diastolic, pulse, arm side, and status in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`
- [ ] T058 [US5] Ensure history rows have no click navigation and no detail, image review, override, or save affordances in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US5 is independently functional and verifies that measurement detail workflows remain absent.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate localization, coverage, Maestro happy paths, documentation, and the Android-only boundary across all in-scope stories.

- [ ] T059 [P] Audit Kotlin code for hardcoded visible strings and move findings to localized resources in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T060 [P] Audit Maestro flows for stable resource IDs and localized-string-safe assertions in `mobile/android/maestro/`
- [ ] T061 [P] Update Android README validation instructions for API base URL, Android Studio JBR, unit coverage, build, and Maestro commands in `mobile/android/README.md`
- [ ] T062 Run Android unit tests and verify `>= 95%` JaCoCo coverage using `./gradlew :app:testDebugUnitTest :app:androidCoverageVerify` from `mobile/android`
- [ ] T063 Run Android debug build using `./gradlew :app:assembleDebug` from `mobile/android`
- [ ] T064 Run all in-scope Maestro happy paths from `mobile/android/maestro/`
- [ ] T065 Verify the final implementation diff contains mobile implementation changes only under `mobile/android` in `mobile/android/README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks completion of all user stories.
- **Phase 3: US1** depends on Phase 2 and is the MVP.
- **Phase 4: US2** depends on Phase 2 and can be implemented after or alongside US1 if authenticated state is provided by fakes.
- **Phase 5: US3** depends on Phase 2 and can be implemented independently of US1/US2.
- **Phase 6: US4** depends on Phase 2 and requires authenticated route support.
- **Phase 7: US5** depends on Phase 2 and requires authenticated route support and history repository behavior.
- **Final Phase** depends on all selected in-scope stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories after Phase 2.
- **US2 (P2)**: Product journey follows US1, but implementation can use authenticated fakes after Phase 2.
- **US3 (P3)**: No dependency on US1 or US2 after shared auth foundation exists.
- **US4 (P4)**: No dependency on US5; requires authenticated session foundation.
- **US5 (P5)**: No dependency on US4; requires authenticated session foundation and history API client behavior.
- **US6**: Deferred and intentionally omitted.

### Within Each User Story

- Write/update unit tests and the Maestro happy path before implementation tasks.
- Keep all visible text in localized resources before considering a story complete.
- Keep API errors visible on the current screen for every API and network failure path.
- Preserve the no-API-change boundary; handle API limitations in Android client behavior or defer them to a separate feature.
- Verify coverage remains at or above `95%` as user-story code is added.

---

## Parallel Execution Examples

### User Story 1

```text
Task: T021 Add AuthFlow unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T022 Add signin HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T023 Add Maestro signin flow in mobile/android/maestro/us1-signin.yaml
```

### User Story 2

```text
Task: T028 Add guide flow unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T029 Add Maestro guide flow in mobile/android/maestro/us2-guide.yaml
```

### User Story 3

```text
Task: T033 Add login flow unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T034 Add login HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T035 Add Maestro login flow in mobile/android/maestro/us3-login.yaml
```

### User Story 4

```text
Task: T040 Add capture flow unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T041 Add upload HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T043 Add Maestro capture-or-history flow in mobile/android/maestro/us4-capture-or-history.yaml
```

### User Story 5

```text
Task: T048 Add history flow unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T049 Add history HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T050 Add history row model/formatter tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt
Task: T051 Add Maestro history filter flow in mobile/android/maestro/us5-history-filter.yaml
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 US1 tests and implementation.
4. Validate US1 independently with unit tests, JaCoCo, and `mobile/android/maestro/us1-signin.yaml`.
5. Stop for review before adding lower-priority stories.

### Incremental Delivery

1. Setup and foundation establish architecture, localization, API error handling, session storage, adapters, and test support.
2. US1 delivers account creation and guide entry as the MVP.
3. US2 completes the guide-to-action path.
4. US3 adds returning-user login.
5. US4 adds capture/history choice and upload error handling.
6. US5 adds saved history browsing with date selectors and aligned table rows.
7. Final phase validates localization, Maestro, coverage, build, docs, and path boundaries.

### Boundary Strategy

- Use `docs/openapi.yaml` and `specs/009-android-mobile-app/contracts/api-client.md` as read-only references.
- Keep all implementation files under `mobile/android`.
- Do not modify API code, API tests, backend tests, or OpenAPI docs for this feature.
- Defer US6 measurement detail/review/override/save behavior entirely.
