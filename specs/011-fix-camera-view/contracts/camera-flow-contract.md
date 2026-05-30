# Contract: Camera Flow Behavior

## Scope

Defines the mobile-app behavioral contract for post-login camera readiness and one-tap capture.

## Inputs

1. Authenticated session exists in mobile session store.
2. Camera permission state is one of: granted, denied, unavailable.
3. User can trigger capture from the primary camera action.

## Outputs

1. Live camera preview is visible when permission and camera availability are valid.
2. Capture action produces an image payload compatible with existing upload gateway.
3. Successful upload transitions route from Camera to History.
4. Failure states render user-visible error text and preserve non-camera actions.

## Required Invariants

1. Camera screen MUST not require a preliminary "take picture" mode switch to show preview.
2. One tap on primary capture action MUST trigger capture attempt.
3. Camera and upload failures MUST be visible to user and MUST NOT be log-only.
4. History navigation MUST remain available even when camera initialization fails.
5. Behavior changes MUST stay inside mobile/android.

## Failure Contract

1. Permission denied/unavailable: show localized error and keep History action enabled.
2. Camera bind/capture failure: show localized error and allow retry.
3. Upload API failure: show API error message and keep user on Camera route.

## Non-Goals

1. No API contract changes.
2. No backend or API test changes.
