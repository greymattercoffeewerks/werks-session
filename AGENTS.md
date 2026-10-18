# Grey Matter Education Portal — Agent Protocol

## Durable project memory

Before making changes, read `CONVENTIONS.md`, `docs/PROJECT_MEMORY.md`, `docs/DECISIONS.md`, and `docs/SESSION_HANDOFF.md`. After the 2026-10-18 repository move, also read `docs/CODEX_UPDATE_2026-10-18.md` once and follow its checklist. Treat the checked-in handoff as the project source of truth; Codex local memory is helpful but may be incomplete.

Preserve unrelated uncommitted work. Do not reset, restore, stage, or commit another person's changes.

## Required delivery workflow

1. Implement the requested change and its tests.
2. Run the documentation steward review: refresh `docs/SESSION_HANDOFF.md`; update `CHANGELOG.md` only for user-visible, operational, or security-impacting changes.
3. Run an independent quality review using `.codex/playbooks/quality-review.md`.
4. Run an independent security review using `.codex/playbooks/security-review.md`.
5. Run `npm.cmd run verify`. Before committing, stage the handoff and run `npm.cmd run verify:staged`.

Use the playbooks as scoped subagent prompts when subagents are available. If they are not, perform the reviews explicitly and report their outcomes.

## Code review rules

- Preserve Firestore and Storage deny-by-default behavior and validate Firebase Rules changes with emulator tests.
- Keep authorization checks server-side; never trust a client-provided role, person ID, or resource URL.
- Do not commit secrets, credentials, `.env` files, private keys, or Firebase service-account JSON.
- Use Node 20-compatible tooling. Run root and Functions checks whenever their respective code changes.
