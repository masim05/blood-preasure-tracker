# Contract: Android API Client

`docs/openapi.yaml` is the read-only source of truth. This contract documents the Android client boundary for the in-scope feature only.

## Global Rules

- Base URL defaults to `http://10.0.2.2:3000` for Android emulator local development against the host API.
- Authenticated calls send `Authorization: Bearer <accessToken>`.
- JSON requests use `Content-Type: application/json`.
- Image upload uses `multipart/form-data` field name `image`.
- API error bodies follow `{ "error": string, "message": string }` and `message` must be shown to the user on the current Compose screen.
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

**UI contract**: In New Account mode on the combined auth screen, success routes to Guide. Errors remain visible on the auth screen in New Account mode.

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

**UI contract**: In Login mode on the combined auth screen, success routes to Camera. Errors remain visible on the auth screen in Login mode.

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

**UI contract**: Upload starts from the Camera screen. Success opens History. Errors remain visible on the Camera screen with retry/navigation available.

## listMeasurements

**Request**: `GET /api/v1/measurements?page=<page>&pageSize=<pageSize>&from=<iso>&to=<iso>`

- Authenticated.
- `from` and `to` are optional inclusive ISO-8601 bounds.
- Android UI obtains `from` and `to` via Compose Material 3 date selector controls, not free-text inputs.

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

**UI contract**: History renders returned items as non-editable, vertically aligned Compose rows with stable columns for measurement time, systolic, diastolic, pulse, arm side, and status. Tapping a row must not open measurement detail in this feature.

## Deferred API Operations

The Android client must not implement measurement detail, image retrieval, override, or save workflows in this feature. Endpoints such as `GET /api/v1/measurements/{id}`, `GET /api/v1/measurements/{id}/image`, and `POST /api/v1/measurements/{id}/save` remain out of scope for implementation.
