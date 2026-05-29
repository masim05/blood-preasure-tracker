# Tasks: Camera Ready Capture

**Input**: Design documents from /specs/011-fix-camera-view/

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. This feature keeps Android unit coverage >= 95% and includes Maestro happy-path flows for each user story.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare CameraX dependencies, permissions, and localized baseline resources.

- [ ] T001 Add CameraX dependency versions in mobile/android/gradle/libs.versions.toml
- [ ] T002 Add CameraX libraries to mobile/android/app/build.gradle.kts
- [ ] T003 Add camera permission declaration to mobile/android/app/src/main/AndroidManifest.xml
- [ ] T004 [P] Add camera-ready and permission-recovery test tags in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/TestTags.kt
- [ ] T005 [P] Add localized camera-preview, loading, and permission-recovery strings in mobile/android/app/src/main/res/values/strings.xml and mobile/android/app/src/main/res/values-es/strings.xml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared camera architecture and state handling required by both user stories.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [ ] T006 Refactor camera adapter to CameraX-based implementation in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/CameraXCameraGateway.kt
- [ ] T007 Update camera port contracts for ready/capture/error behavior in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt
- [ ] T008 Add camera UI state model for initializing/ready/capturing/uploading/error in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/model/DomainModels.kt
- [ ] T009 Update capture flow to enforce single active capture/upload and route consistency in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T010 Wire new camera gateway and state transitions into activity controller in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T011 [P] Extend foundational camera flow unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T012 [P] Add CameraX adapter unit tests in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/CameraXCameraGatewayTest.kt

**Checkpoint**: Foundation complete, user-story work can proceed.

---

## Phase 3: User Story 1 - Immediate Camera After Login (Priority: P1) MVP

**Goal**: Authenticated user sees live preview immediately and can one-tap capture to reach History after successful upload.

**Independent Test**: Login to Camera route, verify preview is visible, tap capture once, and verify History route on success.

### Tests for User Story 1 (REQUIRED)

- [ ] T013 [P] [US1] Add unit tests for post-login camera-ready route and one-tap capture success in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T014 [P] [US1] Add unit tests for Camera screen loading/disable behavior during capture and upload in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T015 [P] [US1] Update Maestro happy-path flow for live preview and one-tap capture in mobile/android/maestro/us4-capture-or-history.yaml

### Implementation for User Story 1

- [ ] T016 [US1] Replace placeholder camera action UI with live preview container in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt
- [ ] T017 [US1] Integrate PreviewView/AndroidView camera rendering path in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt
- [ ] T018 [US1] Connect one-tap capture action to updated controller state in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T019 [US1] Ensure successful capture/upload transitions Camera -> History in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlows.kt
- [ ] T020 [US1] Show visible capture/upload loading state and disable repeated capture taps in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Usable Camera Screen Recovery (Priority: P2)

**Goal**: User gets clear recovery behavior when camera permission or availability fails, while still retaining non-camera navigation.

**Independent Test**: Enter Camera without permission, verify immediate permission request, verify denied state shows error + Open Settings + History, and verify later recovery path reaches live preview.

### Tests for User Story 2 (REQUIRED)

- [ ] T021 [P] [US2] Add unit tests for permission-denied/unavailable recovery routing in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt
- [ ] T022 [P] [US2] Add unit tests for camera adapter failure mapping and retryability in mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/CameraXCameraGatewayTest.kt
- [ ] T023 [P] [US2] Add Maestro recovery happy-path flow for denied camera with History fallback in mobile/android/maestro/us4-permission-recovery.yaml

### Implementation for User Story 2

- [ ] T024 [US2] Implement automatic camera permission request on Camera entry in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T025 [US2] Add denied/unavailable camera UI with Open Settings and History actions in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt
- [ ] T026 [US2] Implement Open Settings intent handler for camera recovery in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/MainActivity.kt
- [ ] T027 [US2] Map camera initialization/capture failures to user-visible localized errors in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/CameraXCameraGateway.kt
- [ ] T028 [US2] Ensure History action remains enabled during camera error states in mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/ui/screens/CameraScreen.kt

**Checkpoint**: US2 is independently functional and testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks and documentation consistency across stories.

- [ ] T029 [P] Update camera behavior notes and validation steps in mobile/android/README.md
- [ ] T030 Run Android unit tests and coverage gate via mobile/android/app/build.gradle.kts tasks :app:testDebugUnitTest and :app:androidCoverageVerify
- [ ] T031 Run Maestro validation flows in mobile/android/maestro/us4-capture-or-history.yaml and mobile/android/maestro/us4-permission-recovery.yaml
- [ ] T032 Verify scope guard by checking changed files remain under mobile/android and no API code/tests changed using /Users/max/src/github.com/masim05/blood-preasure-tracker

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup: no dependencies.
- Phase 2 Foundational: depends on Phase 1 and blocks all stories.
- Phase 3 US1: depends on Phase 2 completion.
- Phase 4 US2: depends on Phase 2 completion; can run after US1 or in parallel with late US1 tasks if no file conflicts.
- Phase 5 Polish: depends on completion of selected user stories.

### User Story Dependencies

- US1 (P1): starts after Foundational, independent MVP.
- US2 (P2): starts after Foundational; depends on shared camera architecture from Phase 2 but not on US1 business acceptance.

### Within Each User Story

- Write tests first and confirm they fail for new behavior.
- Implement adapter and flow logic before final UI wiring where dependencies apply.
- Keep all visible text localized before closing story.
- Keep Maestro flow updated before story sign-off.

## Parallel Opportunities

- Phase 1 parallel: T004 and T005.
- Phase 2 parallel: T011 and T012 after T006-T010 scaffold is in place.
- US1 parallel: T013, T014, T015.
- US2 parallel: T021, T022, T023.
- Polish parallel: T029 and T032.

## Parallel Example: User Story 1

- Run T013, T014, and T015 in parallel since they target separate test files/flows.
- Run T016 and T019 in parallel only after T009 is complete, because T016 is UI-focused and T019 is flow-focused.

## Parallel Example: User Story 2

- Run T021, T022, and T023 in parallel while implementation tasks are pending.
- Run T025 and T027 in parallel after T024 because UI recovery rendering and adapter error mapping are in different files.

## Implementation Strategy

### MVP First (US1)

1. Finish Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate US1 independently with tests and Maestro.
4. Demo/deploy MVP camera-ready flow.

### Incremental Delivery

1. Setup + Foundation.
2. Deliver US1 (live preview + one-tap capture to History).
3. Deliver US2 (permission/error recovery).
4. Run polish validations and finalize.

### Parallel Team Strategy

1. One developer handles CameraX adapter and flow tasks (T006-T010).
2. One developer handles camera UI and localization (T005, T016-T018, T025, T028).
3. One developer handles test and Maestro updates (T011-T015, T021-T023, T030-T031).

## Notes

- [P] means parallelizable with no incomplete dependency conflict.
- [US1]/[US2] labels map directly to spec user stories.
- Keep implementation app-only under mobile/android.
- Do not modify API code or API tests.
- Maintain Android unit coverage >= 95%.