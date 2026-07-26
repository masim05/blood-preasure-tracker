# Test Plan: Localize Android app names and prepare v0.1.2

## Validation Steps
1. Static verification:
   - Check each `values-*/strings.xml` updates only `app_name` and `auth_title`.
   - Check `auth_title == app_name` in each localized file.
   - Check `values-zh-rCN` uses exact `AI 血压记录仪`.
2. Version verification:
   - Confirm `versionName = "0.1.2"` and `versionCode` incremented by +1 in `mobile/android/app/build.gradle.kts`.
3. Build verification:
   - Run `mobile/android/gradlew -p mobile/android :app:assembleRelease`.

## Pass Criteria
- All static checks satisfy scope and constraints.
- Release build finishes successfully.
