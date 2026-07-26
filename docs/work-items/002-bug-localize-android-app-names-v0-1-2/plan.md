# Plan: Localize Android app names and prepare v0.1.2

1. Confirm all existing Android locale resource directories under `values-*`.
2. Update only `app_name` and `auth_title` per locale, keeping both values identical within each file.
3. Apply required exact PRC Chinese value `AI 血压记录仪`.
4. Bump Android `versionName` to `0.1.2` and increment `versionCode`.
5. Run Android release build and verify success.
6. Prepare implementation summary for human handoff in PR.
