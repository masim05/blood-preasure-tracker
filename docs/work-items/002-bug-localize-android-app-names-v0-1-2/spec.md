# Spec: Localize Android app names and prepare v0.1.2

## Goal
Align Android localized app names with store-localized names so release APK metadata is locale-correct for existing locales, including the required PRC Chinese value.

## Scope
- Update only `app_name` and `auth_title` in existing `mobile/android/app/src/main/res/values-*/strings.xml` locale directories.
- Keep `auth_title` equal to `app_name` for each locale.
- Set PRC Chinese (`values-zh-rCN`) `app_name` and `auth_title` to exactly `AI 血压记录仪`.
- Bump Android app version to `0.1.2` (`versionName`) and increment `versionCode` by 1.

## Constraints
- No changes to default English `values/strings.xml` `app_name`.
- No changes to other strings.
- No behavior, package, icon, signing, or build configuration changes.

## Acceptance Criteria
1. Every existing non-default locale `strings.xml` has localized `app_name` and matching `auth_title`.
2. `values-zh-rCN` has:
   - `<string name="app_name">AI 血压记录仪</string>`
   - `<string name="auth_title">AI 血压记录仪</string>`
3. `mobile/android/app/build.gradle.kts` has `versionName = "0.1.2"` and `versionCode` incremented by 1.
4. Android release build succeeds.
