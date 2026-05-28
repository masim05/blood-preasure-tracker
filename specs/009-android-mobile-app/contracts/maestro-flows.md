# Contract: Maestro Happy-Path Flows

Every in-scope Android user story requires one happy-path Maestro flow under `mobile/android/maestro`.

## Shared Requirements

- Flows run against the Android app built from `mobile/android`.
- Local API is started separately with `npm run api`.
- Test data setup must not require API code or API test changes.
- Selectors should use stable Compose semantics/content descriptions/resource IDs rather than fragile text-only matching where practical.
- Error-path behavior is unit-tested; Maestro covers required happy paths.
- Password entry flows use Android standard password masking behavior; Maestro does not assert raw password text visibility.
- The clarified screen journey is: Auth -> Guide -> Camera for new accounts, Auth -> Camera for login, Camera -> History by History button, and Camera -> History after successful upload.

## US1: `us1-signin.yaml`

**Start**: App launched with no active session on the combined auth screen.

**Steps**:
1. Select New Account mode/tab.
2. Enter new account email and password.
3. Submit account creation.
4. Verify guide screen is visible.

**Pass signal**: Guide text asking for a clear picture with tonometer and arm is visible.

## US2: `us2-guide.yaml`

**Start**: Authenticated state after New Account creation and guide screen visible.

**Steps**:
1. Verify guide placeholder text.
2. Tap Next.
3. Verify camera screen is visible.

**Pass signal**: Camera/upload action and History action are visible.

## US3: `us3-login.yaml`

**Start**: Existing user account available and app launched signed out on the combined auth screen.

**Steps**:
1. Select Login mode/tab.
2. Enter valid email and password.
3. Submit login.
4. Verify camera screen is visible.

**Pass signal**: Camera/upload action and History action are visible.

## US4: `us4-capture-or-history.yaml`

**Start**: Authenticated user on camera screen.

**Steps**:
1. Trigger measurement image capture/upload.
2. Verify successful upload opens history.
3. Return to or relaunch camera setup as needed.
4. Tap History from the camera screen.
5. Verify history screen opens.

**Pass signal**: History table/filter UI is visible after successful upload and after choosing History.

## US5: `us5-history-filter.yaml`

**Start**: Authenticated user with saved measurements available.

**Steps**:
1. Open history screen from camera.
2. Verify saved measurement rows are visible.
3. Select a date range using Compose Material 3 date selector controls.
4. Apply the date range filter.
5. Verify filtered history state is visible.
6. Verify rows are displayed as non-editable, vertically aligned history entries.

**Pass signal**: Date selector state remains visible and a saved row containing the expected measurement values remains aligned on the history screen. No measurement-detail screen is opened.

## Deferred

No Maestro flow is required for US6 in this feature because measurement detail, image review, value override, and reviewed save are explicitly deferred.
