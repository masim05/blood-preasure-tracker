import { spawnSync } from 'node:child_process';

const prompt = `Generate or update docs/openapi.yaml for the mobile blood pressure API.

Use these source-of-truth files:
- specs/006-mobile-bp-api/contracts/api.md
- src/adapters/inbound/http/auth.controller.ts
- src/adapters/inbound/http/measurements.controller.ts
- src/adapters/inbound/http/dto/auth.dto.ts
- src/adapters/inbound/http/dto/measurement.dto.ts

Requirements:
- Write a complete OpenAPI 3.1 YAML document to docs/openapi.yaml.
- Include all /api/v1 endpoints: signin, login, measurements upload/list/detail/image/save.
- Include bearer auth security for protected endpoints only.
- Include request bodies, query/path parameters, response schemas, error schemas, examples, and binary image response content types.
- Derive response status codes from current NestJS controller behavior. Bare @Post() handlers without @HttpCode return 201 by default; prefer that runtime behavior over stale contract prose when they conflict.
- Use stable ordering and formatting. If docs/openapi.yaml already satisfies these requirements, leave it unchanged.
- Keep descriptions aligned with the contract and current controllers. When contract and controllers conflict, current controllers/runtime behavior wins.
- Do not edit source code, package files, tests, or specs.
- After writing docs/openapi.yaml, briefly report what changed.`;

const result = spawnSync(
  'copilot',
  [
    '-C',
    process.cwd(),
    '--allow-all-tools',
    '--allow-all-paths',
    '--no-ask-user',
    '--silent',
    '--prompt',
    prompt,
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Failed to run copilot CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
