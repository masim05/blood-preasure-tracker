# Android policy screen scroll fix

## Problem
The Android policy screen can become non-scrollable, causing users to get stuck and preventing them from reading full policy content.

## Goal
Ensure policy content remains scrollable and usable on Android, including long content and web policy rendering paths.

## Requirements
1. Keep existing policy content and navigation behavior unchanged.
2. Make policy view interaction reliable when content exceeds viewport.
3. Preserve back navigation and existing profile screen interactions.

## Constraints
- Android app only.
- No backend/API changes.
- Keep changes focused to policy-screen UI behavior.

## Acceptance criteria
1. Policy content is scrollable when opened from profile/about.
2. Users can navigate back from policy screen without UI deadlock.
3. Existing profile policy tests pass and include coverage for the affected flow.
