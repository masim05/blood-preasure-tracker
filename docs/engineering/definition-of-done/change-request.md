# Definition of Done: Change Request

A change request is done only when:

- AI-flow temporary work-item artifacts exist when the AI development flow is used.
- The current behavior and requested behavior are both described explicitly.
- Acceptance criteria are explicit and testable.
- The implementation plan exists in the task context or temporary work-item artifacts.
- Architecture impact is described, including affected modules, boundaries, and dependencies.
- The implementation follows the project architecture and does not introduce unauthorized dependencies or shortcuts.
- Edge cases and error states are considered.
- Security, privacy, performance, and observability implications are checked where relevant.
- User-facing documentation is updated when behavior changes.
- The merge/pull request links to the source issue, task brief, or retained work-item artifacts when available.
- The merge/pull request explains what behavior changed and how it was verified.

## Blocking review conditions

The merge/pull request must not be approved until these issues are resolved:

- The change is actually additive-only and should be reclassified as `feat`.
