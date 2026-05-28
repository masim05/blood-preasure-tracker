---
description: "Task list for Android mobile app Compose customer journey implementation"
---

# Tasks: Android Mobile App

**Input**: Design documents from `/specs/009-android-mobile-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-client.md, contracts/maestro-flows.md, quickstart.md

**Tests**: Required. Each in-scope user story US1-US5 includes Android unit tests and one happy-path Maestro flow. Android unit coverage must verify `>= 95%`.

**Implementation Boundary**: Application implementation changes for this feature must remain under `mobile/android`. Do not change API code, API tests, backend tests, or `docs/openapi.yaml`. Treat `docs/openapi.yaml` as a read-only API reference.

**Localization**: Every visible Android string or text value must come from localized resources or an equivalent localization mechanism. Hardcoded visible text in Kotlin, XML resources, tests, and Maestro flows is prohibited.

**Deferred Scope**: US6 is deferred. Do not implement measurement detail, image review, value override, reviewed save workflows, or history-row navigation to measurement detail.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Android-only Compose project structure, toolchain, and local validation entry points.

- [X] T001 Verify implementation worktree isolation at `tmp/009-android-mobile-app`
- [X] T002 [P] Add Jetpack Compose, Material 3, Activity Compose, and Compose compiler versions in `mobile/android/gradle/libs.versions.toml`
- [X] T003 Configure Compose build features, Kotlin compiler extension, and Compose dependencies in `mobile/android/app/build.gradle.kts`
- [X] T004 [P] Verify Android manifest permissions and cleartext local API support in `mobile/android/app/src/main/AndroidManifest.xml`
- [X] T005 [P] Update Android README for Compose Material 3 setup, JBR, API startup, build, coverage, and Maestro commands in `mobile/android/README.md`
- [X] T006 [P] Update local Android CI helper for unit tests, coverage, build, install, and Maestro prerequisite checks in `mobile/android/scripts/ci.sh`
- [X] T007 [P] Verify Gradle wrapper and Kotlin/AGP baseline in `mobile/android/gradle/wrapper/gradle-wrapper.properties`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, ports, validation, localization, API error mapping, HTTP adapter, camera adapter, Compose shell, and test infrastructure that must exist before user-story completion.

**Critical**: No user story is complete until this phase is complete.

- [X] T008 [P] Define AuthMode, AppScreen, CameraScreenState, MobileUser, Session, MeasurementImage, Measurement, HistoryFilter, HistoryTableRow, PasswordInput, MeasurementDetail deferred marker, and ApiError concepts in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt`
- [X] T009 [P] Add domain model unit tests for auth modes, screen transitions, sessions, measurements, camera state, history filters, password input expectations, and deferred measurement detail in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt`
- [X] T010 [P] Define auth, session, upload, history, and camera ports in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt`
- [X] T011 [P] Implement shared email, password, image, and history filter validators in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/validation/Validators.kt`
- [X] T012 [P] Add validator unit tests for email, password, image metadata, date filter bounds, and deferred measurement detail behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/validation/ValidatorsTest.kt`
- [X] T013 Implement shared app flow routes for Auth, Guide, Camera, History, upload success-to-history, and deferred detail behavior in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [X] T014 [P] Add app flow unit tests for auth routing, guide-to-camera, login-to-camera, camera history, upload-to-history, and history row non-navigation in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [X] T015 [P] Implement shared API error mapping from API message bodies and network, timeout, parse, and unexpected fallbacks in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapper.kt`
- [X] T016 [P] Add API error mapper unit tests for API messages and every fallback source in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapperTest.kt`
- [X] T017 Implement HTTP auth, upload, and history API client behavior against `http://10.0.2.2:3000` in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [X] T018 [P] Add HTTP API client unit tests for signin, login, upload, history, JSON escaping, API error bodies, malformed responses, and network failures in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [X] T019 [P] Implement session storage adapter for active session state in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/session/InMemorySessionStore.kt`
- [X] T020 [P] Add session storage unit tests for save, load, clear, and replacement behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/session/InMemorySessionStoreTest.kt`
- [X] T021 [P] Implement generated camera image gateway for deterministic capture/upload validation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGateway.kt`
- [X] T022 [P] Add generated camera gateway unit tests for image URI, MIME type, and size metadata in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGatewayTest.kt`
- [X] T023 [P] Create Compose Material 3 app theme and screen scaffolding helpers in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/theme/AppTheme.kt`
- [X] T024 [P] Define stable Compose semantics/test tags for auth, guide, camera, history, date selectors, errors, and table columns in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/TestTags.kt`
- [X] T025 [P] Define localized labels, buttons, status messages, errors, accessibility text, history table labels, and date selector strings in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T026 Wire MainActivity to Compose setContent, dependency creation, and root navigation state in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: Foundation ready. User story tasks can complete independently after Phase 2.

---

## Phase 3: User Story 1 - Create Account And Enter Guide (Priority: P1) MVP

**Goal**: A new user selects New Account on the combined auth screen, creates an account, stores the returned session, and lands on the guide screen.

**Independent Test**: Run the app against the local API, select New Account, submit valid new-account credentials, verify the guide screen appears, and verify account-creation API errors remain visible on the auth screen.

### Tests for User Story 1 (Required)

- [X] T027 [P] [US1] Add AuthFlow unit tests for New Account validation, success session storage, guide navigation, API error display, and network error display in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [X] T028 [P] [US1] Add HTTP client unit tests for `POST /api/v1/signin` success, validation error, duplicate email error, and malformed response mapping in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [X] T029 [P] [US1] Add happy-path Maestro New Account flow using stable Compose semantics in `mobile/android/maestro/us1-signin.yaml`

### Implementation for User Story 1

- [X] T030 [P] [US1] Add localized New Account mode, email, password, submit, loading, validation, and error text in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T031 [US1] Implement New Account flow validation, API call, session save, error state, and guide destination in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [X] T032 [US1] Implement combined AuthScreen New Account mode with Compose Material 3 text fields, password masking, submit button, and error region in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/AuthScreen.kt`
- [X] T033 [US1] Wire New Account mode events from AuthScreen to AuthFlow and Guide navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Read Measurement Guide (Priority: P2)

**Goal**: An authenticated user sees localized placeholder guidance requesting a clear picture with the tonometer and arm visible, then taps Next to reach the camera screen.

**Independent Test**: Start after New Account creation, verify guide content is visible, tap Next, and verify camera upload/history actions appear.

### Tests for User Story 2 (Required)

- [X] T034 [P] [US2] Add guide flow unit tests for guide display state and Next-to-camera navigation in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [X] T035 [P] [US2] Add happy-path Maestro guide-to-camera flow using stable Compose semantics in `mobile/android/maestro/us2-guide.yaml`

### Implementation for User Story 2

- [X] T036 [P] [US2] Add localized guide title, clear-picture guidance, Next button, and accessibility labels in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T037 [US2] Implement guide flow state and camera destination in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [X] T038 [US2] Implement Compose Material 3 GuideScreen rendering and Next action in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/GuideScreen.kt`
- [X] T039 [US2] Wire GuideScreen Next event to camera navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US2 works independently after authenticated New Account setup and does not require US3-US5.

---

## Phase 5: User Story 3 - Log In And Enter Camera Screen (Priority: P3)

**Goal**: An existing user selects Login on the combined auth screen, logs in with email/password, stores the returned session, and lands on the camera screen.

**Independent Test**: Run the app against the local API with an existing user, select Login, submit valid credentials, verify the camera screen appears, and verify login API errors remain visible on the auth screen.

### Tests for User Story 3 (Required)

- [X] T040 [P] [US3] Add AuthFlow unit tests for Login validation, success session storage, camera navigation, unauthorized error display, and network error display in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [X] T041 [P] [US3] Add HTTP client unit tests for `POST /api/v1/login` success, unauthorized error, validation error, rate limit error, and malformed response mapping in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [X] T042 [P] [US3] Add happy-path Maestro Login flow using stable Compose semantics and seeded credentials in `mobile/android/maestro/us3-login.yaml`

### Implementation for User Story 3

- [X] T043 [P] [US3] Add localized Login mode, email, password, submit, loading, validation, and error text in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T044 [US3] Implement Login flow validation, API call, session save, error state, and camera destination in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [X] T045 [US3] Implement combined AuthScreen Login mode with Compose Material 3 text fields, password masking, submit button, and error region in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/AuthScreen.kt`
- [X] T046 [US3] Wire Login mode events from AuthScreen to AuthFlow and Camera navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US3 is independently functional for returning users.

---

## Phase 6: User Story 4 - Use Camera Or Open History (Priority: P4)

**Goal**: An authenticated user uses the camera screen to upload a measurement image or open saved history, with successful uploads navigating to history and errors visible with retry/navigation options.

**Independent Test**: Reach the camera screen, upload a measurement image and verify history opens, then use the camera screen History button and verify history filter UI appears.

### Tests for User Story 4 (Required)

- [X] T047 [P] [US4] Add CameraFlow unit tests for upload success-to-history, missing session, API error display, network error display, retry state, and History button navigation in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [X] T048 [P] [US4] Add HTTP client unit tests for authenticated multipart `POST /api/v1/measurements` success, unauthorized error, validation error, and upload body formatting in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [X] T049 [P] [US4] Add generated camera gateway unit tests for deterministic image metadata used by capture in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGatewayTest.kt`
- [X] T050 [P] [US4] Add happy-path Maestro camera upload/history flow using stable Compose semantics in `mobile/android/maestro/us4-capture-or-history.yaml`

### Implementation for User Story 4

- [X] T051 [P] [US4] Add localized camera title, capture/upload action, upload complete, upload error, retry, history, and back strings in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T052 [US4] Implement camera flow for session lookup, generated image capture, authenticated upload, success-to-history route, History button route, and API error state in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [X] T053 [US4] Implement Compose Material 3 CameraScreen with capture/upload action, upload status, retry, error region, and History button in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt`
- [X] T054 [US4] Implement upload request construction and response parsing in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [X] T055 [US4] Wire CameraScreen upload success and History button to History navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US4 works independently from the authenticated camera screen and does not implement measurement detail/review/save.

---

## Phase 7: User Story 5 - Browse Measurement History (Priority: P5)

**Goal**: An authenticated user sees saved measurement history rows in aligned columns, filters by inclusive date range using Material 3 date selectors, sees empty/error states, and cannot open or edit measurement details.

**Independent Test**: Use seeded saved measurements, open history from camera, select and apply a date range filter, verify aligned row values and selected filters remain visible, and confirm rows are non-clickable.

### Tests for User Story 5 (Required)

- [X] T056 [P] [US5] Add HistoryFlow unit tests for initial load, date selector state, date range validation, from-after-to validation, empty state, pagination state, API error display, network error display, retry, and non-clickable row behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [X] T057 [P] [US5] Add HTTP client unit tests for authenticated `GET /api/v1/measurements` query parameters, inclusive filters, pagination, success mapping, error mapping, and malformed responses in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [X] T058 [P] [US5] Add domain model or formatter unit tests for HistoryTableRow column order, localized value mapping, and aligned row data in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt`
- [X] T059 [P] [US5] Add happy-path Maestro history filter flow using stable Compose semantics and seeded measurement data in `mobile/android/maestro/us5-history-filter.yaml`

### Implementation for User Story 5

- [X] T060 [P] [US5] Add localized history title, table headers, date selector labels, selected date text, apply filter, clear filter, empty state, retry, return, arm labels, and status labels in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T061 [P] [US5] Add stable Compose semantics for date selector controls and history table columns in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/TestTags.kt`
- [X] T062 [US5] Implement history flow for session lookup, date filter state, inclusive bounds, validation, API errors, empty state, retry, and non-clickable rows in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [X] T063 [US5] Implement history list API request, query parameters, response parsing, pagination flags, and error mapping in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [X] T064 [US5] Implement Compose Material 3 HistoryScreen with date selectors, apply/clear controls, error/empty states, and return navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/HistoryScreen.kt`
- [X] T065 [US5] Render history rows as vertically aligned Compose table columns for measurement time, systolic, diastolic, pulse, arm side, and status in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/HistoryScreen.kt`
- [X] T066 [US5] Ensure history rows have no click navigation and no detail, image review, override, or save affordances in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/HistoryScreen.kt`
- [X] T067 [US5] Wire HistoryScreen load, filter, retry, clear, and return events in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt`

**Checkpoint**: US5 is independently functional and verifies that measurement detail workflows remain absent.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate Compose layout, localization, coverage, Maestro happy paths, documentation, and the Android-only boundary across all in-scope stories.

- [X] T068 [P] Audit Kotlin/Compose code for hardcoded visible strings and move findings to localized resources in `mobile/android/app/src/main/res/values/strings.xml`
- [X] T069 [P] Audit Maestro flows for stable Compose semantics and localized-string-safe assertions in `mobile/android/maestro/`
- [X] T070 [P] Update Android README validation instructions for Compose Material 3, API base URL, Android Studio JBR, unit coverage, build, and Maestro commands in `mobile/android/README.md`
- [X] T071 [P] Verify Android CI helper covers Compose dependencies, unit coverage, debug build, and Maestro flows in `mobile/android/scripts/ci.sh`
- [X] T072 Run Android unit tests and verify `>= 95%` JaCoCo coverage using `./gradlew :app:testDebugUnitTest :app:androidCoverageVerify` from `mobile/android`
- [X] T073 Run Android debug build using `./gradlew :app:assembleDebug` from `mobile/android`
- [X] T074 Run all in-scope Maestro happy paths from `mobile/android/maestro/`
- [X] T075 Verify the final implementation diff contains mobile implementation changes only under `mobile/android` and Spec Kit task metadata in `specs/009-android-mobile-app/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks completion of all user stories.
- **Phase 3: US1** depends on Phase 2 and is the MVP.
- **Phase 4: US2** depends on Phase 2 and can be implemented after or alongside US1 if authenticated state is provided by fakes.
- **Phase 5: US3** depends on Phase 2 and can be implemented independently of US1/US2.
- **Phase 6: US4** depends on Phase 2 and requires authenticated camera route support.
- **Phase 7: US5** depends on Phase 2 and requires authenticated route support and history repository behavior.
- **Final Phase** depends on all selected in-scope stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories after Phase 2.
- **US2 (P2)**: Product journey follows US1, but implementation can use authenticated fakes after Phase 2.
- **US3 (P3)**: No dependency on US1 or US2 after shared auth foundation exists.
- **US4 (P4)**: No dependency on US5; requires authenticated session foundation and camera route.
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
Task: T027 Add AuthFlow New Account tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T028 Add signin HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T029 Add Maestro New Account flow in mobile/android/maestro/us1-signin.yaml
Task: T030 Add localized New Account strings in mobile/android/app/src/main/res/values/strings.xml
```

### User Story 2

```text
Task: T034 Add guide flow tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T035 Add Maestro guide-to-camera flow in mobile/android/maestro/us2-guide.yaml
Task: T036 Add localized guide strings in mobile/android/app/src/main/res/values/strings.xml
```

### User Story 3

```text
Task: T040 Add Login flow tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T041 Add login HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T042 Add Maestro Login flow in mobile/android/maestro/us3-login.yaml
```

### User Story 4

```text
Task: T047 Add camera/upload flow tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T048 Add upload HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T050 Add Maestro camera upload/history flow in mobile/android/maestro/us4-capture-or-history.yaml
```

### User Story 5

```text
Task: T056 Add history flow tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
Task: T057 Add history HTTP client tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt
Task: T058 Add history row model/formatter tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt
Task: T059 Add Maestro history filter flow in mobile/android/maestro/us5-history-filter.yaml
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

1. Setup and foundation establish Compose Material 3, architecture, localization, API error handling, session storage, adapters, and test support.
2. US1 delivers New Account creation and guide entry as the MVP.
3. US2 completes the guide-to-camera path.
4. US3 adds returning-user login directly to camera.
5. US4 adds camera upload and History navigation, including upload-success-to-history.
6. US5 adds saved history browsing with date selectors and aligned table rows while keeping measurement detail deferred.
7. Final phase validates localization, Maestro, coverage, build, docs, and path boundaries.

### Boundary Strategy

- Use `docs/openapi.yaml` and `specs/009-android-mobile-app/contracts/api-client.md` as read-only references.
- Keep all implementation files under `mobile/android`.
- Do not modify API code, API tests, backend tests, or OpenAPI docs for this feature.
- Defer US6 measurement detail/review/override/save behavior entirely.
