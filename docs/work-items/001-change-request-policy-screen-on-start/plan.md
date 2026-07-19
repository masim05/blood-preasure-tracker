# Implementation plan

1. Add a new Android startup gate composable that renders the privacy policy, language selector, and accept action.
2. Persist a boolean acceptance flag in the existing Android preferences store.
3. Update `MainActivity` to show the gate before the existing nav host when acceptance is missing.
4. Add localized strings for the new gate copy in the Android resources.
5. Add new Android tests covering first-launch gating, acceptance persistence, and language switching.
6. Run targeted Android validation for the changed flow.
