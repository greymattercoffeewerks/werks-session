# Project Memory

## Product

Werks Sessions is Grey Matter Coffee Werks' hands-on coffee learning and operations portal. The initial offers are Public Cupping and Brew 101. Attendance, practice completion, and future credentials are distinct record types.

## Architecture

- React 18 and Vite frontend in `src/`.
- Firebase Authentication, Callable Functions, Firestore, Storage, Hosting, and Emulator Suite.
- Firebase project configuration currently names `werks-session`.
- Brand fonts are Figtree (display) and Archivo (body/UI), self-hosted through `@fontsource/figtree` and `@fontsource/archivo` imported in `src/main.tsx`. The site makes no Google Fonts requests and ships no Gotham files.
- Public Cupping shows a public "How the evening runs" teaser. The full table guide (run sheet, tasting card, local flavour vocabulary) is learner-only and must never live in `src/` or `public/`; the plan is `docs/GATED_SESSION_GUIDE_PLAN.md`.
- This repository is public. Gated learner material (guides, curriculum, cost models, vocabulary, seed JSON, PDFs) is gitignored and checked by `npm.cmd run security:gated`. Gated material committed in early history remains in public Git history until the owner decides on a purge or making the repository private.
- `main` has no branch protection. All work goes on a feature branch and merges by pull request after the GitHub `verify` check passes.
- Firebase is a temporary identity provider. Records use provider-neutral `person_id` values to support a future SeduhID/Supabase handoff.

## Security invariants

- Browser code never authorizes privileged actions.
- Callable Functions authorize from verified Firebase custom claims.
- Firestore and Storage Rules deny unmatched access.
- Private resources are delivered with a server-created short-lived URL only after enrolment eligibility is checked.
- No secrets belong in Git. `.env.example` contains placeholders only.

## Current operational constraint

The configured Firebase Console project could not be opened by the active Google account on 2026-10-15. Treat project-ID/account access confirmation as a release prerequisite; emulator checks remain valid for local and CI verification.
