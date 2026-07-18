# Architecture Boundaries

This document defines module and dependency boundaries.

## Web server

The web server follows the repository hexagonal boundary from spec 006: transport, persistence, storage, provider, and framework details stay at edges; account, authentication, ownership, upload validation, recognition state, save confirmation, and history filtering rules stay in application/domain code.

Server dependency direction:

```txt
NestJS bootstrap/module/controllers/guards/middleware/worker
  -> application use cases
    -> application ports + domain entities/services
      <- outbound adapters implement ports
```

Server boundary rules:

- Controllers/guards own request extraction and transport validation only.
- Use cases depend on ports/domain; never on Nest request/response, DB clients, filesystem APIs, or provider SDKs.
- Domain code must not import NestJS, `pg`, filesystem, provider SDKs, or HTTP DTOs.
- New persistence/storage/provider technologies must be introduced as adapters behind ports.

## Android app

Android app boundary follows the same dependency intent: Android UI and framework code trigger use-case flows; business decisions remain in flow/domain code; infrastructure details remain in adapters.

Android dependency direction:

```txt
Compose UI + Android activity/navigation
  -> core flows
    -> core ports + domain model/validation
      <- adapters (HTTP API, camera, session persistence)
```

### Android module responsibilities

- `mobile/android/app/src/main/kotlin/.../MainActivity.kt`
  - composition root for Android runtime;
  - wires adapters into flows;
  - maps flow state to `MobileUiState`;
  - owns navigation synchronization.
- `core/flow/*`
  - route transitions and user-visible operation orchestration;
  - validation-before-side-effects policy;
  - no direct dependency on Android framework APIs.
- `core/model/*`, `core/validation/*`
  - typed domain state (`Session`, `Measurement`, `MeasurementDetail`, filters);
  - pure validation rules (email/password/image/date filters).
- `core/ports/*`
  - contracts for auth, upload, history, detail, session store, camera.
- `adapters/api/*`
  - endpoint/path mapping and HTTP transport details;
  - API/network/timeout/parse error mapping.
- `adapters/camera/*`
  - camera capture readiness and payload handoff.
- `adapters/session/*`
  - encrypted token persistence with Android Keystore-backed encryption.
- `ui/screens/*`
  - rendering and event emission only.

### Android boundary rules (mandatory)

- Compose screens must not call HTTP clients, camera APIs, or keystore/persistence directly.
- Flows must depend only on ports/domain validation and must not import Android UI/lifecycle classes.
- Adapter classes must not own route or feature business policies.
- Session persistence must remain behind `SessionStore`; switching storage technology must not require changes in flow classes.
- API base URL/environment selection stays in Gradle/BuildConfig, not in screen logic.
- Any new mobile capability must preserve `UI -> flow -> port <- adapter` direction and avoid cross-layer shortcuts.

## Repository-wide invariants

- Keep business logic independent from infrastructure details.
- Keep external service calls behind adapters/clients.
- Do not let UI/transport layers own business rules.
- Avoid circular cross-module imports.
