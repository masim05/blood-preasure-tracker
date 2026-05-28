# Data Model: Integration Test Assertions

This feature does not introduce or change product data models, database schema, API payloads, ports, adapters, or persisted entities. The model below describes the test-output concepts used to restructure the mobile API integration suite.

## EndpointScenario

Represents one existing endpoint-level `describe` block inside `mobile API integration flow`.

**Fields**:
- `name`: Existing `describe` title, such as `POST /api/v1/signin - happy path`.
- `setup`: Scenario-local HTTP/database/filesystem operations required by each focused example.
- `primaryResponse`: The response whose status and format are asserted for the scenario.
- `responseKind`: `json` or `binaryImage`.
- `sideEffects`: Zero or more persistence, filesystem, OpenAI-boundary, or logging outcomes already covered by the scenario.

**Validation Rules**:
- `name` must remain unchanged from the current endpoint-level `describe` block.
- `setup` must be isolated per focused example and must not depend on execution order from other endpoint scenarios or sibling examples.
- `primaryResponse` must preserve the current expected status and body/header/byte assertions.

## ResponseAssertion

Represents a focused `it` example that validates one aspect of `primaryResponse`.

**Fields**:
- `name`: Required example name.
- `kind`: `status`, `jsonFormat`, or `binaryImageFormat`.
- `expectedStatus`: HTTP status code for `status` assertions.
- `expectedShape`: Existing JSON body shape, error shape, or binary image header/byte contract.

**Validation Rules**:
- Every `EndpointScenario` must include `responds with HTTP <code>`.
- JSON-returning scenarios must include `responds with proper json`.
- Binary image scenarios must include a binary/image-specific response-format name.
- Response assertions must not change expected API behavior.

## SideEffectAssertion

Represents a focused `it` example for non-response effects already covered by a scenario.

**Fields**:
- `name`: Specific persistence, filesystem, OpenAI-boundary, or logging assertion title.
- `target`: PostgreSQL table/state, filesystem image, mocked OpenAI calls, or request log entry.
- `expectedOutcome`: Existing expected count, status, call count, byte length, or redaction check.

**Validation Rules**:
- Meaningful side effects should be separate examples rather than bundled with response assertions.
- Scenarios without side effects must not invent unrelated persistence assertions.
- Side-effect assertions must use equivalent scenario-local setup to the response assertions for that endpoint scenario.

## State Transitions

No product state transitions are introduced. Test execution state transitions are:

1. Global fixture setup creates the real API, database pool, filesystem-backed storage, and mocked OpenAI provider.
2. The existing outer `beforeEach` resets rate limits, logs, mocked OpenAI calls, database rows, and image directory before every focused example.
3. Each focused example runs the scenario setup it needs and captures the primary response or relevant identifiers.
4. Focused examples assert status, response format, and side effects from their own isolated setup.
