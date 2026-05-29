# Tasks: Android Mobile App

**Input**: Design documents from `/specs/009-android-mobile-app/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Test tasks are required. Every user story includes Android unit tests and one happy-path Maestro flow while preserving Android CI coverage >= 95%.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Android project tooling and baseline configuration for all stories.

- [ ] T001 Verify Android Gradle and Kotlin baseline versions in `mobile/android/build.gradle.kts` and `mobile/android/gradle/libs.versions.toml`
- [ ] T002 Configure Android app module plugins, build features, and Jacoco in `mobile/android/app/build.gradle.kts`
- [ ] T003 [P] Configure project-wide Gradle properties in `mobile/android/gradle.properties`
- [ ] T004 [P] Set Android manifest baseline for app launch and permissions in `mobile/android/app/src/main/AndroidManifest.xml`
- [ ] T005 [P] Define stable UI test IDs and tags in `mobile/android/app/src/main/res/values/ids.xml` and `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/TestTags.kt`
- [ ] T006 [P] Initialize Maestro flow catalog and naming guidance in `mobile/android/maestro/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared domain, adapter, localization, and environment-config foundations required by all user stories.

**CRITICAL**: No user-story implementation should begin until this phase is complete.

- [ ] T007 Implement domain entities and app-state models in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt`
- [ ] T008 Implement application ports for auth/history/upload/detail/session in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt`
- [ ] T009 Implement core validation helpers in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/validation/Validators.kt`
- [ ] T010 Implement central flow/navigation orchestration in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T011 Implement centralized API error mapping in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapper.kt`
- [ ] T012 Implement HTTP API client adapter using OpenAPI contract in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [ ] T013 [P] Implement session persistence adapter in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/session/InMemorySessionStore.kt`
- [ ] T014 [P] Implement generated camera gateway baseline in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGateway.kt`
- [ ] T015 Configure environment-based API URL via `buildConfigField` and Gradle property resolution in `mobile/android/app/build.gradle.kts`
- [ ] T016 [P] Add localized baseline string resources in `mobile/android/app/src/main/res/values/strings.xml` and `mobile/android/app/src/main/res/values-es/strings.xml`
- [ ] T017 [P] Add foundational unit tests for models, validators, and flows in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModelsTest.kt`, `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/validation/ValidatorsTest.kt`, and `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T018 [P] Add foundational unit tests for API, errors, camera, and session adapters in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapperTest.kt`, `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`, `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/GeneratedCameraGatewayTest.kt`, and `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/session/InMemorySessionStoreTest.kt`

**Checkpoint**: Foundation complete. US1-US6 can proceed independently.

---

## Phase 3: User Story 1 - Create Account And Enter Guide (Priority: P1) 🎯 MVP

**Goal**: Let a signed-out user create a new account from the combined auth screen and land on the guide screen.

**Independent Test**: Launch app signed out, complete New Account with valid credentials, and verify navigation to guide with user-visible API errors on failure.

### Tests for User Story 1

- [ ] T019 [P] [US1] Add auth new-account validation and state unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T020 [P] [US1] Add auth API error mapping assertions for new-account failures in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/ApiErrorMapperTest.kt`
- [ ] T021 [P] [US1] Implement happy-path Maestro flow for signin in `mobile/android/maestro/us1-signin.yaml`

### Implementation for User Story 1

- [ ] T022 [US1] Implement combined auth UI with Login/New Account modes in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/AuthScreen.kt`
- [ ] T023 [US1] Wire New Account submission and success navigation to guide in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T024 [US1] Add localized New Account labels, actions, and error text in `mobile/android/app/src/main/res/values/strings.xml` and `mobile/android/app/src/main/res/values-es/strings.xml`

**Checkpoint**: US1 is functional and independently testable.

---

## Phase 4: User Story 2 - Read Measurement Guide (Priority: P2)

**Goal**: Show guide instructions after signup and allow user to continue to camera.

**Independent Test**: Reach guide from new-account flow, verify localized guide copy, tap Next, and verify camera screen opens.

### Tests for User Story 2

- [ ] T025 [P] [US2] Add guide screen state/navigation unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T026 [P] [US2] Implement happy-path Maestro flow for guide transition in `mobile/android/maestro/us2-guide.yaml`

### Implementation for User Story 2

- [ ] T027 [US2] Implement guide UI and Next action in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/GuideScreen.kt`
- [ ] T028 [US2] Add localized guide copy and Next button strings in `mobile/android/app/src/main/res/values/strings.xml` and `mobile/android/app/src/main/res/values-es/strings.xml`

**Checkpoint**: US2 is functional and independently testable.

---

## Phase 5: User Story 3 - Log In And Enter Camera Screen (Priority: P3)

**Goal**: Let existing users log in from the same auth screen and navigate directly to camera.

**Independent Test**: From signed-out app, switch to Login mode, submit valid credentials, and verify camera screen loads with visible API errors on failure.

### Tests for User Story 3

- [ ] T029 [P] [US3] Add login-mode flow and session unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T030 [P] [US3] Implement happy-path Maestro flow for login in `mobile/android/maestro/us3-login.yaml`

### Implementation for User Story 3

- [ ] T031 [US3] Implement login-mode submit behavior on combined auth screen in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/AuthScreen.kt`
- [ ] T032 [US3] Wire login success navigation to camera and login error visibility in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T033 [US3] Enforce Android-standard password masking behavior in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/AuthScreen.kt`

**Checkpoint**: US3 is functional and independently testable.

---

## Phase 6: User Story 4 - Use Camera Or Open History (Priority: P4)

**Goal**: Provide camera/upload action and History shortcut from camera screen.

**Independent Test**: Reach camera, run successful capture/upload to open history, and separately open history via History button.

### Tests for User Story 4

- [ ] T034 [P] [US4] Add camera/upload success and failure unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T035 [P] [US4] Add upload request/response unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T036 [P] [US4] Implement happy-path Maestro flow for capture-or-history in `mobile/android/maestro/us4-capture-or-history.yaml`

### Implementation for User Story 4

- [ ] T037 [US4] Implement camera screen UI actions and upload state rendering in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt`
- [ ] T038 [US4] Wire camera/upload workflow and post-upload history navigation in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T039 [US4] Ensure user-visible upload/API errors on camera screen in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt`

**Checkpoint**: US4 is functional and independently testable.

---

## Phase 7: User Story 5 - Browse Measurement History (Priority: P5)

**Goal**: Display aligned history rows, allow date-range filtering via date pickers, and support row tap to detail.

**Independent Test**: Open history, apply date filter with selectors, verify filtered aligned rows, and tap a row to navigate to detail.

### Tests for User Story 5

- [ ] T040 [P] [US5] Add history filtering and pagination-state unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T041 [P] [US5] Add history endpoint query/response unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T042 [P] [US5] Implement happy-path Maestro flow for history filtering in `mobile/android/maestro/us5-history-filter.yaml`

### Implementation for User Story 5

- [ ] T043 [US5] Implement history table UI with stable aligned columns in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/HistoryScreen.kt`
- [ ] T044 [US5] Implement date selector controls and filter apply/reset behavior in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/HistoryScreen.kt`
- [ ] T045 [US5] Wire history load/filter logic and error handling in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T046 [US5] Wire row-tap navigation intent to measurement detail in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/HistoryScreen.kt`
- [ ] T047 [US5] Add localized history headers, filter labels, and empty/error state text in `mobile/android/app/src/main/res/values/strings.xml` and `mobile/android/app/src/main/res/values-es/strings.xml`

**Checkpoint**: US5 is functional and independently testable.

---

## Phase 8: User Story 6 - Measurement Detail Edit And Save (Priority: P6)

**Goal**: Show measurement detail from history row, allow editable recognized values, save through API contract, and return to history via Back.

**Independent Test**: Open detail from history row, edit a recognized field, save successfully, and use Back to return to history.

### Tests for User Story 6

- [ ] T048 [P] [US6] Add measurement-detail state/edit/save unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`
- [ ] T049 [P] [US6] Add measurement detail/read/save API adapter unit tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClientTest.kt`
- [ ] T050 [P] [US6] Implement happy-path Maestro flow for measurement detail in `mobile/android/maestro/us6-measurement-detail.yaml`

### Implementation for User Story 6

- [ ] T051 [US6] Implement measurement-detail UI (image, recognized fields, editable values, Save, Back) in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/MeasurementDetailScreen.kt`
- [ ] T052 [US6] Wire detail fetch/edit/save/back logic in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt`
- [ ] T053 [US6] Extend HTTP adapter for detail/read/save operations using existing OpenAPI contract in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/api/HttpApiClient.kt`
- [ ] T054 [US6] Ensure detail save errors are user-visible and localized in `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/MeasurementDetailScreen.kt`
- [ ] T055 [US6] Add localized measurement-detail labels/actions/messages in `mobile/android/app/src/main/res/values/strings.xml` and `mobile/android/app/src/main/res/values-es/strings.xml`

**Checkpoint**: US6 is functional and independently testable.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks spanning all stories.

- [ ] T056 [P] Run Android unit test suite in `mobile/android/app/src/test/kotlin/` via `mobile/android/gradlew :app:testDebugUnitTest`
- [ ] T057 [P] Verify Android coverage gate >= 95% via `mobile/android/gradlew :app:androidCoverageVerify`
- [ ] T058 [P] Run all Maestro happy-path flows in `mobile/android/maestro/us1-signin.yaml`, `mobile/android/maestro/us2-guide.yaml`, `mobile/android/maestro/us3-login.yaml`, `mobile/android/maestro/us4-capture-or-history.yaml`, `mobile/android/maestro/us5-history-filter.yaml`, and `mobile/android/maestro/us6-measurement-detail.yaml`
- [ ] T059 Validate API base URL environment injection (`local.properties`, CI env var, release default) in `mobile/android/app/build.gradle.kts` and `mobile/android/local.properties`
- [ ] T060 Reconcile API-client and Maestro contract docs with implemented US6 detail behavior in `specs/009-android-mobile-app/contracts/api-client.md` and `specs/009-android-mobile-app/contracts/maestro-flows.md`
- [ ] T061 Execute quickstart validation steps from `specs/009-android-mobile-app/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories
- Phases 3-8 (US1-US6): depend on Phase 2; then execute in priority order or parallel with staffing
- Final Phase (Polish): depends on completion of all targeted user stories

### User Story Dependencies

- US1: starts after Phase 2; independent MVP
- US2: depends on US1 signup route to guide
- US3: independent of US2; shares auth foundation from Phase 2
- US4: depends on authenticated camera entry from US2/US3
- US5: depends on history entry path from US4
- US6: depends on row selection from US5

### Within Each User Story

- Write tests first and confirm they fail before implementation
- Implement UI and flow logic next
- Complete localization and API error visibility requirements before story sign-off
- Keep all implementation changes under `mobile/android`

## Parallel Execution Examples

### US1

- `T019` and `T020` can run in parallel (different test files)
- `T021` can run in parallel with `T024` after UI tags are stable

### US2

- `T025` and `T026` can run in parallel

### US3

- `T029` and `T030` can run in parallel

### US4

- `T034`, `T035`, and `T036` can run in parallel

### US5

- `T040`, `T041`, and `T042` can run in parallel

### US6

- `T048`, `T049`, and `T050` can run in parallel

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2
2. Deliver US1 (Phase 3)
3. Validate US1 independently (unit tests + Maestro)
4. Demo MVP

### Incremental Delivery

1. Add US2 (guide) and validate
2. Add US3 (login path) and validate
3. Add US4 (camera/upload/history entry) and validate
4. Add US5 (history/filter/row tap) and validate
5. Add US6 (detail/edit/save/back) and validate
6. Run final polish gates (coverage, Maestro, quickstart)
