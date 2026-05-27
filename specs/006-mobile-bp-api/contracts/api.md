# API Contract: Mobile BP API

Base path: `/api/v1`

Authentication: Protected endpoints require `Authorization: Bearer <accessToken>`. Tokens are expiring opaque bearer access tokens returned by signin and login.

Error responses use a consistent JSON shape:

```json
{
  "error": "validation_error",
  "message": "Human-readable user-safe message"
}
```

## POST /api/v1/signin

Creates a new user account and returns an access token.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple"
}
```

**Success 201**:

```json
{
  "accessToken": "opaque-token-value",
  "tokenType": "Bearer",
  "expiresAt": "2026-05-27T12:00:00.000Z",
  "user": {
    "id": "usr_123",
    "email": "user@example.com"
  }
}
```

**Failure cases**:
- `400` for invalid email or missing password.
- `409` for duplicate email.

## POST /api/v1/login

Authenticates an existing user and returns an access token.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple"
}
```

**Success 201**:

```json
{
  "accessToken": "opaque-token-value",
  "tokenType": "Bearer",
  "expiresAt": "2026-05-27T12:00:00.000Z",
  "user": {
    "id": "usr_123",
    "email": "user@example.com"
  }
}
```

**Failure cases**:
- `400` for invalid request shape.
- `401` for invalid credentials without revealing whether the email exists.

## POST /api/v1/measurements

Uploads a measurement image, stores the original image, creates a pending measurement, and schedules recognition.

**Auth**: Required.

**Request**: `multipart/form-data`
- `image`: Required JPEG or PNG file, greater than 0 bytes and at most 10 MB.

**Success 201**:

```json
{
  "id": "msr_123",
  "status": "pending",
  "measurementTime": "2026-05-27T12:00:00.000Z"
}
```

**Failure cases**:
- `400` for missing/empty image, unsupported format, size over 10 MB, or malformed multipart body.
- `401` for missing, expired, revoked, or invalid bearer token.

## GET /api/v1/measurements

Returns a paginated list of saved measurements for the authenticated user. Original image binary data is never included.

**Auth**: Required.

**Query parameters**:
- `page`: Optional positive integer, defaults to `1`.
- `pageSize`: Optional positive integer within implementation-defined maximum, defaults to an implementation-defined value.
- `from`: Optional inclusive ISO-8601 measurement time lower bound.
- `to`: Optional inclusive ISO-8601 measurement time upper bound.

**Success 200**:

```json
{
  "items": [
    {
      "id": "msr_123",
      "status": "saved",
      "systolic": 120,
      "diastolic": 80,
      "pulse": 68,
      "armSide": "left",
      "measurementTime": "2026-05-27T12:00:00.000Z",
      "savedAt": "2026-05-27T12:05:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "hasNextPage": false,
  "filters": {
    "from": "2026-05-01T00:00:00.000Z",
    "to": "2026-05-31T23:59:59.999Z"
  }
}
```

**Failure cases**:
- `400` for invalid pagination values, invalid time values, or `from` after `to`.
- `401` for missing, expired, revoked, or invalid bearer token.

## GET /api/v1/measurements/<id>

Returns one owned measurement, including recognition status, recognized values when available, and original image link.

**Auth**: Required.

**Success 200 for pending**:

```json
{
  "id": "msr_123",
  "status": "pending",
  "measurementTime": "2026-05-27T12:00:00.000Z",
  "imageUrl": "/api/v1/measurements/msr_123/image"
}
```

**Success 200 for recognized**:

```json
{
  "id": "msr_123",
  "status": "recognized",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 68,
  "armSide": "left",
  "measurementTime": "2026-05-27T12:00:00.000Z",
  "imageUrl": "/api/v1/measurements/msr_123/image"
}
```

**Success 200 for failed**:

```json
{
  "id": "msr_123",
  "status": "failed",
  "measurementTime": "2026-05-27T12:00:00.000Z",
  "recognitionError": "Measurement could not be recognized from this image.",
  "imageUrl": "/api/v1/measurements/msr_123/image"
}
```

**Failure cases**:
- `401` for missing, expired, revoked, or invalid bearer token.
- `404` when the measurement does not exist or is not owned by the authenticated user.

## POST /api/v1/measurements/<id>/save

Confirms a recognized owned measurement so it appears in default history.

**Auth**: Required.

**Success 201**:

```json
{
  "id": "msr_123",
  "status": "saved",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 68,
  "armSide": "left",
  "measurementTime": "2026-05-27T12:00:00.000Z",
  "savedAt": "2026-05-27T12:05:00.000Z"
}
```

**Failure cases**:
- `401` for missing, expired, revoked, or invalid bearer token.
- `404` when the measurement does not exist or is not owned by the authenticated user.
- `409` when the measurement is not in a recognized state.

## GET /api/v1/measurements/<id>/image

Returns the original image binary for an owned measurement.

**Auth**: Required.

**Success 200**:
- `Content-Type`: `image/jpeg` or `image/png`.
- Body: original image bytes.

**Failure cases**:
- `401` for missing, expired, revoked, or invalid bearer token.
- `404` when the measurement does not exist, is not owned by the authenticated user, or has no stored image.

## Image Link

Detail responses include an `imageUrl` link to the original image. The implementation must ensure this URL is owner-protected or time-limited. The list endpoint never returns image binary data.
