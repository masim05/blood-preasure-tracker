# Feature Specification: Mobile BP API

**Feature Branch**: `006-mobile-bp-api`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "implement API for mobile app. the app should provide ability to track blood pressure in a fast and convenient way. user can sign in/register with email and password, registered user can log in, logged-in user can take a photo of a tonometer and arm, the photo is sent to the server for recognition, and the user can re-take or save the recognized data. API endpoints requested: `POST /api/v1/signin`, `POST /api/v1/login`, authenticated `POST /api/v1/measurements`, `GET /api/v1/measurements`, `GET /api/v1/measurements/<id>`. DB: latest LTS Postgres."

## Clarifications

### Session 2026-05-27

- Q: Should recognized measurements appear in history automatically, or only after the user confirms save? -> A: Add an authenticated save/confirm operation before a recognized measurement appears in history.
- Q: Which endpoint should confirm a recognized measurement into history? -> A: Use `POST /api/v1/measurements/<id>/save`.
- Q: Which values should recognized measurement data include? -> A: Systolic, diastolic, pulse, arm side, and server current time.
- Q: How should the mobile API authenticate protected requests? -> A: Signin and login return an expiring bearer access token.
- Q: Which image uploads should the measurement endpoint accept? -> A: JPEG and PNG images up to 10 MB.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Account With Email (Priority: P1)

A new mobile app user can create an account using only an email address and password so their blood pressure readings can be kept private and available across sessions.

**Why this priority**: Account creation is the entry point for storing personal measurements and protecting health-related data.

**Independent Test**: Submit a valid email and password for a new user and verify that the user account is created and the response enables the mobile app to continue as an authenticated user.

**Acceptance Scenarios**:

1. **Given** no existing user has the submitted email, **When** the user creates an account with a valid email and password, **Then** the system creates the account and returns an expiring bearer access token.
2. **Given** an account already exists for the submitted email, **When** the user tries to create another account with that email, **Then** the system rejects the request with a clear duplicate-account outcome.
3. **Given** the email is malformed or the password is missing, **When** the user tries to create an account, **Then** the system rejects the request and explains which required field is invalid.

---

### User Story 2 - Log In As Registered User (Priority: P1)

A registered mobile app user can log in with email and password so they can quickly return to tracking measurements.

**Why this priority**: Returning users must be able to access protected measurement actions and their saved reading history.

**Independent Test**: Create a user, log in with the same credentials, and verify that the response grants access to authenticated measurement operations.

**Acceptance Scenarios**:

1. **Given** a registered user enters the correct email and password, **When** they log in, **Then** the system authenticates the user and returns an expiring bearer access token accepted by protected operations.
2. **Given** a registered user enters an incorrect password, **When** they log in, **Then** the system denies access without exposing whether the password or account lookup failed.
3. **Given** an unauthenticated request attempts to access protected measurements, **When** the request is submitted, **Then** the system rejects it and does not expose measurement data.

---

### User Story 3 - Submit Measurement Photo (Priority: P1)

A logged-in user can take a photo of their tonometer and arm in the mobile app and send it for recognition so they do not need to type readings manually.

**Why this priority**: Fast photo capture is the core convenience promise of the app and starts the measurement recognition workflow.

**Independent Test**: Submit an authenticated measurement image and verify that the image is stored, a measurement identifier is returned, and recognition work is queued for background processing.

**Acceptance Scenarios**:

1. **Given** a logged-in user has taken a readable photo, **When** the photo is submitted, **Then** the system stores the original image and returns a measurement identifier.
2. **Given** a submitted photo is accepted, **When** the system responds, **Then** the measurement is marked as pending recognition and background recognition is scheduled.
3. **Given** the submitted file is missing, empty, larger than 10 MB, or not a JPEG/PNG image, **When** the user submits it, **Then** the system rejects the request and no measurement record is created.

---

### User Story 4 - Review Recognition Result And Save (Priority: P2)

After recognition completes, the user can see the recognized blood pressure data and either re-take the photo or explicitly save the reading for history.

**Why this priority**: Recognition alone is not enough; users need a confirmation point before a reading becomes part of their tracked history.

**Independent Test**: Complete a recognition workflow for a submitted image, retrieve the recognized result, and verify that the user can decide whether to keep the recognized reading or replace it with a new photo.

**Acceptance Scenarios**:

1. **Given** recognition has completed for a measurement, **When** the user opens the measurement result, **Then** the system returns systolic, diastolic, pulse, arm side, the server-assigned measurement time, and a link to the original image.
2. **Given** the user is dissatisfied with the recognized result, **When** they choose to re-take the photo in the mobile app, **Then** the app can submit a new measurement photo without saving the prior reading as final.
3. **Given** the user confirms the recognized result, **When** they choose to save it through `POST /api/v1/measurements/<id>/save`, **Then** the measurement is available in their recognized measurement history.

---

### User Story 5 - Browse Measurement History (Priority: P3)

A logged-in user can browse recognized measurements in a paginated list and filter by time so they can review recent or historical blood pressure readings efficiently.

**Why this priority**: History review supports ongoing tracking, but it depends on account access and completed measurement recognition.

**Independent Test**: Seed multiple recognized measurements for a user, request a paginated history with a time range, and verify only that user's matching recognized measurements are returned without original image payloads.

**Acceptance Scenarios**:

1. **Given** a user has recognized measurements across several dates, **When** they request history with a time filter, **Then** the system returns only matching recognized measurements for that user.
2. **Given** a user requests a history page, **When** more matching records exist than fit in one page, **Then** the system returns pagination information that allows the next page to be requested.
3. **Given** the history list is returned, **When** the mobile app displays it, **Then** each list item includes recognized measurement data but not the original image binary.

### Edge Cases

- Duplicate registration attempts for the same email are rejected consistently.
- Login failures do not reveal whether the email exists or the password is wrong.
- Authenticated users can only access their own measurements and original image links.
- Measurement recognition can remain pending while background work has not completed; result views communicate the pending state without losing the original image.
- Pending, failed, and unconfirmed recognized measurements do not appear as saved readings in the default history list.
- Pagination handles empty result sets, final pages, invalid page parameters, and time ranges with no matches.
- Time filters handle inclusive boundaries consistently and reject invalid ranges where the start is after the end.
- Uploaded images larger than 10 MB or outside JPEG/PNG format are rejected before background recognition is scheduled.

## Architecture & Test Impact *(mandatory)*

- **Ports Affected**: Introduce or extend ports for user account persistence, credential verification, bearer access token issuance and validation, measurement image storage, measurement persistence, and background recognition task scheduling.
- **Adapters Affected**: Add mobile HTTP API inbound adapter, Postgres-backed persistence adapter, server-side image storage adapter, and recognition task adapter backed by persisted task records for the initial version.
- **Boundary Guarantee**: Account, authentication, measurement ownership, recognition state, and history filtering rules stay in application/domain code behind ports; HTTP, storage, and database details remain in adapters.
- **Node.js Version Baseline**: Latest active LTS, Node.js 24.x as of 2026-05-27.
- **NestJS Version Baseline**: Latest active LTS major, NestJS 11.
- **Dependency Selection Rationale**: Prefer official Node.js/NestJS capabilities and maintained Postgres/auth/image upload integrations; any third-party package must be justified by security, maintenance, or standards support.
- **Existing Test Impact**: Existing CLI prediction/eval behavior should remain unchanged; current tests should need no behavioral rewrites outside shared bootstrap or dependency wiring if the server API is added beside the CLI.
- **New Test Coverage**: Add unit tests for account rules, authentication outcomes, measurement ownership, recognition state transitions, pagination/time filtering, and validation errors; add integration/contract tests for each requested API operation.
- **Coverage Plan**: Preserve CI coverage at `>= 95%`; target full branch coverage for authentication failures, ownership checks, upload validation, empty history, pending recognition, failed recognition, and time-filter boundaries.
- **Worktree Path**: `tmp/006-mobile-bp-api`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a new user to create an account with email and password only through `POST /api/v1/signin`.
- **FR-002**: The system MUST reject account creation when the email is invalid, the password is missing, or another account already uses the email.
- **FR-003**: The system MUST authenticate a registered user with email and password through `POST /api/v1/login`.
- **FR-004**: Successful account creation and login MUST return an expiring bearer access token that the mobile app can use for protected measurement operations.
- **FR-005**: Failed login attempts MUST be denied without exposing whether the email exists or which credential was incorrect.
- **FR-006**: All measurement operations MUST require a valid bearer access token and MUST be scoped to the authenticated user's own data.
- **FR-007**: The system MUST accept an authenticated measurement image through `POST /api/v1/measurements`.
- **FR-008**: When a measurement image is accepted, the system MUST store the original image, create a measurement record, return the measurement identifier, and schedule recognition in the background.
- **FR-009**: The initial background recognition workflow MAY represent queued work as persisted task records as long as accepted measurements can move through pending, recognized, and failed states.
- **FR-010**: The system MUST reject missing, empty, larger-than-10-MB, or non-JPEG/PNG image uploads without creating a measurement record or scheduling recognition.
- **FR-011**: The system MUST provide `GET /api/v1/measurements` as an authenticated paginated list of the user's recognized measurements.
- **FR-012**: The measurement list MUST support filtering by measurement time range and MUST exclude original image binary data.
- **FR-013**: The measurement list MUST return stable pagination information so the mobile app can request additional pages when available.
- **FR-014**: The system MUST provide `GET /api/v1/measurements/<id>` as an authenticated detail view for a single measurement owned by the user.
- **FR-015**: The measurement detail view MUST return recognition status, recognized blood pressure data when available, and a link to the original image.
- **FR-016**: Recognized blood pressure data MUST include systolic value, diastolic value, pulse value, arm side, and measurement time.
- **FR-017**: Measurement time MUST be assigned from the server's current time when the measurement image is accepted, not extracted from the image or entered manually.
- **FR-018**: Users MUST be able to distinguish pending, recognized, failed, and saved states from measurement detail responses.
- **FR-019**: The system MUST provide `POST /api/v1/measurements/<id>/save` as an authenticated save/confirm operation for a recognized measurement before that measurement appears in the default measurement history.
- **FR-020**: The authenticated save/confirm operation MUST reject measurements that are not owned by the user or are not in a recognized state.
- **FR-021**: The system MUST support the mobile app's re-take flow by allowing the user to submit a replacement/new photo when the current recognition result is unsatisfactory.
- **FR-022**: The system MUST keep unconfirmed recognized measurements out of the default authenticated measurement history.
- **FR-023**: The system MUST persist user accounts, authentication-related account data, measurements, recognition status, image references, save confirmation state, and background recognition task records in durable storage.
- **FR-024**: Implementation MUST preserve hexagonal boundaries: domain depends on ports only, adapters depend on domain interfaces.
- **FR-025**: Each new feature MUST add new tests; existing tests MUST remain unchanged unless the specification documents why a change is required.
- **FR-026**: Development workflow MUST remain MCP-free and execute in a dedicated feature worktree under `tmp/`.
- **FR-027**: Runtime stack MUST target the latest active Node.js LTS and latest active NestJS LTS.
- **FR-028**: Data storage MUST target the latest LTS Postgres release.
- **FR-029**: Dependency decisions MUST prefer official Node.js/NestJS modules; third-party additions require explicit justification.

### Key Entities *(include if feature involves data)*

- **User Account**: Represents a registered mobile app user identified by email, with credential data and account timestamps.
- **Bearer Access Token**: Represents an expiring authentication credential returned by account creation and login, then presented by the mobile app to access protected operations for one user.
- **Measurement**: Represents one photo-based blood pressure reading attempt owned by a user, including status, systolic value, diastolic value, pulse value, arm side, server-assigned measurement time, save confirmation state, and image reference.
- **Measurement Image**: Represents the stored original image submitted for recognition and the access link returned for detail views.
- **Recognition Task**: Represents queued or completed background work associated with a measurement image, including pending, completed, and failed outcomes.
- **Measurement History Page**: Represents a paginated slice of recognized measurements plus pagination metadata and applied time filters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can create an account and receive an authenticated result in under 30 seconds from the mobile app flow.
- **SC-002**: A registered user can log in and access protected measurement operations with a 100% pass rate in acceptance tests using valid credentials and a valid bearer access token.
- **SC-003**: 95% of accepted image submissions return a measurement identifier and pending recognition state within 2 seconds under normal single-user use.
- **SC-004**: 100% of unauthenticated measurement requests and cross-user measurement access attempts are rejected in security-focused acceptance tests.
- **SC-005**: Users can view a page of recognized measurement history filtered by time in under 2 seconds for histories up to 1,000 recognized measurements.
- **SC-006**: Measurement detail responses correctly show pending, recognized, saved, or failed status for 100% of controlled recognition-state test cases.
- **SC-007**: The history list omits original image binary data for 100% of list responses while detail responses provide an original image link when available.
- **SC-008**: At least 90% of usability test participants can complete the capture, review, and save workflow without manual reading entry.

## Assumptions

- `POST /api/v1/signin` is treated as account creation because the requested behavior says it creates a new user record.
- Email/password authentication is sufficient for the first mobile API version; password reset, social login, and multi-factor authentication are out of scope.
- The mobile app owns the camera UI; this feature provides the server capabilities that let the app upload, review, re-take, save, and browse measurements.
- Saving a recognized measurement requires an authenticated user confirmation before the result is available in the user's history; manual correction of recognized values is out of scope unless added later.
- Measurement history defaults to saved measurements; pending, failed, and unconfirmed recognized measurements are available through detail views or explicit app flows.
- Original image links are access-controlled or time-limited so only the owning authenticated user can retrieve them.
- Recognition work can initially be tracked with durable persisted task records before introducing a dedicated external job queue.
- Measurement time filtering uses the server-assigned measurement time recorded when the image is accepted.
