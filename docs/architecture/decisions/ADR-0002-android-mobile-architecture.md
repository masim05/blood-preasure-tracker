# ADR-0002: Android Mobile Architecture Boundaries

## Status

Accepted

## Context

The repository already documents server architecture in detail, but Android architecture boundaries were implicit in code and spread across implementation files. That made it easy to place business rules in UI/framework code or bypass port boundaries when adding features.

The project needs explicit, written Android architecture guidance so contributors can extend the app without ambiguity and without violating dependency direction.

## Decision

Document and enforce Android architecture as:

- `MainActivity` is the composition root and route coordinator.
- UI layer (`ui/screens/*`) is render + event wiring only.
- Flow layer (`core/flow/*`) owns route transitions and operation orchestration.
- Domain/model/validation (`core/model/*`, `core/validation/*`) own typed business state and pure validation.
- Infrastructure adapters (`adapters/*`) own side effects and implement `core/ports/*`.

Canonical dependency direction:

```txt
UI/Activity -> Flow -> Port contracts <- Adapters
```

## Consequences

- Android behavior becomes easier to reason about and harder to misuse because each layer has a single responsibility.
- New capabilities can be added by introducing or extending ports/adapters without leaking transport or storage details into flow/UI code.
- Reviewers have concrete boundary checks for architecture conformance instead of relying on implicit conventions.
