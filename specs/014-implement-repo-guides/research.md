# Research: Implement According To Repo Guides

## Decision: Treat `README.md` and `CONTRIBUTING.md` as authoritative workflow policy inputs

**Rationale**: The feature intent is guide-driven implementation. Using those two files as source-of-truth avoids policy duplication and keeps enforcement explicitly traceable to contributor-facing documentation.

**Alternatives considered**: Defining policy only in tests/scripts was rejected because contributors would lack a canonical human-readable source. Defining policy only in prose docs was rejected because regressions would not be automatically detected.

## Decision: Enforce guide alignment through contract-style Jest tests

**Rationale**: The repository already uses contract tests (for example workflow/script contracts) to protect operational expectations. Reusing this pattern for guide compliance provides low-friction, reviewable guardrails.

**Alternatives considered**: Shell-only checks in CI were rejected because they are harder to unit test and less discoverable. Manual review checklist-only enforcement was rejected because it is error-prone and non-deterministic.

## Decision: Keep runtime product behavior out of scope

**Rationale**: The request is process/policy oriented. Limiting scope to documentation and validation contracts minimizes regression risk in API, CLI, and Android user-facing behavior.

**Alternatives considered**: Introducing runtime feature flags or API-side workflow checks was rejected because they do not improve contributor workflow compliance and would violate scope.

## Decision: Keep dependency footprint unchanged

**Rationale**: Existing built-ins and Jest infrastructure are sufficient for parsing docs and validating policy constraints. This aligns with dependency policy and keeps setup simple.

**Alternatives considered**: Adding specialized lint/markdown policy plugins was rejected because current tooling can express required checks without adding third-party operational overhead.

## Decision: Use one canonical validation profile for contributor pre-PR flow

**Rationale**: Guides currently define expectations across build/lint/tests; a single profile reduces ambiguity and makes policy enforcement auditable.

**Alternatives considered**: Multiple optional profiles were rejected because they increase confusion and make CI drift harder to detect.