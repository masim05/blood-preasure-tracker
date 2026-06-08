# Maestro Flows

These flows cover the happy paths for US1 through US7. They use stable Android resource IDs rather than visible text selectors so localized strings can change without breaking the flows.

Each flow also asserts that the API calls it triggers have been executed: if any API call is disabled the corresponding assertion will fail.

Run from `mobile/android` after installing the debug app on an emulator:

```bash
maestro test maestro/us1-signin.yaml
maestro test maestro/us2-guide.yaml
maestro test maestro/us3-login.yaml
maestro test maestro/us4-upload.yaml
maestro test maestro/us4-capture-or-history.yaml
maestro test maestro/us5-history-filter.yaml
maestro test maestro/us6-measurement-detail.yaml
maestro test maestro/us7-language-selection.yaml
```
