# Contract: Mobile API Integration Output

This contract defines the required Jest structure and observable output for `tests/integration/mobile-api.integration.test.ts` after assertion splitting.

## Scope

- Applies only to the `describe('mobile API integration flow', ...)` suite.
- Applies to every existing endpoint-level `describe` currently nested directly under that suite.
- Does not change HTTP API behavior, database schema, filesystem behavior, OpenAI mocking, or any production source file.

## Required Scenario Structure

Each existing endpoint-level block must keep its exact `describe` title. Inside that block, focused examples must expose the scenario's assertions separately.

### JSON Response Scenarios

Required examples:

```text
responds with HTTP <code>
responds with proper json
```

Additional examples are required when the scenario already validates side effects, such as:

```text
creates a user in PostgreSQL
creates a bearer token in PostgreSQL
persists the measurement in PostgreSQL
stores the image on disk
queues a recognition task in PostgreSQL
does not call OpenAI during upload
logs request metadata without sensitive fields
```

### Binary Image Response Scenarios

Required examples:

```text
responds with HTTP <code>
responds with binary image data
```

The binary response-format example must assert the image response contract already present in the suite, including content type and byte length.

## Required Validation Behavior

- `responds with HTTP <code>` examples assert only the status code for the scenario's primary response.
- `responds with proper json` examples assert the existing success or error JSON shape for the scenario's primary response.
- Side-effect examples assert existing PostgreSQL, filesystem, OpenAI-boundary, or logging expectations.
- Scenario setup must remain isolated and deterministic after splitting.
- No endpoint-level scenario may be split into additional endpoint-level `describe` blocks solely to satisfy naming.

## Acceptance Check

Verbose Jest output for `mobile API integration flow` must make the failed concern identifiable from the example name alone for every endpoint-level scenario.
