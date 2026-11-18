# Project Memory

## Product

Werks Sessions is Grey Matter Coffee Werks' hands-on coffee learning and operations portal. The offers are Public Cupping, Brew 101, and Barista 101 (Espresso Foundations). Attendance, practice completion, and future credentials are distinct record types.

## Architecture

- React 18 and Vite frontend in `src/`.
- Firebase Authentication, Firestore, Hosting, and the Emulator Suite. The trusted Functions code in `functions/` is retained for a future Blaze migration and is not deployed on Spark.
- Firebase project configuration currently names `werks-session`.
- The front page shows upcoming dates from one public Firestore document, `public_schedule/current`, which active instructors and admins edit on the instructor page. It is the only signed-out read path; keep it free of guest data.
- Brand fonts are Figtree (display) and Archivo (body/UI), self-hosted from `@fontsource/figtree` and `@fontsource/archivo` through the WOFF2-only `@font-face` rules in `src/fonts.css`, imported by `src/main.tsx`. The Fontsource stylesheets are not imported directly because they also ship legacy WOFF files. The site makes no Google Fonts requests and ships no Gotham files.
- Public Cupping shows a public "How the evening runs" teaser. The full table guide (run sheet, tasting card, local flavour vocabulary) is learner-only and must never live in `src/` or `public/`; it is built and released as `sessions/{sessionId}/guide/main` but not yet seeded in production, and `docs/GATED_SESSION_GUIDE_PLAN.md` records the design.
- This repository is public. Gated learner material (guides, curriculum, cost models, vocabulary, seed JSON, PDFs) is gitignored and checked by `npm.cmd run security:gated`. History was rewritten on 2026-10-18 to remove earlier gated commits; the old repository was then deleted, so its commits no longer resolve anywhere (clone fresh, do not pull an old clone).
- `main` is protected by the `Protect Main` ruleset: changes land through a pull request, deletion and force-push are blocked, and the `verify` and `dependency audit` checks must pass first.
- Firebase is a temporary identity provider. Records use provider-neutral `person_id` values to support a future SeduhID/Supabase handoff.

## Licensing

- The source code is MIT licensed (`LICENSE`). Course content, written copy, brand assets, and the design system are excluded from that grant and remain all rights reserved (`NOTICE`). The repository stays public, so the distinction is stated in the files rather than implied.

## Security invariants

- Browser code never authorizes privileged actions.
- Firestore Rules authorize from an active `access_grants` document keyed by the signed-in uid, plus enrolment and teaching-assignment records. The dormant callable Functions check verified custom claims and re-validate every input at the server boundary.
- Firestore and Storage Rules deny unmatched access.
- Private resources will be delivered with a server-created short-lived URL only after enrolment eligibility is checked. On Spark they are delivered personally, because Functions and Storage are not deployed.
- No secrets belong in Git. `.env.example` contains placeholders only.

## Operational status

The 2026-10-15 Firebase Console access problem is resolved: the project is reachable from this workspace, and Hosting and Firestore Rules have been deployed from it (the most recent Hosting release was on 2026-11-18).
