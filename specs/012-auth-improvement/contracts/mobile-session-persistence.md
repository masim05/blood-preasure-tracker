# Contract: Mobile Session Persistence

## Scope

This contract captures Android-side rules for User Story 1.

## Rules

- Session data is persisted at rest using encrypted local storage in `mobile/android`.
- App startup restores a valid persisted session and routes directly to Camera (screen 3).
- Corrupted or unreadable persisted session data clears persisted state and shows a localized user-visible error on auth screen.
- Login and restore API auth failures must surface visible localized UI errors.
- Visible UI copy introduced for restore/persistence behavior must be localized in `values` and `values-es`.

## Verification

- Flow/state tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/core/flow/AppFlowsTest.kt`.
- Encrypted store tests in `mobile/android/app/src/test/kotlin/com/masim05/bloodpressure/mobile/adapters/session/EncryptedSessionStoreTest.kt`.
- Happy-path Maestro flow in `mobile/android/maestro/us1-signin.yaml`.
