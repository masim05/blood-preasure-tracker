# Feature Specification: Auth Session Persistence Improvement

**Feature Branch**: `[012-auth-improvement]`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "authentication should persist after app shutdown. auth token should be alive 1 week, then refreshed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stay Signed In After App Restart (Priority: P1)

As a returning user, I can close and reopen the app without logging in again while my session is still valid.

**Why this priority**: This is the core auth-improvement outcome and directly addresses the persistence requirement.

**Independent Test**: Sign in once, terminate the app, relaunch within token validity, verify authenticated route is restored without entering credentials.

**Acceptance Scenarios**:

1. **Given** a user has a stored valid session, **When** the app is relaunched, **Then** the app restores the authenticated session and skips auth form entry.
2. **Given** there is no stored session, **When** the app launches, **Then** the app opens the auth route.
3. **Given** stored session data is unreadable/corrupted, **When** the app launches, **Then** the app routes to auth and shows a user-visible error.

---

### User Story 2 - Refresh Session Before Expiry (Priority: P2)

As a signed-in user, my session remains active by refreshing auth when token lifetime is near expiry.

**Why this priority**: A one-week token without refresh forces repeated re-login and breaks continuity.

**Independent Test**: Start app with a token that has 24 hours or less remaining (or expired), verify refresh attempt occurs and success keeps user authenticated.

**Acceptance Scenarios**:

1. **Given** a token has 24 hours or less remaining, **When** app launches or resumes, **Then** refresh is attempted before forcing sign-in.
2. **Given** refresh succeeds, **When** new session data is returned, **Then** updated session is stored and user remains in authenticated flow.
3. **Given** refresh fails due to invalid/unauthorized session, **When** response is received, **Then** stale session is cleared, auth route is shown, and a user-visible error is displayed.
4. **Given** refresh fails due to transient network issues, **When** response is received, **Then** a user-visible error is shown and retry is available.

---

### Edge Cases

- Device clock skew causes local expiry check mismatch with server validity.
- App is force-closed during refresh and reopened.
- Multiple rapid app foreground events trigger overlapping refresh attempts.
- Refresh response is malformed or missing required fields.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Session store port, auth session lifecycle/refresh port.
- **Adapters Affected**: Android session persistence adapter, API auth adapter, UI route-state adapter.
- **Boundary Guarantee**: Auth state rules remain in core flow/domain and do not depend directly on Android framework APIs.
- **Node.js Version Baseline**: Latest active LTS (unchanged backend baseline for local validation).
- **NestJS Version Baseline**: Latest active LTS major (unchanged backend baseline for local validation).
- **Android Source Location**: `mobile/android`.
- **Kotlin Version Baseline**: Latest active LTS Kotlin baseline used by project.
- **API Error UX**: Every auth restore/refresh API error is shown as visible UI feedback.
- **Localization Impact**: All new or changed visible auth/session text is localized in Android resources.
- **Maestro Coverage**: Happy-path Maestro for each story (restore-after-restart, refresh-continuity).
- **Mobile Unit Coverage**: Android unit tests keep CI gate at `>= 95%`.
- **Dependency Selection Rationale**: Reuse existing Android and auth infrastructure; avoid unnecessary third-party additions.
- **Existing Test Impact**: No API code or API test changes.
- **New Test Coverage**: Unit tests for restore, expiry evaluation, refresh success/failure, and route decisions; Maestro happy paths for US1 and US2.
- **Coverage Plan**: Run and keep Android coverage verification at `>= 95%`, targeting near-100% in changed auth flow areas.
- **Worktree Path**: `tmp/012-auth-improvement`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST persist authenticated session state so auth survives app shutdown and restart.
- **FR-002**: Primary token lifetime MUST be treated as 7 days from issuance.
- **FR-003**: App MUST evaluate token validity on startup and on foreground resume.
- **FR-004**: If token is valid, app MUST restore authenticated flow without requiring credentials.
- **FR-005**: If token has 24 hours or less remaining or is expired, app MUST attempt refresh before forcing sign-in.
- **FR-006**: If refresh succeeds, updated auth state MUST be stored and used immediately.
- **FR-007**: If refresh fails due to invalid or unauthorized session, stale auth state MUST be cleared and auth route shown.
- **FR-008**: If refresh fails due to recoverable network issues, app MUST show user-visible error and offer retry.
- **FR-009**: Every auth-related API error MUST be visible to the user in app UI.
- **FR-010**: All visible text introduced or changed by this feature MUST be localized.
- **FR-011**: All implementation changes MUST stay under `mobile/android`.
- **FR-012**: API code and API tests MUST remain unchanged.
- **FR-013**: Android unit-test coverage in CI MUST remain at or above 95%.
- **FR-014**: Each user story in this feature MUST include a happy-path Maestro flow.

### Key Entities *(include if feature involves data)*

- **AuthSession**: Persisted authenticated state containing token credentials and expiry metadata.
- **TokenLifetimeWindow**: Seven-day validity model and near-expiry threshold used for refresh decisions.
- **RefreshAttempt**: Auth renewal operation returning updated session or failure outcome.
- **AuthUiMessage**: Localized user-facing feedback for restore/refresh failures.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation, 95% or more of users relaunching within token validity remain signed in without entering credentials.
- **SC-002**: In validation where token is near-expiry or expired, 95% or more refresh-eligible sessions stay in authenticated flow after automatic refresh.
- **SC-003**: 100% of tested restore/refresh failure paths display a visible, localized user-facing message.
- **SC-004**: Android CI coverage remains at or above 95% after feature implementation.
- **SC-005**: Happy-path Maestro flows for restart persistence and refresh continuity pass.

## Assumptions

- Existing API contract supports required session refresh semantics for mobile client.
- Existing auth endpoints remain the source of truth; backend behavior is not modified in this feature.
- Auth improvement scope is limited to mobile app behavior and state management.
- If network is unavailable and refresh cannot complete, user may need to retry or sign in based on returned failure type.
