# Data Model: Android Mobile App

## MobileUser

**Purpose**: Represents the authenticated person using the Android app.

**Fields**:
- `id`: string, required; copied from API `UserSummary.id`.
- `email`: string, required; valid email address copied from API `UserSummary.email`.

**Validation**:
- Email input must be non-empty and syntactically email-like before submitting signin/login.
- Password input must be non-empty and at least the API minimum length for signin/login submission.

## Session

**Purpose**: Stores the active bearer context returned by signin/login.

**Fields**:
- `accessToken`: string, required.
- `tokenType`: string, required; expected value `Bearer`.
- `expiresAt`: ISO-8601 timestamp string, required.
- `user`: `MobileUser`, required.

**Relationships**:
- One active session belongs to one mobile user.
- Session is used by authenticated measurement upload and history requests.

**State transitions**:
- `signedOut` -> `authenticated` after successful signin/login.
- `authenticated` -> `signedOut` when token is missing, expired, rejected as unauthorized, or explicitly cleared.

## PasswordInput

**Purpose**: Represents signin/login password entry state in the Android UI.

**Fields**:
- `value`: string, required for submission.
- `maskedDisplay`: platform-controlled secure text display, required.

**Validation**:
- Password input must be non-empty and at least the API minimum length before signin/login submission.
- Password fields must use Android standard password masking behavior with brief last-character reveal and automatic masking after typing.

## MeasurementImage

**Purpose**: Represents a captured image selected for upload.

**Fields**:
- `uri`: Android URI or app file reference, required before upload.
- `mimeType`: string, required; accepted values are `image/jpeg` or `image/png`.
- `sizeBytes`: number, required; must be greater than 0 and no more than 10 MB.

**Relationships**:
- Uploaded through the measurement upload API to create a pending measurement.

**Validation**:
- Must be JPEG or PNG.
- Must be non-empty and within API size limits.
- Camera permission denial and cancelled capture produce user-visible states.

## Measurement

**Purpose**: Represents a saved blood-pressure measurement as displayed in history.

**Fields**:
- `id`: string, required.
- `status`: enum, required; expected `saved` in history rows for this feature.
- `systolic`: integer, required for saved history rows.
- `diastolic`: integer, required for saved history rows.
- `pulse`: integer, required for saved history rows.
- `armSide`: enum, required; `left`, `right`, or `unknown`.
- `measurementTime`: ISO-8601 timestamp string, required.
- `savedAt`: ISO-8601 timestamp string, required for saved history rows.

**Relationships**:
- Returned in pages from measurement history.
- Displayed as non-editable rows in this feature.

**State transitions**:
- No client-side measurement state transitions are implemented beyond upload result display and saved-history row display. Measurement detail/review/save is deferred.

## HistoryFilter

**Purpose**: Captures the user-selected history date range.

**Fields**:
- `from`: optional date selected through a date selector control and converted to an inclusive ISO-8601 lower bound for the API.
- `to`: optional date selected through a date selector control and converted to an inclusive ISO-8601 upper bound for the API.
- `page`: positive integer; defaults to 1.
- `pageSize`: positive integer; defaults to API default unless overridden.

**Validation**:
- If both dates are present, `from` must be less than or equal to `to`.
- Free-text date entry is not allowed; invalid or cancelled date selection keeps the previous selected value and does not submit the request.

## HistoryTableRow

**Purpose**: Represents a non-editable, vertically aligned row in the history table.

**Fields**:
- `measurementTimeColumn`: localized display text for measurement time.
- `systolicColumn`: localized display text for systolic value.
- `diastolicColumn`: localized display text for diastolic value.
- `pulseColumn`: localized display text for pulse value.
- `armSideColumn`: localized display text for arm side.
- `statusColumn`: localized display text for status.

**Validation**:
- Columns must render in a consistent order with stable widths/alignment across all visible rows.
- Row text must come from localized resources or equivalent localization formatting.
- Rows are non-editable and do not open measurement detail in this feature.

## ApiError

**Purpose**: A user-visible representation of API and network failures.

**Fields**:
- `code`: optional string from API `error` field.
- `message`: string, required; API `message` when available, otherwise a clear fallback.
- `source`: enum; `api`, `network`, `timeout`, `parse`, or `unexpected`.

**Validation**:
- Every failed API call must produce an `ApiError` shown on the current screen.
- Errors must not be logged only or silently swallowed.
