# Test plan

## Automated
- `ProfileScreenTest` for policy/about interaction and WebView rendering path.
- Existing privacy-policy gate tests remain green to ensure no regression in policy-related navigation.

## Checks
- Run targeted Android tests for `ProfileScreenTest` and `PrivacyPolicyGateScreenTest`.

## Success criteria
1. Policy/about flow remains interactive and back navigation works.
2. WebView policy path renders in the updated layout without fixed-height clipping.
3. No regression in policy gate tests.
