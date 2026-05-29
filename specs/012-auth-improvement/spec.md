# Feature Specification: Authentication Improvement

**Feature Branch**: `[012-auth-improvement]`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "authentication improvement. authentication should persist after app shutdown - app change only, no api test/code should change for it. auth token should be alive 1 week - api change only, no app test/code should change for it."

## Clarifications

### Session 2026-05-29

- Q: How should auth session data be stored on-device for restart persistence? -> A: Use Android encrypted local storage (Keystore-backed).
- Q: How should the 7-day token policy apply at rollout? -> A: Apply to newly issued tokens only; existing tokens keep their original expiry.
- Q: Where should users land after app reopen with a valid restored session? -> A: Always route to Camera screen (screen 3).
- Q: Which token type does the 7-day rule apply to? -> A: Access tokens only; refresh-token behavior remains unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persist Auth Across App Shutdown (Priority: P1)

As a signed-in mobile user, I can close and reopen the app without being forced to sign in again while my token is still valid.

**Why this priority**: This directly improves daily usability and eliminates unnecessary repeated sign-in.

**Independent Test**: Sign in successfully, fully close the app, reopen the app, and verify that the app restores authenticated state without credential re-entry.

**Acceptance Scenarios**:

1. **Given** a user has a previously saved valid authenticated session, **When** the app is opened after shutdown, **Then** the user is automatically restored and routed to Camera screen (screen 3).
2. **Given** there is no saved authenticated session, **When** the app is opened, **Then** the user is shown the sign-in flow.
3. **Given** saved session state is unreadable or invalid, **When** the app is opened, **Then** the session is not restored and the user is shown a visible, localized error and the sign-in flow.

---

### User Story 2 - Keep Token Lifetime at One Week (Priority: P2)

As a signed-in user, tokens issued by the API remain valid for seven days so session validity is predictable.

**Why this priority**: This sets a clear server-side auth policy that supports expected session behavior across clients.

**Independent Test**: Issue a token through existing auth flow and verify its expiration is seven days after issuance.

**Acceptance Scenarios**:

1. **Given** valid credentials are submitted to the API auth endpoint, **When** a token is issued, **Then** the token expiration is set to exactly seven days from issuance.
2. **Given** a token older than seven days, **When** a protected API endpoint is called, **Then** the API rejects the token as expired.
3. **Given** a token younger than seven days, **When** a protected API endpoint is called, **Then** the API accepts it according to existing authorization rules.

---

### Edge Cases

- App restart occurs while local session state write is incomplete.
- Device time differs from server time, causing apparent mismatch in remaining validity on client display.
- Token expiration boundary is reached during an active request to a protected endpoint.
- Previously issued tokens from older policy windows continue to be evaluated after the policy update.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Mobile session-state persistence and restore behavior; backend token issuance policy.
- **Adapters Affected**: Android encrypted auth persistence adapter and backend auth token adapter.
- **Boundary Guarantee**: Mobile and backend responsibilities remain separated; app persistence behavior and API token-lifetime policy are changed independently.
- **Node.js Version Baseline**: Latest active LTS.
- **NestJS Version Baseline**: Latest active LTS major.
- **Android Source Location**: `mobile/android` for User Story 1; no Android source changes for User Story 2.
- **Kotlin Version Baseline**: Latest active LTS Kotlin baseline already used by the Android app.
- **API Error UX**: Any API auth error returned to app users remains visible in the app.
- **Localization Impact**: Any new visible text from User Story 1 is localized.
- **Maestro Coverage**: Happy-path Maestro coverage applies to User Story 1 (mobile story).
- **Mobile Unit Coverage**: Android unit coverage stays at or above 95% CI gate after User Story 1 changes.
- **Dependency Selection Rationale**: Reuse existing project dependencies and auth mechanisms unless a change is required by policy.
- **Existing Test Impact**: User Story 1 does not change API code/tests. User Story 2 does not change Android app code/tests.
- **New Test Coverage**: Mobile tests for persistence/restore behavior; backend tests for seven-day token issuance and expiry boundary handling.
- **Coverage Plan**: Preserve Android CI coverage gate for mobile changes and preserve backend test confidence for token-policy changes.
- **Worktree Path**: `tmp/012-auth-improvement`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mobile app MUST persist authenticated session state using Android encrypted local storage (Keystore-backed) so authentication can survive app shutdown and relaunch.
- **FR-002**: The mobile app MUST restore authenticated session state on launch when saved session data is valid.
- **FR-002a**: When session restore succeeds, the app MUST route the user directly to Camera screen (screen 3), not last-visited screen.
- **FR-003**: For the auth-persistence change, implementation scope MUST be app-only; API code and API tests MUST NOT change.
- **FR-004**: The API MUST issue authentication tokens with a validity period of exactly seven days from issuance.
- **FR-004a**: The seven-day validity requirement applies to access tokens only.
- **FR-005**: The API MUST reject tokens that exceed the seven-day validity period when used against protected endpoints.
- **FR-006**: For the token-lifetime change, implementation scope MUST be API-only; Android app code and Android tests MUST NOT change.
- **FR-006a**: The seven-day token lifetime policy MUST apply to newly issued tokens only; tokens issued before rollout MUST retain their original expiration behavior.
- **FR-007**: Any API auth error shown in the app through User Story 1 flows MUST be visible to the user.
- **FR-008**: Any user-visible text introduced or changed by User Story 1 MUST be localized.
- **FR-009**: User Story 1 MUST include at least one happy-path Maestro flow.
- **FR-010**: Android unit coverage in CI MUST remain at or above 95% after User Story 1.
- **FR-011**: Existing customer journey and navigation behavior outside these two stories MUST remain unchanged.
- **FR-012**: Session restore navigation MUST align with the defined journey entry point for authenticated users (screen 3).

### Key Entities *(include if feature involves data)*

- **Mobile Auth Session State**: Persisted user authentication state stored in Android encrypted local storage and used to restore signed-in status after app restart.
- **Issued Auth Token**: Server-generated credential with issue time and expiration time.
- **Token Validity Policy**: Rule defining access-token lifetime as seven days and controlling acceptance/rejection behavior, while leaving refresh-token behavior unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In mobile validation for User Story 1, at least 95% of users with valid saved sessions reopen the app without re-entering credentials.
- **SC-002**: In API validation for User Story 2, 100% of newly issued tokens show expiration exactly seven days after issuance.
- **SC-003**: In API validation for User Story 2, 100% of tokens older than seven days are rejected by protected endpoints.
- **SC-004**: Android CI coverage remains at or above 95% after User Story 1 changes.
- **SC-005**: User Story 1 happy-path Maestro flow passes in the target test environment.

## Assumptions

- Existing authentication flows remain the same except for the specified persistence and token-lifetime policy changes.
- The API already returns enough token metadata to verify issued expiration during validation.
- No schema migration or user-facing settings changes are required for this feature.
- Token lifetime policy applies to newly issued tokens after rollout; previously issued tokens preserve prior expiry semantics.
- Refresh-token behavior remains unchanged by this feature.
