# Data Model: Android Mobile App

## AuthMode

**Purpose**: Represents the selected mode on the combined auth screen.

**Fields**:
- `mode`: enum, required; `login` or `newAccount`.
- `email`: string, required for submission.
- `password`: string, required for submission.
- `isSubmitting`: boolean, true while an auth request is in flight.
- `visibleError`: optional localized/API error message shown on the auth screen.

**Validation**:
- Email input must be non-empty and syntactically email-like before submitting either mode.
- Password input must be non-empty and at least the API minimum length before submitting either mode.
- New Account submits to signin/account-creation behavior and routes to Guide on success.
- Login submits to login behavior and routes to Camera on success.

## AppScreen

**Purpose**: Represents the current Compose screen in the clarified customer journey.

**Fields**:
- `screen`: enum, required; `auth`, `guide`, `camera`, `history`, or future `measurementDetail`.
- `session`: optional active session for authenticated screens.

**State transitions**:
- `auth(newAccount)` -> `guide` after successful account creation only.
- `guide` -> `camera` when the user taps Next.
- `auth(login)` -> `camera` after successful existing-user login.
- `camera` -> `history` when the user taps History.
- `camera` -> `history` after successful image upload.
- `history` -> future `measurementDetail` is deferred and must not be implemented in this feature.

## MobileUser

**Purpose**: Represents the authenticated person using the Android app.

**Fields**:
- `id`: string, required; copied from API `UserSummary.id`.
- `email`: string, required; valid email address copied from API `UserSummary.email`.

**Validation**:
- Email input must be non-empty and syntactically email-like before submitting signin/login.

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

**Purpose**: Represents signin/login password entry state in Compose.

**Fields**:
- `value`: string, required for submission.
- `maskedDisplay`: platform-controlled secure text display, required.

**Validation**:
- Password input must be non-empty and at least the API minimum length before signin/login submission.
- Password fields must use Android standard password masking behavior with brief last-character reveal and automatic masking after typing.

## MeasurementImage

**Purpose**: Represents a captured image selected for upload from the camera screen.

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

## CameraScreenState

**Purpose**: Represents the post-guide/post-login camera screen.

**Fields**:
- `session`: active `Session`, required.
- `isUploading`: boolean, true while upload is in flight.
- `visibleError`: optional API/camera/network error shown on the camera screen.
- `lastUploadId`: optional measurement ID returned after upload before navigating to history.

**State transitions**:
- `idle` -> `uploading` when capture/upload starts.
- `uploading` -> `history` after successful upload.
- `uploading` -> `idleWithError` after API, validation, camera, or network failure.
- `idle` -> `history` when the user taps History.

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
- `from`: optional date selected through a Compose Material 3 date selector control and converted to an inclusive ISO-8601 lower bound for the API.
- `to`: optional date selected through a Compose Material 3 date selector control and converted to an inclusive ISO-8601 upper bound for the API.
- `page`: positive integer; defaults to 1.
- `pageSize`: positive integer; defaults to API default unless overridden.

**Validation**:
- If both dates are present, `from` must be less than or equal to `to`.
- Free-text date entry is not allowed; invalid or cancelled date selection keeps the previous selected value and does not submit the request.

## HistoryTableRow

**Purpose**: Represents a non-editable, vertically aligned row in the Compose history table.

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

## MeasurementDetail

**Purpose**: Future measurement screen entity for US6.

**Status**: Deferred from this feature.

**Validation**:
- No measurement detail, image review, value override, save, or history-row navigation behavior is implemented in this feature.

## ApiError

**Purpose**: A user-visible representation of API and network failures.

**Fields**:
- `code`: optional string from API `error` field.
- `message`: string, required; API `message` when available, otherwise a clear fallback.
- `source`: enum; `api`, `network`, `timeout`, `parse`, or `unexpected`.

**Validation**:
- Every failed API call must produce an `ApiError` shown on the current screen.
- Errors must not be logged only or silently swallowed.
