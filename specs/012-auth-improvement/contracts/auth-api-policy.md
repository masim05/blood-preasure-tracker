# Contract: Auth API Token Policy

## Scope

This contract captures API-side rules for User Story 2.

## Rules

- Access tokens issued by `/api/v1/signin` and `/api/v1/login` use a seven-day lifetime (`604800` seconds) by default.
- The policy applies to newly issued access tokens only.
- Tokens issued before rollout preserve their previously assigned expiration timestamps.
- Refresh-token behavior is unchanged by this feature.

## Verification

- Config default assertion in `src/infrastructure/config/api-config.test.ts`.
- Issuance TTL assertions in `src/application/use-cases/create-account.use-case.test.ts` and `src/application/use-cases/login-user.use-case.test.ts`.
- Expired-versus-valid behavior assertions in `src/application/use-cases/authenticate-bearer-token.use-case.test.ts`.
