# E2E Scenarios: Localize Android app names and prepare v0.1.2

This bug fix is metadata/localization-only and does not change UI behavior.

## Scenario 1: Localized app labels resolve per locale
- Given an app build with locale resources
- When Android resolves app label strings for each supported locale
- Then the locale-specific `app_name` is used
- And `auth_title` matches the same localized product name

## Scenario 2: PRC Chinese compliance label
- Given locale `zh-rCN`
- When app labels are resolved
- Then `app_name` is `AI 血压记录仪`
- And `auth_title` is `AI 血压记录仪`

## Scenario 3: Release packaging
- Given updated localization resources and version
- When assembling release APK
- Then build succeeds with updated app version `0.1.2`
