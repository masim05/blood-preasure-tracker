# Contract: Android API Client

`docs/openapi.yaml` is the read-only source of truth. This contract documents the Android client boundary for the in-scope feature only.

## Global Rules

- Base URL defaults to `http://localhost:3000` for local development.
- Authenticated calls send `Authorization: Bearer <accessToken>`.
- JSON requests use `Content-Type: application/json`.
- Image upload uses `multipart/form-data` field name `image`.
- API error bodies follow `{ "error": string, "message": string }` and `message` must be shown to the user.
- Network, timeout, parsing, and unexpected status failures must produce user-visible fallback messages.
- The Android client must not require API code, API test, backend test, or OpenAPI document changes.

## signIn

**Request**: `POST /api/v1/signin`

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple"
}
```

**Success**: HTTP 201 `AuthResponse`

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

**Handled errors**: 400 validation, 409 duplicate email, 429 rate limit, network/fallback.

## logIn

**Request**: `POST /api/v1/login`

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple"
}
```

**Success**: HTTP 201 `AuthResponse`

**Handled errors**: 400 validation, 401 unauthorized, 429 rate limit, network/fallback.

## uploadMeasurement

**Request**: `POST /api/v1/measurements`

- Authenticated.
- Multipart field `image`.
- JPEG/PNG, greater than 0 bytes and no more than 10 MB.

**Success**: HTTP 201

```json
{
  "id": "msr_123",
  "status": "pending",
  "measurementTime": "2026-05-27T12:00:00.000Z"
}
```

**Handled errors**: 400 validation, 401 unauthorized, camera/capture errors, network/fallback.

## listMeasurements

**Request**: `GET /api/v1/measurements?page=<page>&pageSize=<pageSize>&from=<iso>&to=<iso>`

- Authenticated.
- `from` and `to` are optional inclusive ISO-8601 bounds.

**Success**: HTTP 200 `MeasurementHistoryPage`

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

**Handled errors**: 400 validation, 401 unauthorized, network/fallback.

## Deferred API Operations

The Android client must not implement measurement detail, image retrieval, override, or save workflows in this feature. Endpoints such as `GET /api/v1/measurements/{id}`, `GET /api/v1/measurements/{id}/image`, and `POST /api/v1/measurements/{id}/save` remain out of scope for implementation.
