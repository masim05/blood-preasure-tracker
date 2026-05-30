# Contract: Maestro US4 Happy Path

## Flow File

- `mobile/android/maestro/us4-capture-or-history.yaml`

## Required Scenario

1. Start from signed-in path that reaches Camera route.
2. Assert camera screen is visible with camera-ready semantics/tag.
3. Trigger one-tap capture action.
4. On successful upload, assert History screen action/element is visible.

## Selector Rules

1. Use stable resource-id/testTag selectors only.
2. Do not rely on visible localized text as primary selector.
3. Preserve selector stability when copy/localization changes.

## Pass Criteria

1. Flow runs without manual intervention on emulator.
2. One capture action is sufficient to proceed from Camera toward History.
3. Final assertion confirms History route reached after successful upload.

## Failure Handling

1. If upload fails due environment/network, flow should fail with clear step context.
2. Permission-specific flows are covered separately from this happy-path contract.
