# Data Model: CI Seed Hooks

## AndroidCiBootstrapInvocation

**Purpose**: Represents the dedicated Jest bootstrap execution that prepares Android Maestro fixtures before the Android CI job consumes them.

**Fields**:

- `command`: string, required; the Jest command/path the Android job invokes for bootstrap.
- `databaseUrl`: string, required; resolved from `.env.test` or process environment.
- `requiresDbInit`: boolean, required; always `true`.
- `status`: enum, required; `pending`, `running`, `succeeded`, or `failed`.
- `failureReason`: optional string; populated when bootstrap cannot connect or seed.

**Validation**:

- Must run only after the database initialization step succeeds.
- Must complete successfully before Gradle build or Maestro execution starts.
- Must fail fast when the database schema is unavailable.

## MaestroUserFixture

**Purpose**: Represents a deterministic authenticated user required by Android Maestro happy-path flows.

**Fields**:

- `id`: string, required; stable value such as `usr_maestro_us3`.
- `email`: string, required; stable login identity such as `us3@example.com`.
- `passwordHash`: string, required; PBKDF2 hash derived from the shared test password.
- `createdAt`: ISO-8601 string, required.
- `updatedAt`: ISO-8601 string, required.

**Validation**:

- Email must be unique in `user_accounts`.
- Re-seeding must upsert by email without creating duplicates.
- Hashing parameters must match the API login expectations already used in CI.

## MaestroMeasurementFixture

**Purpose**: Represents the saved measurement fixture consumed by history/detail Maestro flows.

**Fields**:

- `id`: string, required; stable value such as `msr_maestro_us5`.
- `userId`: string, required; references `MaestroUserFixture.id`.
- `status`: enum, required; `saved`.
- `systolic`: integer, required.
- `diastolic`: integer, required.
- `pulse`: integer, required.
- `armSide`: enum, required; `left` for the baseline fixture.
- `measurementTime`: ISO-8601 string, required.
- `savedAt`: ISO-8601 string, required.
- `createdAt`: ISO-8601 string, required.
- `updatedAt`: ISO-8601 string, required.

**Validation**:

- Fixture must belong to an existing seeded user.
- Re-seeding must upsert by measurement ID without creating duplicates.
- Status must remain `saved` so history screens surface the record predictably.

## WorkflowSeedContract

**Purpose**: Represents the ordering guarantees between CI steps and the seeded fixture state.

**Fields**:

- `jobName`: string, required; `android-mobile`.
- `dbInitStep`: string, required.
- `bootstrapStep`: string, required.
- `buildStep`: string, required.
- `apiStartStep`: string, required.
- `maestroStep`: string, required.

**Validation**:

- `dbInitStep` must precede `bootstrapStep`.
- `bootstrapStep` must precede Android build, API start, and Maestro execution.
- The workflow must not contain inline seed payloads once `bootstrapStep` is present.
