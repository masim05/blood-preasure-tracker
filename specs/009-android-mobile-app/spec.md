# Feature Specification: Android Mobile App

**Feature Branch**: `009-android-mobile-app`

**Created**: 2026-05-28

**Status**: Draft

**Input**: User description: "implement android mobile app for tracking blood pressure. Common requirements: show any API error to the user; source code in `mobile/android`; latest LTS Kotlin; every user story has a happy path Maestro test; code covered by unit tests with 95% CI gate. Implement a hello world mobile app in `mobile/android` that opens, builds, and runs in Android Studio with no tests needed for that scaffold. Use `docs/openapi.yaml` as API reference and `npm run api` to run API. Implement signin, guide, login, camera/history choice, history with date filter, and measurement detail/edit/save user stories."

## Clarifications

### Session 2026-05-28

- Q: Which behavior should US6 require for measurement detail, value overrides, and save? -> A: Skip this user story for now; US6 is deferred from this feature.
- Q: What files may change for this feature implementation? -> A: Only `mobile/android`; no API code or API test changes.
- Q: How should visible Android text be handled? -> A: The app is multilingual; every visible string or text value must be localized.
- Q: How should password characters be hidden after typing? -> A: Use Android standard password masking behavior with brief last-character reveal.
- Q: How should users select history date filters? -> A: Use date selector controls, not free-text inputs.
- Q: How should history rows be visually arranged? -> A: History table columns and rows must be vertically aligned for scanning.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Account And Enter Guide (Priority: P1)

A new user opens the Android app, creates an account with email and password, and is taken directly to the measurement guide after successful account creation.

**Why this priority**: Account creation is the first path for a new user and unlocks all authenticated measurement workflows.

**Independent Test**: Can be fully tested by running the app against the local API, submitting valid new-account credentials, confirming the issued session is accepted, and verifying the guide screen appears. The story has a happy-path Maestro flow and unit tests for validation, API error display, session handling, and navigation.

**Acceptance Scenarios**:

1. **Given** the app is opened by a signed-out user, **When** the user enters valid new-account credentials and submits signin, **Then** the app creates the account, stores the active session for app use, and shows the guide screen.
2. **Given** the API returns a validation, duplicate email, rate limit, or network error during signin, **When** the user submits the signin form, **Then** the app remains on the signin screen and shows the API-provided error message or a clear connection error to the user.

---

### User Story 2 - Read Measurement Guide (Priority: P2)

An authenticated user sees a simple guide that asks them to take a clear picture with the tonometer and arm visible.

**Why this priority**: The guide sets the minimum instruction needed before measurement capture and provides a clear post-signin destination.

**Independent Test**: Can be tested after signin by verifying the guide copy is visible and the user can continue to the measurement action screen. The story has a happy-path Maestro flow and unit tests for guide display and navigation.

**Acceptance Scenarios**:

1. **Given** a user has successfully created an account, **When** the guide screen opens, **Then** the user sees placeholder guidance asking for a clear picture with the tonometer and arm visible.
2. **Given** the user has read the guide, **When** the user continues, **Then** the app shows the measurement action screen.

---

### User Story 3 - Log In And Enter Measurement Actions (Priority: P3)

An existing user opens the Android app, logs in with valid credentials, and is taken to the measurement action screen after successful authentication.

**Why this priority**: Returning users need a direct path into capture and history without creating a new account.

**Independent Test**: Can be fully tested by running the app against the local API with an existing user, submitting valid login credentials, and verifying the measurement action screen appears. The story has a happy-path Maestro flow and unit tests for validation, API error display, session handling, and navigation.

**Acceptance Scenarios**:

1. **Given** an existing signed-out user, **When** the user enters valid credentials and submits login, **Then** the app authenticates the user, stores the active session for app use, and shows the measurement action screen.
2. **Given** the API returns validation, unauthorized, rate limit, or network error during login, **When** the user submits the login form, **Then** the app remains on the login screen and shows the API-provided error message or a clear connection error to the user.

---

### User Story 4 - Choose Capture Or History (Priority: P4)

An authenticated user can either start taking a measurement photo with one click or open saved measurement history.

**Why this priority**: This is the hub for the two primary authenticated workflows: capture a new reading or inspect previous readings.

**Independent Test**: Can be tested by reaching the measurement action screen, tapping the capture action to open camera capture, and returning to open history. The story has a happy-path Maestro flow and unit tests for routing and authorization state behavior.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the measurement action screen, **When** the user taps the capture action, **Then** the device camera view opens for a measurement image.
2. **Given** an authenticated user is on the measurement action screen, **When** the user chooses history, **Then** the app opens saved measurement history.
3. **Given** the camera or upload flow produces an API error after capture, **When** the error is returned to the app, **Then** the app shows the error to the user and allows the user to retry or navigate away.

---

### User Story 5 - Browse Measurement History (Priority: P5)

An authenticated user sees a table of previous saved measurements and can filter the list by date range. Measurement detail opening is deferred from this feature.

**Why this priority**: Tracking blood pressure over time requires reviewing past saved measurements and narrowing the list to relevant dates.

**Independent Test**: Can be tested by using seeded saved measurements, opening history, and setting a date filter. The story has a happy-path Maestro flow and unit tests for date filter state, empty/error states, API error display, and non-editable row display.

**Acceptance Scenarios**:

1. **Given** saved measurements exist, **When** the user opens history, **Then** the app shows a table with measurement time, systolic, diastolic, pulse, arm side, and status for each returned saved measurement.
2. **Given** the user selects a date range with date selector controls, **When** the user applies the filter, **Then** the table updates to show only measurements in the selected date range and keeps the selected filter visible.
3. **Given** the history table is visible, **When** the user views measurement rows, **Then** the rows are displayed as non-editable history entries and do not open measurement detail in this feature.
4. **Given** the API returns a validation, unauthorized, not found, or network error while loading history, **When** the error is returned to the app, **Then** the app shows the error to the user and preserves a path to retry or return.
5. **Given** multiple history rows are visible, **When** the user scans the table, **Then** each measurement column is vertically aligned across rows.

---

### Edge Cases

- Duplicate signin email, invalid email format, short password, rate limiting, invalid login credentials, expired token, and unavailable API all show user-visible errors.
- History handles empty results, invalid date ranges, from-date after to-date, and pagination without hiding API errors.
- Opening a measurement detail from history is out of scope for this feature because US6 is deferred.
- Capture handles denied camera permission, cancelled camera capture, empty image selection, oversized or unsupported images, upload failure, and retry.
- The hello world Android scaffold must build and run before full user-story implementation, but it is explicitly exempt from tests only for that initial scaffold milestone.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Mobile app ports for authentication, session storage, measurement upload, and history retrieval.
- **Adapters Affected**: Android UI/navigation adapters, Android camera/image picker adapter, local session persistence adapter, and HTTP API adapter based on `docs/openapi.yaml`.
- **Boundary Guarantee**: Mobile business state and validation rules remain independent of concrete HTTP, camera, persistence, and UI framework details through app-level interfaces; adapters translate platform/API details at the boundary.
- **Node.js Version Baseline**: Latest active LTS for running the existing API with `npm run api` during local validation.
- **NestJS Version Baseline**: Latest active LTS major for the existing API reference implementation.
- **Android Source Location**: `mobile/android`.
- **Kotlin Version Baseline**: Latest active LTS Kotlin release.
- **API Error UX**: Every API error response with `message` is displayed to the user on the current screen; network or malformed responses use a clear user-facing fallback message.
- **Localization Impact**: Every visible Android text value, including labels,
  buttons, error messages, empty states, guide copy, and Maestro-visible text,
  must come from localized resources or an equivalent localization mechanism.
- **Maestro Coverage**: Happy-path Maestro flow for each user story US1 through US5; the hello world scaffold milestone is exempt from tests as requested.
- **Mobile Unit Coverage**: Android unit tests cover view state, validation, navigation decisions, API error mapping, session behavior, and history behavior with a `>= 95%` CI gate.
- **Dependency Selection Rationale**: Android dependencies must be justified during planning; `docs/openapi.yaml` is a read-only API reference for this feature.
- **Existing Test Impact**: No API tests or existing backend tests may change for this feature.
- **New Test Coverage**: Android unit tests for each app flow and happy-path Maestro tests for all five in-scope user stories.
- **Coverage Plan**: CI preserves existing backend coverage gates and adds Android unit coverage reporting with at least 95% line coverage before Android user-story work is complete.
- **Worktree Path**: `tmp/009-android-mobile-app` for implementation work unless maintainers explicitly waive worktree isolation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain an Android app source tree under `mobile/android` that can be opened in Android Studio, built, and run.
- **FR-002**: The initial Android scaffold MUST display a working hello world experience and is exempt from tests only for that scaffold milestone.
- **FR-003**: The app MUST use `docs/openapi.yaml` as the API behavior reference and support local API validation against the service started with `npm run api`.
- **FR-004**: The app MUST allow a new user to create an account with email and password through the signin endpoint and continue to the guide screen after success.
- **FR-005**: The app MUST show a placeholder guide asking the user to take a clear picture with the tonometer and arm visible.
- **FR-006**: The app MUST allow an existing user to log in with valid credentials and continue to the measurement action screen after success.
- **FR-007**: The app MUST maintain an active authenticated session for API calls after successful signin or login until the session expires or is cleared.
- **FR-008**: The app MUST provide a one-click path from the measurement action screen to the camera view for taking a measurement picture.
- **FR-009**: The app MUST provide a path from the measurement action screen to saved measurement history.
- **FR-010**: The app MUST upload captured measurement images as authenticated measurement uploads and show upload/API errors to the user.
- **FR-011**: The app MUST show saved measurement history as a vertically aligned table containing at least measurement time, systolic, diastolic, pulse, arm side, and status for each returned saved measurement.
- **FR-012**: The app MUST allow the user to set and apply a date range filter for saved measurement history using date selector controls, not free-text inputs.
- **FR-013**: The app MUST show measurement rows as non-editable history entries in this feature; opening a specific measurement detail, overriding values, and saving reviewed measurements are deferred.
- **FR-014**: The app MUST not implement measurement detail, image review, value override, or reviewed save workflows in this feature.
- **FR-018**: For every API error returned to the Android app, the app MUST show the error to the user rather than hiding it only in logs or silent state changes.
- **FR-019**: Every visible Android string or text value MUST be localized; hardcoded visible text in Android code, layouts, or Maestro flows is prohibited.
- **FR-020**: Android mobile app source MUST live under `mobile/android`.
- **FR-021**: Android mobile implementation MUST target the latest active LTS Kotlin release.
- **FR-022**: Every Android mobile user story US1 through US5 MUST include a happy-path Maestro flow.
- **FR-023**: Android mobile code MUST maintain unit-test coverage of at least 95% in CI after user-story implementation begins.
- **FR-024**: All implementation changes for this feature MUST be contained under `mobile/android`.
- **FR-025**: API code and API tests MUST NOT change for this feature; any API limitation discovered during implementation MUST be handled by adjusting the Android client behavior within the existing OpenAPI contract or deferred to a separate feature.
- **FR-026**: Signin and login password fields MUST use Android standard password masking behavior with brief last-character reveal and automatic masking after typing.

### Key Entities *(include if feature involves data)*

- **Mobile User**: A person using the Android app, identified by email after signin or login.
- **Session**: The active bearer authentication context returned by signin or login, including token type and expiration.
- **Measurement Image**: A captured JPEG/PNG image uploaded for recognition.
- **Measurement**: A blood-pressure record with status, measurement time, systolic, diastolic, pulse, arm side, and optional saved timestamp as shown in history.
- **History Filter**: A user-selected date range used to constrain saved measurement history.
- **API Error**: A user-safe error response containing an error code and message, or a user-facing fallback for connectivity/malformed response failures.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can open `mobile/android` in Android Studio, build the app, and run the hello world scaffold in under 10 minutes from a clean checkout after dependencies are available.
- **SC-002**: 100% of API error responses exercised in Android tests produce visible user-facing error text on the relevant screen.
- **SC-003**: Each of the five in-scope user stories has at least one passing happy-path Maestro flow before the feature is considered complete.
- **SC-004**: Android unit-test line coverage is at least 95% in CI for the implemented mobile code.
- **SC-005**: A new user can complete signin and reach the guide screen in under 2 minutes during local validation.
- **SC-006**: A returning user can log in and reach the measurement action screen in under 2 minutes during local validation.
- **SC-007**: A user can apply a date filter to history with date selector controls and no more than 3 user actions after reaching the history screen.
- **SC-008**: Measurement detail review, value override, and reviewed save workflows are absent from this feature and reserved for a future feature.

## Assumptions

- The existing mobile API contract in `docs/openapi.yaml` remains the source of truth for request and response behavior.
- The local backend is started separately with `npm run api`; the Android app does not start or manage the backend process.
- API code, API tests, and backend test suites are out of scope and must remain unchanged for this feature.
- Signin means account creation through `POST /api/v1/signin`; login means authentication through `POST /api/v1/login`.
- Measurement detail review, value override, and reviewed save are intentionally deferred from this feature.
- The first hello world scaffold is a setup milestone and intentionally has no tests; all user-story implementation after that milestone follows the Maestro and unit coverage rules.
- Date filters use inclusive from/to measurement-time bounds matching the API contract.
- Camera capture may use a real device or emulator-supported camera flow during validation, with permission denial handled as a user-visible app state.
