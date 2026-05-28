---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Every user story MUST include new tests,
preserve existing tests unless justified, and maintain CI coverage >= 95%. Android
mobile user stories MUST include happy-path Maestro flows and Android unit tests
that preserve the `>= 95%` coverage gate.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: backend/API under existing `src/`; Android app under `mobile/android/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize Node.js project on latest active LTS and NestJS on latest
  active LTS major
- [ ] T003 [P] If Android is affected, create/verify `mobile/android` project structure
  and latest active LTS Kotlin baseline
- [ ] T004 [P] Configure linting, formatting, Maestro, and coverage tools
- [ ] T005 [P] Validate official Node/NestJS modules are used before third-party additions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T005 Setup database schema and migrations framework
- [ ] T006 [P] Implement authentication/authorization framework
- [ ] T007 [P] Setup API routing and middleware structure
- [ ] T008 Create base models/entities that all stories depend on
- [ ] T009 Configure error handling and logging infrastructure
- [ ] T010 Setup environment configuration management
- [ ] T011 If Android is affected, implement shared API error-to-user-message handling
  in mobile/android/[module]

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory. Write them first and ensure they fail before implementation.**

- [ ] T012 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T013 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].py
- [ ] T014 [P] [US1] Android unit test for [view model/use case] in mobile/android/[module]/src/test/
- [ ] T015 [P] [US1] Maestro happy-path flow in mobile/android/maestro/[story].yaml

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T017 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T018 [US1] Implement [Service] in src/services/[service].py (depends on T016, T017)
- [ ] T019 [US1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T020 [US1] If Android is affected, implement user-visible API error handling in mobile/android/[module]/src/main/
- [ ] T021 [US1] Add validation and error handling
- [ ] T022 [US1] Add logging for user story 1 operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T023 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T024 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py
- [ ] T025 [P] [US2] Android unit test for [view model/use case] in mobile/android/[module]/src/test/
- [ ] T026 [P] [US2] Maestro happy-path flow in mobile/android/maestro/[story].yaml

### Implementation for User Story 2

- [ ] T027 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T028 [US2] Implement [Service] in src/services/[service].py
- [ ] T029 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T030 [US2] If Android is affected, implement user-visible API error handling in mobile/android/[module]/src/main/
- [ ] T031 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (REQUIRED) ⚠️

> **NOTE: These tests are mandatory for new feature behavior.**

- [ ] T032 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T033 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py
- [ ] T034 [P] [US3] Android unit test for [view model/use case] in mobile/android/[module]/src/test/
- [ ] T035 [P] [US3] Maestro happy-path flow in mobile/android/maestro/[story].yaml

### Implementation for User Story 3

- [ ] T036 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T037 [US3] Implement [Service] in src/services/[service].py
- [ ] T038 [US3] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T039 [US3] If Android is affected, implement user-visible API error handling in mobile/android/[module]/src/main/

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation
- [ ] TXXX Run Android unit coverage and verify `>= 95%` when Android is affected
- [ ] TXXX Run Maestro happy-path flows when Android is affected

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Android user stories MUST include a Maestro happy-path flow before completion
- Android unit coverage MUST remain at or above 95%
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify new tests fail before implementing
- Do not modify pre-existing tests unless the spec documents a required reason
- Ensure CI coverage gate stays at or above 95%, targeting 100% for changed areas
- Keep feature work in dedicated worktrees under `tmp/`
- Keep implementation MCP-free
- Keep runtime on Node.js LTS and NestJS LTS
- Prefer official Node/NestJS modules and document third-party exceptions
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
