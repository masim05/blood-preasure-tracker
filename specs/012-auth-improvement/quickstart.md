# Quickstart: Authentication Improvement

## Prerequisites

- Work in `tmp/012-auth-improvement` branch/worktree.
- Node dependencies installed at repo root (`npm install`).
- Android Studio JBR available for Android unit tests.

## US1 Validation (Android)

```bash
cd mobile/android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:testDebugUnitTest :app:androidCoverageVerify
MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_DRIVER_STARTUP_TIMEOUT=300000 maestro test maestro/us1-signin.yaml
```

Expected:
- Persisted valid session restores directly to Camera.
- Corrupted persisted session routes to auth with visible localized error.
- Android unit coverage remains >= 95%.

Notes:
- Use an unlocked emulator target for deterministic Maestro execution (for example `--device emulator-5554`).
- Ensure local API auth endpoints are available before running the happy path.

## US2 Validation (API)

```bash
cd ../..
npm run test -- src/infrastructure/config/api-config.test.ts src/application/use-cases/create-account.use-case.test.ts src/application/use-cases/login-user.use-case.test.ts src/application/use-cases/authenticate-bearer-token.use-case.test.ts src/adapters/inbound/http/mobile-api.contract.test.ts
```

Expected:
- Default access-token TTL is `604800` seconds.
- Issued token expiry equals seven days from issuance.
- Legacy pre-rollout tokens preserve previously assigned expiry behavior.

## Execution Evidence

- Backend coverage validation (`npm run test:coverage`): passed (`49/49` suites, `211/211` tests).
- Android unit + coverage validation (`:app:testDebugUnitTest :app:androidCoverageVerify`): passed.
- US1 Maestro persistence validation (`maestro --device emulator-5554 test maestro/us1-signin.yaml`): passed, including stop/relaunch restore to Camera.
- Worktree isolation: all implementation changes executed under `tmp/012-auth-improvement`.
- MCP-free execution: implementation used repository-local tools and commands only.

## Regression Checklist

- Customer journey outside auth persistence entry behavior remains unchanged.
- US1 scope guard: no API code/tests changed for app-only story.
- US2 scope guard: no Android code/tests changed for API-only story.
- Work remains in `tmp/012-auth-improvement` with no direct main-checkout development.
- Implementation workflow remains MCP-free.
