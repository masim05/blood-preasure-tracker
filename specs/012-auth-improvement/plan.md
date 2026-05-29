# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Android Language/Version**: [Kotlin latest active LTS if Android mobile app is affected, otherwise N/A]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Android Source Root**: [`mobile/android` if Android mobile app is affected, otherwise N/A]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**API Error UX**: [How every API error returned to Android/mobile users is shown in-app, or N/A]

**Localization**: [How every visible Android/mobile string is localized, or N/A]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

**Maestro Coverage**: [Happy-path Maestro flow per Android user story, or N/A]

**Mobile Unit Coverage**: [Android unit-test coverage plan and `>= 95%` CI gate, or N/A]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Hexagonal boundaries defined**: Domain logic depends only on ports; planned
  adapters are listed and isolated from domain code.
- [ ] **Unit test strategy present**: New/changed behavior has corresponding unit
  tests planned.
- [ ] **Coverage policy acknowledged**: CI gate is `>= 95%`, with a plan to reach
  `100%` for changed feature areas when feasible.
- [ ] **Additive test evolution respected**: Existing tests remain unchanged unless
  a requirement/defect rationale is documented.
- [ ] **MCP-free implementation**: Plan uses local repository tooling only; no MCP
  dependency in development steps.
- [ ] **Feature isolation via worktree**: Feature branch/worktree strategy uses
  dedicated worktrees under `tmp/` and meaningful branch naming.
- [ ] **Tech stack baseline**: Plan targets latest active Node.js LTS and latest
  active NestJS LTS.
- [ ] **Android source location**: Mobile app code is planned under `mobile/android`
  when Android is affected.
- [ ] **Kotlin LTS baseline**: Android work targets the latest active LTS Kotlin
  release when Android is affected.
- [ ] **API errors visible to users**: Android/mobile API error responses have
  explicit user-visible UI handling.
- [ ] **Localization coverage**: Every visible Android/mobile string is routed
  through localized resources or an equivalent localization mechanism.
- [ ] **Maestro happy paths**: Every Android mobile user story has a happy-path
  Maestro flow planned.
- [ ] **Android unit coverage**: Android unit tests maintain a `>= 95%` CI gate.
- [ ] **Dependency policy**: Official Node.js/NestJS modules are preferred; any
  third-party alternative is justified.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
src/
└── [existing backend/API source]

mobile/android/
├── app/
│   └── src/
│       ├── main/
│       └── test/
└── maestro/
  └── [happy-path user story flows]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
