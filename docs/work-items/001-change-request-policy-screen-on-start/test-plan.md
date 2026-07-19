# Test plan

## Automated
- Android unit tests for acceptance state helpers and startup selection logic.
- Compose/UI test for the startup gate showing policy content and accepting it.
- Compose/UI test for language selector updates on the startup gate.

## Expected checks
- Targeted Android test task for the touched classes.
- If available in environment, a targeted Android build/test command that compiles the new gate path.

## Success criteria
- The gate appears when acceptance is missing.
- Acceptance is persisted and suppresses the gate on subsequent launches.
- The gate language changes with the selected app language.
