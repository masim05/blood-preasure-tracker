# Phase 0 Research: Integration Test Assertions

## Decision: Preserve endpoint-level `describe` blocks and split `it` examples inside them

**Rationale**: The clarified requirement says existing endpoint-level scenario names are already the correct grouping. Keeping those `describe` blocks stable preserves reviewer orientation and avoids test-output churn unrelated to the requested assertion granularity.

**Alternatives considered**: Creating additional endpoint-level `describe` blocks for response, persistence, and logging concerns was rejected because it would violate FR-007 and FR-008 and make multi-request scenarios harder to read as one scenario.

## Decision: Use per-example scenario setup helpers inside each endpoint-level `describe`

**Rationale**: The outer `mobile API integration flow` hooks reset rate limits, logs, mocked OpenAI calls, database rows, and image files before every `it`. Split examples must therefore run their required scenario setup independently so assertions remain deterministic and order-independent. Scenario-local helper functions can keep setup readable without sharing mutable state across examples.

**Alternatives considered**: Sharing one response through `beforeAll` or cross-example variables was rejected because the outer reset hooks would invalidate persisted state and introduce order dependence. Removing the outer reset hooks was rejected because it would weaken existing test isolation. Repeating scenario setup per focused example has some runtime cost, but it preserves correctness and keeps the change scoped.

## Decision: Keep response-format assertions contract-focused and behavior-preserving

**Rationale**: The feature changes assertion names and granularity, not API expectations. JSON responses should continue to use the current body shapes and expose `responds with proper json`; binary image responses should use wording that identifies image bytes and headers rather than JSON.

**Alternatives considered**: Relaxing body assertions to only check that a response is JSON was rejected because it would reduce contract coverage. Renaming binary checks to `responds with proper json` was rejected because it is inaccurate for image responses.

## Decision: Keep validation MCP-free and use existing npm scripts

**Rationale**: The constitution requires MCP-free development. The repository already provides database initialization and integration test scripts, and no new dependency is needed for test-output assertions.

**Alternatives considered**: Adding a custom reporter, snapshot tooling, or MCP-based verification was rejected because the existing Jest output and repository scripts are sufficient for the requested behavior.
