# Maestro Flows

These flows cover the happy paths for US1 through US7. They prefer stable Android resource IDs for app-owned UI, with visible text selectors used only where the asserted content is intentionally stable (for example seeded numeric values or system permission prompts).

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
