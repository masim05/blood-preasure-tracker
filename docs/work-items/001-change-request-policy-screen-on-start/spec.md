# Policy screen on start

## Problem
The Android app can reach auth or sign-up flows before explicitly prompting users to read and accept the privacy policy on first launch.

## Goal
Show a startup privacy-policy gate on app launch until the user accepts it once. The screen must:
- be shown before auth/main content when not yet accepted;
- render in the current app language, defaulting to English;
- provide a language selector at the top that changes the app language;
- remember acceptance and stop showing the gate after approval.

## Constraints
- Android app only.
- Do not change existing screens.
- Do not remove or modify existing tests.

## Out of scope
- Non-Android clients.
- Policy-content changes beyond what is needed for the gate UI.

## Acceptance criteria
- First launch shows the policy gate.
- Accepting the policy persists the choice and skips the gate on later launches.
- Language changes update the gate UI/app language.
- Existing auth and main navigation continue to work after acceptance.
