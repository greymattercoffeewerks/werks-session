# Architecture Decisions

## 2026-10-16: Repository memory is authoritative

Codex local memories are enabled as a convenience layer, but `PROJECT_MEMORY.md`, this decision log, and `SESSION_HANDOFF.md` are versioned and portable. They are the required context for every session.

## 2026-10-16: Verification runs locally and in GitHub Actions

The repository uses a versioned Git hook to stop unsafe commits and a GitHub Actions workflow to stop unsafe merges. Branch protection must require the CI workflow before merge.

## 2026-10-16: Firebase releases fail closed

Verification uses emulators and does not deploy. Deployment remains disabled until an administrator restores access to the intended Firebase project and configures a least-privilege CI identity.

## 2026-10-16: Do not suppress high-severity dependency findings

The dependency gate runs `npm audit --omit=dev --audit-level=high` for the root and Functions packages. Firebase 13 removes the critical Firebase 9 findings, but npm still reports a high-severity Node-only gRPC transport beneath Firebase Firestore. The team chose not to add an audit exception based on build heuristics, so this finding continues to block commits and merges until an upstream dependency release resolves it.

## 2026-10-16: Pin Firebase Firestore's gRPC transport to a patched release

Firebase 13.0.0 currently requests `@grpc/grpc-js` `~1.9.0` through `@firebase/firestore`, while the security advisory is fixed in 1.13.6 and later. The root `overrides` field pins every `@grpc/grpc-js` instance to 1.14.6, which is already compatible with the rest of the dependency tree. This is a narrow security remediation, not an audit exception: `npm audit --omit=dev --audit-level=high` now passes. Revisit and remove the override when Firebase updates its own Firestore dependency range.

## 2026-10-16: Spark MVP uses concierge operations at trust boundaries

The project will remain on Firebase Spark for the initial MVP. Public Hosting is permitted, but Cloud Functions, Admin SDK claims, Storage, signed downloads, transactional mail, and automated invitation activation are not. Enquiries, payment confirmation, cohort placement, and private resource delivery are handled personally by staff.

The future authenticated Spark portal will use direct Firestore access only after staff manually seed immutable role and enrolment/access-grant records. Firebase Auth authenticates a person; it does not itself confirm a paid or accepted place. Browser code must never create or alter privileged grants. The provider-neutral `person_id` remains a domain field for the eventual SeduhID bridge.
