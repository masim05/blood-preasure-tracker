# Architecture Boundaries

This document defines module and dependency boundaries.

## Web server

The web server follows the repository's hexagonal architecture boundary from spec 006: transport, persistence, storage, provider, and framework details stay at the edges; account, authentication, measurement ownership, upload validation, recognition state, save confirmation, and history filtering rules stay in domain/application code.

Dependency direction for server code is:

```txt
NestJS bootstrap/module/controllers/guards/middleware/worker
	-> application use cases
		-> application ports + domain entities/services
			<- outbound adapters implement ports
```

Inbound adapters are responsible for HTTP and worker mechanics only:

- `src/api-main.ts` bootstraps Nest, logging levels, configuration loading, and port binding.
- `src/api.module.ts` is the composition root and the only place that should bind application ports to concrete server adapters.
- `src/adapters/inbound/http/` owns controllers, DTO parsing, bearer authentication, auth rate limiting, request/status logging, and HTTP error mapping.
- `src/adapters/inbound/http/web/` owns server-rendered public HTML pages and localization for `/` and `/policy`.
- `src/adapters/inbound/worker/` owns scheduled recognition-task polling and operational worker logs.

Application and domain code own business decisions:

- `src/application/use-cases/` coordinates one user-visible operation at a time, such as account creation, login, bearer token authentication, measurement upload, recognition processing, detail/image lookup, save confirmation, and history listing.
- `src/application/ports/` defines persistence, storage, password hashing, bearer token, image metadata, model catalog, output, and LLM provider contracts consumed by use cases.
- `src/domain/entities/` defines user accounts, bearer tokens, measurements, measurement images, recognition tasks, and CLI evaluation records.
- `src/domain/services/` owns pure policies such as email normalization, password rules, image upload validation, measurement state transitions, pagination/time range validation, timestamp policy, and CSV/evaluation rules.

Outbound adapters implement external effects behind ports:

- `src/adapters/outbound/postgres/` persists users, token hashes, measurements, measurement image metadata, and recognition tasks through `pg` and the migration schema.
- `src/adapters/outbound/filesystem/measurement-image-storage.adapter.ts` writes original JPEG/PNG files to `MEASUREMENT_IMAGE_DIR`, reads them by owned measurement id, and supplies the API image URL path.
- `src/adapters/outbound/crypto/` hashes passwords and generates/hashes opaque bearer tokens with Node.js crypto.
- `src/adapters/outbound/llm/` selects a model and calls the OpenAI vision provider through the LLM provider port.

Boundary rules for future server changes:

- Controllers and guards must not implement account, ownership, recognition-state, save-state, pagination, or upload-format business rules beyond DTO/header extraction and transport validation.
- Use cases must depend on ports and domain services, not on Nest request/response objects, Postgres clients, filesystem APIs, or provider SDKs.
- Domain entities and services must not import NestJS, `pg`, filesystem APIs, OpenAI SDK types, or HTTP DTOs.
- New persistence, queue, object-storage, or recognition-provider technology must be introduced as an adapter behind an existing or new application port.
- `ApiModule` should remain the server composition root; avoid adapter-to-adapter imports that bypass application ports.
- Public HTML pages are a web inbound adapter and must not become the owner of mobile API workflow rules.
- Request logging must remain metadata-only. It must not include bodies, tokens, cookies, passwords, multipart payloads, image bytes, or recognized health values unless a separate user-safe warn/error path explicitly justifies the field.

Default repository rules that still apply across all runtimes:

- Keep domain or business logic independent from infrastructure details.
- Keep external service calls behind adapters or clients.
- Do not let UI or transport layers own business rules.
- Do not introduce cross-module imports that create circular dependencies.
- Prefer dependency direction from outer layers toward stable inner abstractions.
