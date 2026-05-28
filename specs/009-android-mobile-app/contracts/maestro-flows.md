# Contract: Maestro Happy-Path Flows

Every in-scope Android user story requires one happy-path Maestro flow under `mobile/android/maestro`.

## Shared Requirements

- Flows run against the Android app built from `mobile/android`.
- Local API is started separately with `npm run api`.
- Test data setup must not require API code or API test changes.
- Selectors should use stable accessibility/test identifiers rather than fragile text-only matching where practical.
- Error-path behavior is unit-tested; Maestro covers required happy paths.

## US1: `us1-signin.yaml`

**Start**: App launched with no active session.

**Steps**:
1. Open signin screen.
2. Enter new account email and password.
3. Submit signin.
4. Verify guide screen is visible.

**Pass signal**: Guide text asking for a clear picture with tonometer and arm is visible.

## US2: `us2-guide.yaml`

**Start**: Authenticated state after signin.

**Steps**:
1. Open guide screen.
2. Verify guide placeholder text.
3. Continue from guide.
4. Verify measurement action screen is visible.

**Pass signal**: Capture and history actions are visible.

## US3: `us3-login.yaml`

**Start**: Existing user account available and app launched signed out.

**Steps**:
1. Open login screen.
2. Enter valid email and password.
3. Submit login.
4. Verify measurement action screen is visible.

**Pass signal**: Capture and history actions are visible.

## US4: `us4-capture-or-history.yaml`

**Start**: Authenticated user on measurement action screen.

**Steps**:
1. Tap capture action.
2. Verify camera view or permission request appears.
3. Return to measurement action screen.
4. Tap history action.
5. Verify history screen opens.

**Pass signal**: History table/filter UI is visible after choosing history.

## US5: `us5-history-filter.yaml`

**Start**: Authenticated user with saved measurements available.

**Steps**:
1. Open history screen.
2. Verify saved measurement rows are visible.
3. Enter/apply date range filter.
4. Verify filtered history state is visible.
5. Verify rows are displayed as non-editable history entries.

**Pass signal**: Date filter remains visible and history rows remain on the history screen.

## Deferred

No Maestro flow is required for US6 in this feature because US6 is explicitly deferred.
