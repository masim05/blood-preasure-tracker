# E2E scenarios

1. Fresh install / first launch:
   - open the app;
   - see the privacy-policy gate immediately;
   - switch language from the top selector;
   - read the policy;
   - accept it;
   - continue into the existing auth flow.

2. Relaunch after acceptance:
   - close and reopen the app;
   - confirm the gate is skipped;
   - confirm the existing auth or main content is shown as before.

3. Language change on the gate:
   - open the app in a non-default device language;
   - confirm the gate text is localized;
   - change the selector;
   - confirm the UI language updates.
