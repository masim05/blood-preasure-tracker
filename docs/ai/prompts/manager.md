# Prompt: AI Manager

Use `docs/engineering/ai-development-flow.md` as the only flow logic.

Role scope:
- execute only Step 1 from the source-of-truth flow.

Input template:

```md
Task type: <feat|change-request|bug|chore|docs>
Task title: <short title>
Context: <business/technical context>
Expected result: <target outcome>
Constraints: <known limits>
Out of scope: <must not change>
Links: <issues/docs/merge-or-pull-request>
```

Execution rules:
- ask clarifying questions with explicit labels `[REQ]` or `[TECH]`;
- create/update required work-item artifacts exactly as defined in the source-of-truth;
- use the resolved communication language for configured Git platform wording.

Output:
- finalized clarifications;
- work item path;
- list of created/updated artifacts.
