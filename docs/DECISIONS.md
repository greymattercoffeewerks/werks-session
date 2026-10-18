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

## 2026-10-18: Gated material never enters the public repository, and the gate is checked automatically

The repository is public. Gated material (guides, run sheets, curriculum, cost models, flavour vocabulary, Firestore seed JSON, PDFs, archives) lives in the gitignored `content-drafts/` folder or outside the repository, and is not quoted in docs, tests, or pull requests. `.gitignore` alone is not enough, so `npm.cmd run security:gated` runs inside `verify` (and therefore the pre-commit hook and CI): it fails when a gated-looking path is tracked or when the ignore rules stop covering sample gated paths. Gitignoring does not remove material already committed. Gated material committed in early history remains publicly readable there; removal by history rewrite and any change of repository visibility are owner decisions recorded in the handoff.

## 2026-10-18: Split the Public Cupping guide into a public teaser and a gated guide

The Public Cupping table guide is useful before the evening, so it belongs after a confirmed booking. The public site carries only a short teaser: the "start with what you like" lead and four beats, with no minute timings, triangle test, tasting card, or local flavour vocabulary. The full guide will be a staff-seeded Firestore document at `sessions/{sessionId}/guide/main`, readable only by a confirmed enrolee or an assigned instructor through the existing Rules functions, and rendered as text. It is never placed in `src/` or `public/`, because anything there ships in the public bundle. Gating is for sequencing and to protect the growing local flavour vocabulary, not secrecy; confirmed guests can print or photograph the guide. Until it is built, staff email the finished PDF with the booking confirmation. Details, Rules tests, and slices are in `docs/GATED_SESSION_GUIDE_PLAN.md`.

## 2026-10-18: Self-host Figtree and Archivo and stop shipping Gotham

The design system's brand fonts are Figtree (display) and Archivo (body and UI). The portal already rendered them, but loaded both from Google Fonts at runtime and served three licensed legacy Gotham OTFs that no component used. The portal now installs `@fontsource/figtree` and `@fontsource/archivo` (OFL-1.1, Latin subset, weights 400–900 and 400–700) and imports them in `src/main.tsx`, so Vite bundles hashed, immutably cached WOFF2 files from the portal's own origin. The Google Fonts import, the Gotham `@font-face` rules, and the Gotham files were removed from the vendored design-system folder; those edits are local to this repository and must be re-applied if the design system is re-imported. Revisit if a non-Latin script is needed.

## 2026-10-16: Spark MVP uses concierge operations at trust boundaries

The project will remain on Firebase Spark for the initial MVP. Public Hosting is permitted, but Cloud Functions, Admin SDK claims, Storage, signed downloads, transactional mail, and automated invitation activation are not. Enquiries, payment confirmation, cohort placement, and private resource delivery are handled personally by staff.

The future authenticated Spark portal will use direct Firestore access only after staff manually seed immutable role and enrolment/access-grant records. Firebase Auth authenticates a person; it does not itself confirm a paid or accepted place. Browser code must never create or alter privileged grants. The provider-neutral `person_id` remains a domain field for the eventual SeduhID bridge.
