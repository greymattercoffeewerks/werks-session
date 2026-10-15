# Architecture Decisions

## 2026-10-16: Repository memory is authoritative

Codex local memories are enabled as a convenience layer, but `PROJECT_MEMORY.md`, this decision log, and `SESSION_HANDOFF.md` are versioned and portable. They are the required context for every session.

## 2026-10-16: Verification runs locally and in GitHub Actions

The repository uses a versioned Git hook to stop unsafe commits and a GitHub Actions workflow to stop unsafe merges. Branch protection must require the CI workflow before merge.

## 2026-10-16: Firebase releases fail closed

Verification uses emulators and does not deploy. Deployment remains disabled until an administrator restores access to the intended Firebase project and configures a least-privilege CI identity.

## 2026-10-16: Do not suppress high-severity dependency findings

The dependency gate runs `npm audit --omit=dev --audit-level=high` for the root and Functions packages. Firebase 13 removes the critical Firebase 9 findings, but npm still reports a high-severity Node-only gRPC transport beneath Firebase Firestore. The team chose not to add an audit exception based on build heuristics, so this finding continues to block commits and merges until an upstream dependency release resolves it.
