# Logging Contract: Mobile BP API

## Runtime Mode Selection

The API derives logging mode from `NODE_ENV` only.

| `NODE_ENV` value | Logging mode | Required levels |
|------------------|--------------|-----------------|
| `production` | Production | Warn and above |
| unset | Development | Debug and above |
| any other value | Development | Debug and above |

## HTTP Request Debug Logs

When debug logging is enabled, the API emits one debug log entry for every completed HTTP request handled by the mobile API.

Required fields:

```json
{
  "level": "debug",
  "method": "POST",
  "path": "/api/v1/measurements",
  "statusCode": 201,
  "durationMs": 12
}
```

Field rules:

- `level` is `debug` for request/status entries.
- `method` is the HTTP request method.
- `path` is the request URL or route path.
- `statusCode` is the final HTTP response status.
- `durationMs` is elapsed request handling time in milliseconds.

## Production Suppression

When `NODE_ENV=production`, debug-level HTTP request/status entries are not emitted. Warning and error logs remain enabled.

## Privacy And Safety Exclusions

HTTP request/status log entries must not include:

- Request bodies.
- Response bodies.
- `Authorization` headers or bearer token values.
- Cookies.
- Passwords.
- Multipart payload data.
- Uploaded image bytes.
- Recognized blood pressure values unless a separate warn/error message has a user-safe reason to include them.

## Acceptance Checks

- With `NODE_ENV=development`, a successful `POST /api/v1/signin` emits one debug entry with method `POST` and status `201`.
- With `NODE_ENV=development`, failed authenticated requests emit one debug entry with the actual failure status, such as `401`, `404`, or `409`.
- With `NODE_ENV=production`, the same requests do not emit debug request/status entries.
- Tests assert sensitive request data is absent from emitted entries.
