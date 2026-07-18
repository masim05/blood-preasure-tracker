# Web Server Architecture Documentation E2E Scenarios

## Scenario 1: Developer Locates Server Runtime Entry Points

Given a developer reads `docs/architecture/project-structure.md`, when they look for the web server entrypoint and composition root, then they can find `src/api-main.ts` and `src/api.module.ts`.

## Scenario 2: Developer Understands API Data Flow

Given a developer reads `docs/architecture/overview.md`, when they trace a measurement upload, then they can identify the HTTP controller, bearer guard, upload validation, image storage, measurement persistence, recognition task queue, worker, LLM provider, and history/detail/save paths.

## Scenario 3: Developer Preserves Boundaries

Given a developer reads `docs/architecture/boundaries.md`, when they plan a new server feature, then they can tell whether logic belongs in a controller/guard, use case, domain service, application port, or outbound adapter.