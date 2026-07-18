# ADR-0001: Project Structure

## Status

Accepted

## Context

The repository must support work by humans and multiple AI coding assistants, including GitHub Copilot, Claude, and Codex.

The project should make architecture, workflow, and completion criteria explicit inside the repository.

The repository is hosted on GitHub, while Claude and Codex may still be used as coding assistants through their platform-specific entrypoints.

## Decision

Use a minimal AI-friendly repository structure with:

- a shared `AGENTS.md` contract;
- tool-specific AI entrypoints that reference `AGENTS.md`;
- GitHub-native CI and pull request templates;
- architecture documents under `docs/architecture/`;
- engineering policies under `docs/engineering/`;
- a chronological work stream under `docs/work-items/`.

## Consequences

- AI assistants have clear local instructions.
- Task completion can be checked against task-specific DoD files.
- Work items form a chronological ledger of non-trivial changes and their artifacts.
