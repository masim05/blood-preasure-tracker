# Data Model: Mobile BP API

## UserAccount

Represents a registered mobile API user.

**Fields**:
- `id`: Stable unique identifier.
- `email`: Normalized unique email address.
- `passwordHash`: Non-reversible password verifier produced with Node.js crypto primitives.
- `createdAt`: Account creation timestamp.
- `updatedAt`: Last account update timestamp.

**Validation rules**:
- Email is required, syntactically valid, normalized for uniqueness, and unique across users.
- Password is required at signin and login; stored only as a hash/verifier.

**Relationships**:
- One user owns many measurements.
- One user can have many bearer access tokens.

## BearerAccessToken

Represents an expiring opaque token returned by signin/login and presented on protected requests.

**Fields**:
- `id`: Stable unique identifier.
- `userId`: Owning user account.
- `tokenHash`: Hash of the opaque token value; raw token is returned once and never stored.
- `expiresAt`: Expiration timestamp.
- `createdAt`: Token issue timestamp.
- `revokedAt`: Optional revocation timestamp.

**Validation rules**:
- Protected API requests require a bearer token whose hash exists, is not expired, and is not revoked.
- Token validation resolves exactly one authenticated user.

**Relationships**:
- Many tokens belong to one user account.

## Measurement

Represents one photo-based blood pressure reading attempt owned by a user.

**Fields**:
- `id`: Stable unique identifier returned by upload.
- `userId`: Owning user account.
- `status`: Recognition/save lifecycle state.
- `systolic`: Optional recognized systolic value.
- `diastolic`: Optional recognized diastolic value.
- `pulse`: Optional recognized pulse value.
- `armSide`: Optional recognized arm side.
- `measurementTime`: Server-assigned timestamp captured when the image is accepted.
- `imageId`: Stored original image reference.
- `recognitionError`: Optional user-safe failure message.
- `savedAt`: Timestamp set when the authenticated save endpoint confirms a recognized measurement.
- `createdAt`: Measurement creation timestamp.
- `updatedAt`: Last measurement update timestamp.

**Validation rules**:
- Measurement belongs to exactly one user.
- `measurementTime` is assigned by the server at accepted upload time.
- Recognized values are absent while pending and present only after successful recognition.
- Default history includes only saved measurements owned by the authenticated user.
- Save confirmation is allowed only for owner-owned measurements in the `recognized` state.

**State transitions**:
- `pending` -> `recognizing` when a background worker starts recognition.
- `recognizing` -> `recognized` when systolic, diastolic, pulse, and arm side are available.
- `recognizing` -> `failed` when recognition cannot produce a usable result.
- `recognized` -> `saved` when `POST /api/v1/measurements/<id>/save` succeeds.
- `pending`, `failed`, and unconfirmed `recognized` measurements do not appear in default history.

**Relationships**:
- Many measurements belong to one user account.
- One measurement has one original image.
- One measurement has one or more recognition task attempts over time if retry support is added later.

## MeasurementImage

Represents the stored original JPEG/PNG image submitted for recognition.

**Fields**:
- `id`: Stable unique identifier.
- `measurementId`: Associated measurement.
- `storagePath`: Server-side path or storage key.
- `contentType`: `image/jpeg` or `image/png`.
- `byteSize`: Uploaded file size in bytes.
- `createdAt`: Storage timestamp.

**Validation rules**:
- Image is required for measurement upload.
- Image must be JPEG or PNG.
- Image size must be greater than zero and no more than 10 MB.
- Original image links must be access-controlled or time-limited for the owning user.

**Relationships**:
- One image belongs to one measurement.

## RecognitionTask

Represents persisted background work for recognizing one measurement image.

**Fields**:
- `id`: Stable unique identifier.
- `measurementId`: Measurement to process.
- `status`: Task processing state.
- `attemptCount`: Number of recognition attempts.
- `lastError`: Optional internal diagnostic or user-safe mapped error.
- `availableAt`: Timestamp when the task may be processed.
- `startedAt`: Optional processing start timestamp.
- `completedAt`: Optional completion timestamp.
- `createdAt`: Task creation timestamp.
- `updatedAt`: Last task update timestamp.

**Validation rules**:
- A task is created only after image validation, image storage, and measurement creation succeed.
- Task status changes update the associated measurement status.

**State transitions**:
- `queued` -> `processing` when claimed by a worker.
- `processing` -> `completed` after recognized values are persisted.
- `processing` -> `failed` after recognition failure is persisted.

**Relationships**:
- Each task belongs to one measurement.

## MeasurementHistoryPage

Represents a paginated list response for saved measurements.

**Fields**:
- `items`: Saved measurements without original image binary data.
- `page`: Requested page number or cursor-derived page marker.
- `pageSize`: Maximum items returned.
- `hasNextPage`: Whether another page is available.
- `from`: Optional inclusive measurement time lower bound.
- `to`: Optional inclusive measurement time upper bound.

**Validation rules**:
- Only saved measurements for the authenticated user are included.
- Time filters apply to server-assigned `measurementTime`.
- Invalid ranges where `from` is after `to` are rejected.
- Empty results return a valid empty page.
