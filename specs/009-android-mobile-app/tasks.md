---

description: "Task list for Android mobile app implementation"
---

# Tasks: Android Mobile App

**Input**: Design documents from `/specs/009-android-mobile-app/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-client.md, contracts/maestro-flows.md, quickstart.md

**Tests**: Required. Each in-scope user story US1-US5 includes Android unit tests and one happy-path Maestro flow. Android unit coverage must verify `>= 95%`. The initial hello world scaffold remains exempt from tests only as a scaffold milestone.

**Implementation Boundary**: Application implementation changes for this feature must remain under `mobile/android`. Do not change API code, API tests, backend tests, or `docs/openapi.yaml`. Treat `docs/openapi.yaml` as a read-only API reference.

**Localization**: Every visible Android string or text value must come from localized resources or an equivalent localization mechanism. Hardcoded visible text in Kotlin, layouts, tests, and Maestro flows is prohibited.

**Deferred Scope**: US6 is deferred. Do not implement measurement detail, image review, value override, or reviewed save workflows.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: Required for user story phase tasks only
- Every task includes a concrete file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Android-only implementation structure, dependencies, and validation commands without touching API/backend files.

- [ ] T001 Verify the existing Android scaffold builds from `mobile/android` and record the command in `mobile/android/README.md`
- [ ] T002 [P] Pin Android dependency versions for Compose, Material 3, Navigation, Lifecycle, CameraX, DataStore, coroutines, serialization, OkHttp, JUnit, MockWebServer, Turbine, and Compose testing in `mobile/android/gradle/libs.versions.toml`
- [ ] T003 Configure Android application, Kotlin serialization, Compose, unit test, and JaCoCo plugins/dependencies in `mobile/android/app/build.gradle.kts`
- [ ] T004 [P] Configure shared Gradle plugin aliases required by the app module in `mobile/android/build.gradle.kts`
- [ ] T005 Create production package directories for app, auth, guide, measurement, history, core, data, navigation, and design system code under `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/`
- [ ] T006 [P] Create unit test package directories for auth, guide, measurement, history, core, data, navigation, and test support under `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/`
- [ ] T007 [P] Create Maestro flow directory and shared Maestro documentation in `mobile/android/maestro/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core app architecture, localization, API boundary, session storage, and test infrastructure that must exist before user-story work begins.

**Critical**: No user story implementation should begin until this phase is complete.

- [ ] T008 [P] Replace hardcoded scaffold text with localized string resources in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt` and `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T009 [P] Create shared localized fallback error strings, validation labels, button labels, loading labels, empty states, and accessibility labels in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T010 [P] Define MobileUser, Session, MeasurementImage, Measurement, HistoryFilter, and ApiError domain models in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt`
- [ ] T011 [P] Define auth, session, upload, history, camera, clock, and dispatcher ports in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt`
- [ ] T012 [P] Implement email, password, image, and history date range validators in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/validation/Validators.kt`
- [ ] T013 [P] Add unit tests for validators and deferred-detail guard behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/validation/ValidatorsTest.kt`
- [ ] T014 [P] Implement shared API error mapping from API `message` and network/timeout/parse fallbacks in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/api/ApiErrorMapper.kt`
- [ ] T015 [P] Add unit tests covering all API error and fallback mapping cases in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/api/ApiErrorMapperTest.kt`
- [ ] T016 [P] Define Kotlin serialization DTOs for AuthResponse, ErrorResponse, UploadMeasurementResponse, and MeasurementHistoryPage in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/api/ApiDtos.kt`
- [ ] T017 Implement OkHttp API client helpers for base URL, JSON requests, authenticated requests, multipart upload, and error-body parsing in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/api/BloodPressureApiClient.kt`
- [ ] T018 [P] Add API client unit tests with MockWebServer for success, API error body, malformed body, and network failure cases in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/api/BloodPressureApiClientTest.kt`
- [ ] T019 Implement DataStore-backed session persistence adapter in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/session/DataStoreSessionStore.kt`
- [ ] T020 [P] Add session persistence unit tests for storing, loading, expiry, unauthorized clearing, and signed-out state in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/session/DataStoreSessionStoreTest.kt`
- [ ] T021 Implement Compose app shell, Material theme, navigation routes, screen test tags, snackbar/error region, and dependency wiring in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/App.kt`
- [ ] T022 [P] Add reusable unit test fakes for repositories, session store, camera gateway, clock, dispatchers, and resource text lookup in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/testsupport/TestFakes.kt`
- [ ] T023 Configure JaCoCo verification for `>= 95%` Android unit line coverage in `mobile/android/app/build.gradle.kts`

**Checkpoint**: Foundation ready. User story implementation can proceed after Phase 2 passes unit tests and coverage verification.

---

## Phase 3: User Story 1 - Create Account And Enter Guide (Priority: P1) MVP

**Goal**: A signed-out new user creates an account with email/password, stores the returned session, and lands on the guide screen.

**Independent Test**: Run the app against the local API, submit valid new-account credentials, verify session storage and guide navigation, and confirm all signin API errors are visible on the signin screen.

### Tests for User Story 1 (Required)

- [ ] T024 [P] [US1] Add SigninViewModel unit tests for input validation, loading state, success session storage, guide navigation, duplicate email, validation, rate limit, and network error display in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/SigninViewModelTest.kt`
- [ ] T025 [P] [US1] Add repository unit tests for `POST /api/v1/signin` request/response mapping using MockWebServer in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/auth/AuthRepositoryTest.kt`
- [ ] T026 [P] [US1] Add Compose UI unit tests for signin fields, localized errors, disabled submit state, loading state, and test tags in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/SigninScreenTest.kt`
- [ ] T027 [P] [US1] Add happy-path Maestro signin flow using stable selectors in `mobile/android/maestro/us1-signin.yaml`

### Implementation for User Story 1

- [ ] T028 [P] [US1] Add localized signin labels, buttons, validation messages, loading text, and error fallback strings in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T029 [US1] Implement auth repository signin call and AuthResponse-to-Session mapping in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/auth/AuthRepository.kt`
- [ ] T030 [US1] Implement SigninViewModel with validation, API error display state, session persistence, and guide navigation command in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/auth/SigninViewModel.kt`
- [ ] T031 [US1] Implement localized Compose signin screen with email/password fields, submit action, visible error region, and stable test tags in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/auth/SigninScreen.kt`
- [ ] T032 [US1] Wire signed-out start route and signin-to-guide navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/navigation/AppNavGraph.kt`
- [ ] T033 [US1] Document local US1 validation commands and required local API setup in `mobile/android/README.md`

**Checkpoint**: US1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Read Measurement Guide (Priority: P2)

**Goal**: An authenticated user sees localized placeholder guidance requesting a clear picture with the tonometer and arm visible, then continues to the measurement action screen.

**Independent Test**: Start from authenticated state, verify localized guide copy, continue, and verify the measurement action screen route is reached.

### Tests for User Story 2 (Required)

- [ ] T034 [P] [US2] Add GuideViewModel unit tests for authenticated entry, continue action, and signed-out redirection behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/guide/GuideViewModelTest.kt`
- [ ] T035 [P] [US2] Add Compose UI unit tests for localized guide text, continue button, error-free state, and stable test tags in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/guide/GuideScreenTest.kt`
- [ ] T036 [P] [US2] Add happy-path Maestro guide flow using stable selectors in `mobile/android/maestro/us2-guide.yaml`

### Implementation for User Story 2

- [ ] T037 [P] [US2] Add localized guide title, copy, continue button, and accessibility labels in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T038 [US2] Implement GuideViewModel with authenticated-session check and continue navigation command in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/guide/GuideViewModel.kt`
- [ ] T039 [US2] Implement localized Compose guide screen with placeholder tonometer-and-arm guidance and stable test tags in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/guide/GuideScreen.kt`
- [ ] T040 [US2] Wire guide-to-measurement-action navigation and authenticated route protection in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/navigation/AppNavGraph.kt`

**Checkpoint**: US2 works independently after signin/authenticated setup and does not require US3-US5.

---

## Phase 5: User Story 3 - Log In And Enter Measurement Actions (Priority: P3)

**Goal**: A signed-out existing user logs in with email/password, stores the returned session, and lands on the measurement action screen.

**Independent Test**: Run the app against the local API with an existing user, submit valid credentials, verify session storage and measurement action navigation, and confirm login API errors are visible on the login screen.

### Tests for User Story 3 (Required)

- [ ] T041 [P] [US3] Add LoginViewModel unit tests for validation, loading state, success session storage, measurement-action navigation, unauthorized, validation, rate limit, and network error display in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/LoginViewModelTest.kt`
- [ ] T042 [P] [US3] Add repository unit tests for `POST /api/v1/login` request/response mapping using MockWebServer in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/auth/LoginRepositoryTest.kt`
- [ ] T043 [P] [US3] Add Compose UI unit tests for login fields, localized errors, disabled submit state, loading state, and test tags in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/LoginScreenTest.kt`
- [ ] T044 [P] [US3] Add happy-path Maestro login flow using stable selectors in `mobile/android/maestro/us3-login.yaml`

### Implementation for User Story 3

- [ ] T045 [P] [US3] Add localized login labels, buttons, navigation link text, validation messages, loading text, and error fallback strings in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T046 [US3] Implement auth repository login call and shared AuthResponse-to-Session reuse in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/auth/AuthRepository.kt`
- [ ] T047 [US3] Implement LoginViewModel with validation, API error display state, session persistence, and measurement-action navigation command in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/auth/LoginViewModel.kt`
- [ ] T048 [US3] Implement localized Compose login screen with email/password fields, submit action, visible error region, signin link, and stable test tags in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/auth/LoginScreen.kt`
- [ ] T049 [US3] Wire signed-out login route and login-to-measurement-action navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/navigation/AppNavGraph.kt`

**Checkpoint**: US3 is independently functional for returning users and shares only completed foundation/auth components.

---

## Phase 6: User Story 4 - Choose Capture Or History (Priority: P4)

**Goal**: An authenticated user can choose camera capture or saved history from the measurement action screen, and capture/upload errors are visible with retry or navigation options.

**Independent Test**: Reach the measurement action screen, tap capture to open camera or permission UI, return, tap history, and verify the history screen opens.

### Tests for User Story 4 (Required)

- [ ] T050 [P] [US4] Add MeasurementActionsViewModel unit tests for authenticated entry, capture navigation, history navigation, signed-out redirect, and expired-session handling in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/measurement/MeasurementActionsViewModelTest.kt`
- [ ] T051 [P] [US4] Add CaptureViewModel unit tests for permission denied, cancelled capture, empty image, unsupported image, oversized image, upload success, API error display, network error display, retry, and navigate-away behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/measurement/CaptureViewModelTest.kt`
- [ ] T052 [P] [US4] Add repository unit tests for authenticated multipart `POST /api/v1/measurements` upload using MockWebServer in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/measurement/MeasurementUploadRepositoryTest.kt`
- [ ] T053 [P] [US4] Add Compose UI unit tests for action buttons, capture screen states, localized upload errors, retry action, and stable test tags in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/measurement/MeasurementScreensTest.kt`
- [ ] T054 [P] [US4] Add happy-path Maestro capture-or-history flow using stable selectors in `mobile/android/maestro/us4-capture-or-history.yaml`

### Implementation for User Story 4

- [ ] T055 [P] [US4] Add localized measurement action, camera permission, capture, upload, retry, history, and error strings in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T056 [US4] Implement MeasurementActionsViewModel with authenticated route state and capture/history navigation commands in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/measurement/MeasurementActionsViewModel.kt`
- [ ] T057 [US4] Implement localized Compose measurement action screen with one-click capture and history actions plus stable test tags in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/measurement/MeasurementActionsScreen.kt`
- [ ] T058 [US4] Implement CameraX capture adapter boundary for opening camera view and returning MeasurementImage metadata in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/camera/CameraXGateway.kt`
- [ ] T059 [US4] Implement measurement upload repository with authenticated multipart image upload and shared API error mapping in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/measurement/MeasurementUploadRepository.kt`
- [ ] T060 [US4] Implement CaptureViewModel and localized Compose capture screen for permission, capture, upload, retry, cancel, and navigate-away states in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/measurement/CaptureScreen.kt`
- [ ] T061 [US4] Wire measurement action, capture, and history routes in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/navigation/AppNavGraph.kt`

**Checkpoint**: US4 works independently from the authenticated action screen and does not implement measurement detail/review/save.

---

## Phase 7: User Story 5 - Browse Measurement History (Priority: P5)

**Goal**: An authenticated user sees saved measurement history rows, filters by inclusive date range, sees empty/error states, and cannot open or edit measurement details.

**Independent Test**: Use seeded saved measurements, open history, apply a date range filter, verify rows and selected filters remain visible, and confirm rows are non-editable.

### Tests for User Story 5 (Required)

- [ ] T062 [P] [US5] Add HistoryViewModel unit tests for initial load, date filter state, invalid date range, from-after-to validation, empty state, pagination, unauthorized clearing, API error display, network error display, retry, and non-editable row behavior in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/history/HistoryViewModelTest.kt`
- [ ] T063 [P] [US5] Add repository unit tests for authenticated `GET /api/v1/measurements` query parameters, inclusive filters, pagination, success mapping, and error mapping using MockWebServer in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/history/HistoryRepositoryTest.kt`
- [ ] T064 [P] [US5] Add Compose UI unit tests for table columns, row display, date filter controls, selected filter visibility, empty state, localized errors, retry/return actions, and non-clickable rows in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/history/HistoryScreenTest.kt`
- [ ] T065 [P] [US5] Add happy-path Maestro history filter flow using stable selectors in `mobile/android/maestro/us5-history-filter.yaml`

### Implementation for User Story 5

- [ ] T066 [P] [US5] Add localized history title, table headers, date filter labels, apply/clear buttons, empty state, pagination labels, retry/return actions, and error strings in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T067 [US5] Implement history repository with authenticated measurement list requests, inclusive from/to query parameters, pagination, and shared API error mapping in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/data/history/HistoryRepository.kt`
- [ ] T068 [US5] Implement HistoryViewModel with loading, filter, validation, pagination, empty, retry, unauthorized, and non-editable row state in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/history/HistoryViewModel.kt`
- [ ] T069 [US5] Implement localized Compose history screen with table columns for measurement time, systolic, diastolic, pulse, arm side, and status in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/history/HistoryScreen.kt`
- [ ] T070 [US5] Ensure history rows have no click navigation and no detail/edit/save affordances in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/history/HistoryScreen.kt`
- [ ] T071 [US5] Wire history route entry, retry, return, and session-expiry behavior in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/navigation/AppNavGraph.kt`

**Checkpoint**: US5 is independently functional and verifies that measurement detail workflows remain absent.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate localization, coverage, Maestro happy paths, documentation, and the Android-only boundary across all in-scope stories.

- [ ] T072 [P] Audit Kotlin and Compose code for hardcoded visible strings and move any findings to localized resources in `mobile/android/app/src/main/res/values/strings.xml`
- [ ] T073 [P] Audit Maestro flows for stable selectors and no hardcoded visible text dependency in `mobile/android/maestro/`
- [ ] T074 [P] Add or update Android README instructions for API base URL, Android Studio JDK/JBR, build, unit coverage, and Maestro commands in `mobile/android/README.md`
- [ ] T075 Run Android unit tests and verify `>= 95%` JaCoCo coverage using `./gradlew :app:testDebugUnitTest :app:androidCoverageVerify` from `mobile/android`
- [ ] T076 Run all in-scope Maestro happy paths for US1-US5 from `mobile/android/maestro/`
- [ ] T077 Run Android debug build using `./gradlew :app:assembleDebug` from `mobile/android`
- [ ] T078 Verify the final feature diff contains implementation changes only under `mobile/android` and this generated plan file at `specs/009-android-mobile-app/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all user stories.
- **Phase 3: US1** depends on Phase 2 and is the MVP.
- **Phase 4: US2** depends on Phase 2 and can be implemented after or alongside US1 if authenticated test state is provided by fakes.
- **Phase 5: US3** depends on Phase 2 and can be implemented independently of US1/US2.
- **Phase 6: US4** depends on Phase 2 and requires authenticated route support; it can use test fakes before US1/US3 are complete.
- **Phase 7: US5** depends on Phase 2 and requires authenticated route support; it can use test fakes before US4 is complete.
- **Final Phase** depends on all selected in-scope stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories after Phase 2.
- **US2 (P2)**: No implementation dependency on US1 if authenticated state is injected; product flow naturally follows US1.
- **US3 (P3)**: No dependency on US1 or US2 after shared auth foundation exists.
- **US4 (P4)**: No dependency on US5; requires authenticated session foundation and navigation shell.
- **US5 (P5)**: No dependency on US4; requires authenticated session foundation and history repository.
- **US6**: Deferred and intentionally omitted.

### Within Each User Story

- Write unit tests and the Maestro happy path before implementation tasks.
- Keep all visible text in localized resources before considering a story complete.
- Keep API errors visible on the current screen for every API and network failure path.
- Preserve the no-API-change boundary; handle API limitations in Android client behavior or defer them to a separate feature.
- Verify coverage remains at or above `95%` as user-story code is added.

---

## Parallel Execution Examples

### User Story 1

```text
Task: T024 Add SigninViewModel unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/SigninViewModelTest.kt
Task: T025 Add signin repository unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/auth/AuthRepositoryTest.kt
Task: T026 Add signin Compose UI tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/SigninScreenTest.kt
Task: T027 Add Maestro signin flow in mobile/android/maestro/us1-signin.yaml
```

### User Story 2

```text
Task: T034 Add GuideViewModel unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/guide/GuideViewModelTest.kt
Task: T035 Add guide Compose UI tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/guide/GuideScreenTest.kt
Task: T036 Add Maestro guide flow in mobile/android/maestro/us2-guide.yaml
```

### User Story 3

```text
Task: T041 Add LoginViewModel unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/LoginViewModelTest.kt
Task: T042 Add login repository unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/auth/LoginRepositoryTest.kt
Task: T043 Add login Compose UI tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/auth/LoginScreenTest.kt
Task: T044 Add Maestro login flow in mobile/android/maestro/us3-login.yaml
```

### User Story 4

```text
Task: T050 Add measurement action unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/measurement/MeasurementActionsViewModelTest.kt
Task: T051 Add capture unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/measurement/CaptureViewModelTest.kt
Task: T052 Add upload repository tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/measurement/MeasurementUploadRepositoryTest.kt
Task: T054 Add Maestro capture-or-history flow in mobile/android/maestro/us4-capture-or-history.yaml
```

### User Story 5

```text
Task: T062 Add HistoryViewModel unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/history/HistoryViewModelTest.kt
Task: T063 Add history repository tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/data/history/HistoryRepositoryTest.kt
Task: T064 Add history Compose UI tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/history/HistoryScreenTest.kt
Task: T065 Add Maestro history filter flow in mobile/android/maestro/us5-history-filter.yaml
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

1. Setup and foundation establish architecture, localization, API error handling, session storage, navigation, and test support.
2. US1 delivers account creation and guide entry as the MVP.
3. US2 completes the guide-to-action path.
4. US3 adds returning-user login.
5. US4 adds capture/history choice and upload error handling.
6. US5 adds saved history browsing with date filters.
7. Final phase validates localization, Maestro, coverage, build, docs, and path boundaries.

### Boundary Strategy

- Use `docs/openapi.yaml` and `specs/009-android-mobile-app/contracts/api-client.md` as read-only references.
- Keep all implementation files under `mobile/android`.
- Do not modify API code, API tests, backend tests, or OpenAPI docs for this feature.
- Defer US6 measurement detail/review/override/save behavior entirely.
