# Feature Specification: Persist Auth Token

**Feature Branch**: `010-persist-auth-token`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "authentication should persist after app shutdown. auth token should be alive 1 week, then refreshed."

## Clarifications

### Session 2026-05-29

- Q: Should the "working camera with one-click capture after login" requirement be handled in this current feature spec or separated? -> A: Keep this spec focused on auth persistence/refresh only; track camera behavior as a separate feature/spec.
- Q: For "expiring soon," what refresh trigger should this spec require? -> A: Refresh when token has <=24 hours remaining.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stay Signed In Across App Restart (Priority: P1)

A user who already authenticated in the Android app can close the app completely and open it later without needing to sign in again while their token is still valid.

**Why this priority**: Avoiding repeated login is core to a usable mobile experience and directly addresses the requested behavior.

**Independent Test**: Authenticate once, fully terminate the app process, relaunch within the token validity window, and verify the user lands in the authenticated journey without re-entering credentials.

**Acceptance Scenarios**:

1. **Given** a user has successfully authenticated and a valid token is stored, **When** the app is shut down and later reopened within 7 days, **Then** the app restores the authenticated session and continues from the authenticated journey.
2. **Given** no stored auth token exists, **When** the app opens, **Then** the app shows the authentication screen.
3. **Given** the app cannot read stored auth state due to local storage corruption or access failure, **When** the app starts, **Then** the app shows a user-visible error and routes to authentication.

---

### User Story 2 - Refresh Expiring Session After One Week (Priority: P2)

A signed-in user keeps their session beyond the initial 1-week token lifetime because the app refreshes authentication before or at expiry.

**Why this priority**: One-week token lifetime without refresh would force frequent re-login, reducing retention and continuity.

**Independent Test**: Start with an authenticated user whose token has 24 hours or less remaining (or is expired), trigger app startup or foreground resume, and verify session refresh succeeds and the user remains signed in.

**Acceptance Scenarios**:

1. **Given** a stored token is still valid but has 24 hours or less remaining, **When** the app starts or resumes, **Then** the app refreshes session credentials and keeps the user authenticated.
2. **Given** the stored token has reached its 7-day lifetime, **When** the app starts or resumes, **Then** the app attempts session refresh before showing a forced sign-in.
3. **Given** token refresh fails due to unauthorized, revoked session, or invalid refresh credentials, **When** refresh is attempted, **Then** the app clears stale auth state, shows a user-visible error, and routes to authentication.
4. **Given** token refresh fails due to network issues, **When** refresh is attempted, **Then** the app shows a user-visible error and allows retry without silently dropping the user into an inconsistent auth state.

---

### Edge Cases

- Device clock drift causes local token-expiry checks to disagree with server validity.
- User signs out explicitly on one device while another device still has cached auth state.
- App is force-killed during token refresh and reopened mid-lifecycle.
- Refresh endpoint returns malformed payload or missing expiry metadata.
- Multiple fast app launches or foreground events trigger overlapping refresh attempts.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Authentication session port, token persistence port, token refresh port, and auth state query port.
- **Adapters Affected**: Android local persistence adapter for auth state, API adapter for auth refresh requests, and navigation/UI adapter for auth routing and error presentation.
- **Boundary Guarantee**: Auth lifecycle rules (valid, expired, refresh-required, signed-out) remain in app/domain logic; Android storage and API mechanics stay in adapters.
- **Node.js Version Baseline**: Latest active LTS for local API validation runs.
- **NestJS Version Baseline**: Latest active LTS major for existing API runtime used during validation.
- **Android Source Location**: `mobile/android`.
- **Kotlin Version Baseline**: Latest active LTS Kotlin release.
- **API Error UX**: Every auth persistence and refresh API error is shown to the user on the current screen with clear next action (retry or sign in).
- **Localization Impact**: All auth persistence and refresh messages, labels, and errors are localized; no hardcoded visible strings are allowed.
- **Maestro Coverage**: Happy-path Maestro flow for persistent login on app relaunch and happy-path refresh continuity after token lifetime boundary.
- **Mobile Unit Coverage**: Unit tests cover token expiry evaluation, session restore, refresh success/failure outcomes, and auth-route decisions while preserving the >=95% CI gate.
- **Dependency Selection Rationale**: Reuse existing Android/mobile dependencies where possible; any new dependency requires explicit rationale in planning.
- **Existing Test Impact**: No API tests or backend tests change.
- **New Test Coverage**: Add Android unit tests for auth state machine and persistence behaviors plus Maestro happy paths for restart persistence and refresh continuity.
- **Coverage Plan**: Keep Android unit coverage >=95% in CI and include new auth lifecycle tests in that threshold.
- **Worktree Path**: `tmp/010-persist-auth-token`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Android app MUST persist authenticated session state so authentication survives app shutdown and process restart.
- **FR-002**: The app MUST treat the primary auth token lifetime as 7 days from issuance.
- **FR-003**: On app launch and app foreground resume, the app MUST evaluate whether the current token is valid, expiring, or expired.
- **FR-004**: If the token is valid, the app MUST restore the user to the authenticated journey without requiring manual sign-in.
- **FR-005**: If the token has 24 hours or less remaining or is expired, the app MUST attempt token refresh before forcing sign-in.
- **FR-006**: If refresh succeeds, the app MUST store the updated auth state and continue the authenticated journey.
- **FR-007**: If refresh fails with authorization or invalid-session errors, the app MUST clear stale auth state and route to authentication.
- **FR-008**: If refresh fails with recoverable connectivity errors, the app MUST show a user-visible error and offer retry behavior.
- **FR-009**: Every API error returned during auth restore or refresh MUST be shown to the user.
- **FR-010**: Every visible string introduced or changed for this feature MUST be localized.
- **FR-011**: All implementation changes for this feature MUST remain inside `mobile/android`.
- **FR-012**: No API code or API test files MAY be modified for this feature.
- **FR-013**: Android unit test coverage MUST remain at or above 95% in CI after this feature is implemented.
- **FR-014**: This feature MUST include happy-path Maestro coverage for session persistence and token refresh continuity.
- **FR-015**: Camera-preview-first behavior and one-click capture UX after login are out of scope for this feature specification and MUST be handled in a separate camera-focused feature/spec.

### Key Entities *(include if feature involves data)*

- **Auth Session**: Stored authenticated state for a mobile user, including token credentials and expiry metadata.
- **Token Lifetime Window**: The 7-day validity period used to determine whether restore can proceed directly or refresh is required.
- **Refresh Attempt**: A session-renewal operation that returns updated auth credentials or an error outcome.
- **Auth Error Message**: User-visible, localized explanation of auth restore/refresh failures with next-step guidance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users who relaunch the app within 7 days of successful sign-in remain authenticated without re-entering credentials.
- **SC-002**: In validation runs where token lifetime is exceeded, 95% of refresh-eligible sessions continue into the authenticated journey without forced re-login.
- **SC-003**: 100% of auth restore and refresh failure paths tested in QA display a visible, localized user-facing error.
- **SC-004**: Android unit coverage remains >=95% in CI after this feature lands.
- **SC-005**: Happy-path Maestro flows for restart persistence and refresh continuity pass in CI.

## Assumptions

- The existing API contract already supports session renewal behavior required by the mobile client.
- The mobile app can determine token lifetime boundaries from available auth metadata returned by the API.
- Authentication routing remains aligned with the existing customer journey defined for the Android app.
- Offline startup does not guarantee authenticated continuation if the app cannot validate or refresh an expired token.
- Any backend changes needed to improve refresh semantics are out of scope for this feature and will be tracked separately.
- Camera workflow corrections (show live camera immediately after login and one-click capture behavior) are specified and tracked separately from this auth persistence/refresh scope.
