# Persistent Development Protocol

## Session lifecycle

At session start, Codex reads the repository guidance and the session hook emits a bounded project context. Before implementation, read the four canonical documents named in `AGENTS.md` and inspect the working tree.

At session end, the documentation steward refreshes `docs/SESSION_HANDOFF.md`. The handoff records what changed, exact verification results, unresolved risk, and one next action. Do not put secrets, customer data, tokens, or long logs in project memory.

Codex local memories should be enabled for both generation and use, including tool-assisted chats, on each developer machine. They are asynchronous and best-effort; repository documentation is the enforceable memory layer.

## Required review sequence

1. The implementation agent completes the requested change and tests.
2. The documentation steward updates the handoff and decides whether the changelog needs an entry.
3. The quality reviewer independently reviews the diff and runs the quality checks.
4. The security reviewer independently reviews changed trust boundaries and runs the security checks.
5. The implementation agent resolves blockers and runs `npm.cmd run verify`.

When Codex subagents are available, use the three playbooks under `.codex/playbooks/` as their prompts. A parent agent remains responsible for combining the findings and must not commit with unresolved blocking findings.

## Enforcement

Run `npm.cmd run setup:hooks` once per clone. The versioned pre-commit hook runs `npm.cmd run verify:staged`, which requires `docs/SESSION_HANDOFF.md` in the staged diff and then runs the complete verification suite.

On the first session in a clone, inspect and trust `.codex/hooks.json` through Codex's hook review UI before relying on the session-start context. Changed hooks require review again.

GitHub Actions repeats the checks for pull requests and `main`. An organization administrator must mark the `verify` workflow status as required, require pull requests for `main`, and restrict bypass permissions. The repository cannot configure those GitHub settings from a workflow file alone.

## Firebase release readiness

CI uses emulators; it does not deploy. Before enabling a release workflow, an administrator must confirm the intended Firebase project ID, restore Console and CLI access, create a least-privilege CI identity, and keep all credentials in GitHub secrets or workload identity configuration. Do not put deployment credentials in the repository.
