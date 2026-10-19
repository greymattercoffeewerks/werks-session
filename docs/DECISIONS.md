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

## 2026-10-19: Upcoming dates are one public document that staff publish from the instructor page

The front page needed to say when the next sessions might be, and the owner wants to manage that from the back end. A month grid would be mostly empty for monthly sessions, so the front page shows a short list of "Next tables" with a date block, offer, time and venue, a status label, and a per-date enquiry email link. Staff publish it from an editor on the instructor page, so no deploy is needed to change a date. It is stored as a single document, `public_schedule/current`, with at most 12 items; one document means one read per visit. This is the first Firestore path readable without signing in, so it is deliberately narrow: `get` on that one document only (no listing), writes limited to active instructors and admins, document id fixed to `current`, server-time `updatedAt`, no delete, and a Rules test for every allow and denial. Status is a label rather than a seat count because staff set it by hand and should never claim more than they know. Past dates hide automatically. Item contents are validated by the client and shown as plain text, in line with the other staff-written records. The cost of a public read path is that anonymous reads draw on the Spark read allowance; App Check is the later remedy. Google Calendar embeds were rejected (third-party, off-brand, and not managed from the portal) and a file in the repository was rejected (every change would need a pull request and a deploy).

## 2026-10-19: Public Cupping night records are kept in the portal, staff-only and anonymous

The paper night record (seats, #1 cup, would-buy, bought, words, room ranking, redemptions) moves into the instructor page so data is not lost with paper and can be analysed across nights. One document per session at `sessions/{sessionId}/night_record/main`, readable and writable only by that session's assigned instructor or an administrator, and only for sessions labelled `cupping`. It deliberately holds no guest identifiers: seat numbers and choices only, so the portal stays free of cupping-guest personal data. Rules enforce identity, session, ownership, timestamps, and record-level limits but not per-seat contents, because per-seat checks exceeded Firestore's 1000-expression limit when the access checks were included; seat contents are validated by the client, bounded by document size, and written only by trusted staff. Analysis is by an in-page summary across the host's nights and a CSV download (one row per seat). The printed host sheet and night record stay as a paper fallback.

## 2026-10-18: Guide content is seeded as one JSON string, and unlabelled sessions keep the Brew 101 experience

Firebase Console cannot import JSON and nested fields are tedious to enter by hand, so the guide document accepts its content as one JSON string in `contentJson` (or as ordinary fields). The client trims, length-limits, and type-checks every value and renders text only. Existing session documents have no `offeringId`; rather than break live Brew 101 learners on deploy, a session without the field keeps the Brew 101 practice record, and only `cupping` sessions skip it. A guide appears only when a guide document exists and the Rules allow the read.

## 2026-10-18: Gated material never enters the public repository, and the gate is checked automatically

The repository is public. Gated material (guides, run sheets, curriculum, cost models, flavour vocabulary, Firestore seed JSON, PDFs, archives) lives in the gitignored `content-drafts/` folder or outside the repository, and is not quoted in docs, tests, or pull requests. `.gitignore` alone is not enough, so `npm.cmd run security:gated` runs inside `verify` (and therefore the pre-commit hook and CI): it fails when a gated-looking path is tracked or when the ignore rules stop covering sample gated paths. Gitignoring does not remove material already committed. Gated material committed in early history remains publicly readable there; removal by history rewrite and any change of repository visibility are owner decisions recorded in the handoff.

## 2026-10-18: Recreate the repository as `werks-session` to fully remove old history

Rewriting history removed the gated material from every branch, but GitHub keeps old commits reachable through hidden pull-request refs, and GitHub Support does not treat proprietary documents as sensitive data, so the old commits stayed downloadable by SHA. With no forks, the owner chose to delete the old repository and recreate it. A new public repository, `greymattercoffeewerks/werks-session`, was created and the clean rewritten `main` pushed; the full history was scanned first (only the two README placeholders under the gated folders, no private-marker hits, no secrets). The new repository has a single `main` ref and none of the old SHAs resolve. Pull request and issue history from the old repository (#1 to #8) was lost by design; their content lives in the commit history and docs. The Firebase project, Hosting site, and workflow are unchanged. A Codex update document records the local steps (`docs/CODEX_UPDATE_2026-10-18.md`).

## 2026-10-18: Purge gated material from public history by rewriting it

The repository must stay public because of platform limitations, and gated planning and course material had been committed in early history. Because the repository was three days old with no forks, stars, or watchers, the owner chose to rewrite history rather than keep or replace the repository. Done with `git filter-repo` in a fresh clone after a full backup, with the working tree unchanged (identical tree hash to the deployed `main`), a lease-protected force push, and deletion of the merged branches. Every commit hash changed and earlier clones must be discarded. GitHub keeps old commits reachable by SHA through hidden pull-request refs, so the purge is complete only after GitHub Support removes them; the request is prepared outside Git. Pull requests merge into `main` as before, and `npm.cmd run security:gated` prevents a repeat.

## 2026-10-18: Split the Public Cupping guide into a public teaser and a gated guide

The Public Cupping table guide is useful before the evening, so it belongs after a confirmed booking. The public site carries only a short teaser: the "start with what you like" lead and four beats, with no minute timings, triangle test, tasting card, or local flavour vocabulary. The full guide will be a staff-seeded Firestore document at `sessions/{sessionId}/guide/main`, readable only by a confirmed enrolee or an assigned instructor through the existing Rules functions, and rendered as text. It is never placed in `src/` or `public/`, because anything there ships in the public bundle. Gating is for sequencing and to protect the growing local flavour vocabulary, not secrecy; confirmed guests can print or photograph the guide. Until it is built, staff email the finished PDF with the booking confirmation. Details, Rules tests, and slices are in `docs/GATED_SESSION_GUIDE_PLAN.md`.

## 2026-10-18: Self-host Figtree and Archivo and stop shipping Gotham

The design system's brand fonts are Figtree (display) and Archivo (body and UI). The portal already rendered them, but loaded both from Google Fonts at runtime and served three licensed legacy Gotham OTFs that no component used. The portal now installs `@fontsource/figtree` and `@fontsource/archivo` (OFL-1.1, Latin subset, weights 400–900 and 400–700) and imports them in `src/main.tsx`, so Vite bundles hashed, immutably cached WOFF2 files from the portal's own origin. The Google Fonts import, the Gotham `@font-face` rules, and the Gotham files were removed from the vendored design-system folder; those edits are local to this repository and must be re-applied if the design system is re-imported. Revisit if a non-Latin script is needed.

## 2026-10-16: Spark MVP uses concierge operations at trust boundaries

The project will remain on Firebase Spark for the initial MVP. Public Hosting is permitted, but Cloud Functions, Admin SDK claims, Storage, signed downloads, transactional mail, and automated invitation activation are not. Enquiries, payment confirmation, cohort placement, and private resource delivery are handled personally by staff.

The future authenticated Spark portal will use direct Firestore access only after staff manually seed immutable role and enrolment/access-grant records. Firebase Auth authenticates a person; it does not itself confirm a paid or accepted place. Browser code must never create or alter privileged grants. The provider-neutral `person_id` remains a domain field for the eventual SeduhID bridge.
