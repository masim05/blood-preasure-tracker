# Feature Specification: Camera Ready Capture

**Feature Branch**: `[011-fix-camera-view]`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "when I login, I see screen \"Camera\" with two buttons: \"take picture\" and \"History.\" However, I should see working camera and be able to take a picture with one click. it is app only change, no api code or test should change."

## Clarifications

### Session 2026-05-29

- Q: After one-tap capture and successful upload, which screen should open next? → A: Navigate to History screen.
- Q: How should camera permission be handled when entering the camera screen without permission? → A: Automatically request permission on camera-screen entry.
- Q: How should repeated taps be handled while capture/upload is in progress? → A: Disable capture during capture/upload and show loading state.
- Q: What recovery actions should be shown when camera permission is denied? → A: Show error with Open Settings and History actions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immediate Camera After Login (Priority: P1)

As an authenticated user, I land on a camera screen that immediately shows a live camera preview and lets me capture a measurement image with a single tap.

**Why this priority**: This is the primary value path for measurement capture and is currently broken for users after login.

**Independent Test**: Can be fully tested by signing in with valid credentials, confirming a live preview is visible, and taking a picture in one tap to reach the next expected app state.

**Acceptance Scenarios**:

1. **Given** a user successfully signs in, **When** the camera screen opens, **Then** a live camera preview is visible without additional user action.
2. **Given** a user is on the camera screen with a live preview, **When** the user taps capture once and upload succeeds, **Then** the app captures the image and navigates to History.
3. **Given** camera permission is not yet granted, **When** the camera screen opens, **Then** the app immediately requests camera permission.
4. **Given** an image capture/upload is in progress, **When** the user attempts additional capture taps, **Then** capture is temporarily disabled and a loading state is shown until completion or failure.
5. **Given** camera permission is denied, **When** the denial state is shown, **Then** the UI provides Open Settings and History actions.

---

### User Story 2 - Usable Camera Screen Recovery (Priority: P2)

As an authenticated user, if camera access is not available, I receive a clear error message and can still continue with available actions such as viewing history.

**Why this priority**: Prevents dead-end behavior and preserves usability when device permissions or hardware access fail.

**Independent Test**: Can be fully tested by denying camera permission and verifying that the app shows an error and still allows navigation to history.

**Acceptance Scenarios**:

1. **Given** camera access is denied or unavailable, **When** the camera screen loads, **Then** the user sees a clear error message and can still use non-camera actions.
2. **Given** camera access later becomes available, **When** the user returns to camera capture, **Then** the live preview is shown and one-tap capture works.

### Edge Cases

- User signs in successfully but camera permission was previously denied.
- Device camera initialization fails temporarily after app resume.
- User taps capture while camera is still initializing.
- Network/API upload fails after successful capture and the error must be visible to the user.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/core/ports/Ports.kt` (camera-ready/capture/error behavior contracts)
- **Adapters Affected**: `mobile/android/app/src/main/kotlin/com/masim05/bloodpressure/mobile/adapters/camera/CameraXCameraGateway.kt` (CameraX preview/capture and failure mapping)
- **Boundary Guarantee**: No backend domain or API boundary changes are introduced; scope remains in mobile app presentation and flow behavior.
- **Node.js Version Baseline**: Unchanged (no Node.js runtime changes in this feature)
- **NestJS Version Baseline**: Unchanged (no NestJS runtime changes in this feature)
- **Android Source Location**: `mobile/android`
- **Kotlin Version Baseline**: Latest active LTS Kotlin baseline used by the project at implementation time
- **API Error UX**: Any API error encountered during post-capture or related mobile actions is surfaced to the user with a clear on-screen message.
- **Localization Impact**: Every user-visible string added or changed for camera states/errors is localized.
- **Maestro Coverage**: Add at least one happy-path Maestro flow for this user story (login to live camera to one-tap capture).
- **Mobile Unit Coverage**: Preserve CI gate of at least 95% unit coverage for Android mobile code.
- **Dependency Selection Rationale**: Reuse existing mobile dependencies and platform-recommended patterns; no new dependency unless required and justified.
- **Existing Test Impact**: No changes to API code or API tests.
- **New Test Coverage**: Mobile-only tests validating post-login camera readiness, one-tap capture behavior, camera-unavailable recovery messaging/actions, API upload error visibility, and auth persistence regression.
- **Coverage Plan**: Keep or improve Android unit coverage to remain at or above 95% in CI; add focused tests for changed camera flow states.
- **Worktree Path**: `tmp/011-fix-camera-view`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST route authenticated existing users directly into a camera experience that is immediately ready for capture.
- **FR-002**: System MUST show a live camera preview on the camera screen without requiring a preliminary "take picture" action.
- **FR-003**: Users MUST be able to capture a measurement image with a single tap from the camera screen.
- **FR-004**: System MUST preserve access to measurement history from the camera screen.
- **FR-005**: System MUST automatically request camera permission when entering camera screen if permission is not yet granted, and MUST show a clear user-facing error whenever camera initialization fails or permission is unavailable.
- **FR-006**: System MUST show a clear user-facing error for any API error encountered during the mobile capture flow.
- **FR-007**: All user-visible text introduced or changed by this feature MUST be localized.
- **FR-008**: Scope MUST be limited to Android app source under `mobile/android`.
- **FR-009**: API code and API tests MUST remain unchanged.
- **FR-010**: Android implementation MUST continue targeting the project baseline of latest active LTS Kotlin.
- **FR-011**: At least one happy-path Maestro scenario MUST verify login to live camera to one-tap capture.
- **FR-012**: Android unit-test coverage in CI MUST remain at or above 95%.
- **FR-013**: Existing login persistence behavior (token survives app restart within configured validity) MUST remain intact.
- **FR-014**: After one-tap capture and successful image upload, the app MUST navigate from Camera to History.
- **FR-015**: While image capture/upload is in progress, the capture action MUST be disabled and a visible loading state MUST be shown until success or failure.
- **FR-016**: When camera permission is denied, the camera screen MUST show a clear error with both Open Settings and History actions.

### Key Entities *(include if feature involves data)*

- **Authenticated Session**: Represents a signed-in user context that determines post-login routing and capture permissions.
- **Camera Capture State**: Represents user-visible camera states (initializing, ready, error) and drives which actions are available.
- **Measurement Image Record**: Represents a captured image and associated upload outcome shown to the user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In happy-path validation, 100% of successful existing-user logins open a live camera preview as the first post-login screen.
- **SC-002**: In happy-path validation, users can complete image capture in one tap from camera-ready state and are navigated to History after successful upload.
- **SC-003**: In camera-unavailable validation, 100% of sessions entering camera without permission trigger an immediate permission request, and denied/unavailable cases show a clear user-visible error while retaining non-camera actions.
- **SC-004**: No API code files or API test files are modified by this feature.
- **SC-005**: Android CI quality gate remains passing with unit-test coverage at or above 95%.
- **SC-006**: In upload-in-progress validation, 100% of repeated capture attempts are prevented while a loading state is visible.
- **SC-007**: In permission-denied validation, 100% of denial screens present Open Settings and History recovery actions.

## Assumptions

- Existing authentication and token persistence behavior remain the source of truth and are not redesigned in this feature.
- The camera screen continues to be the correct destination for existing-user successful login.
- History navigation remains available from the camera screen and does not require a workflow redesign.
- Existing API contracts remain unchanged and sufficient for post-capture handling.
