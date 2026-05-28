# Maestro Flows

These flows cover the happy paths for US1 through US5. They use stable Android resource IDs rather than visible text selectors so localized strings can change without breaking the flows.

Run from `mobile/android` after installing the debug app on an emulator:

```bash
maestro test maestro/us1-signin.yaml
maestro test maestro/us2-guide.yaml
maestro test maestro/us3-login.yaml
maestro test maestro/us4-capture-or-history.yaml
maestro test maestro/us5-history-filter.yaml
```
