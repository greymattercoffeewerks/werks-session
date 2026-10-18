# Plan: gated Public Cupping table guide

Status: built and released on 2026-10-18; waiting for staff to seed the guide. Slice 1 (public teaser, PR 1), slice 2 (Rules and tests, PR 6, Rules deployed), and slice 3 (client, learner page, print styles, private marker check, PR 7, Hosting deployed) are live. Slice 4 (seeding and the authenticated smoke test) is for staff after editorial sign-off.

## Goal

Give a confirmed Public Cupping guest the full "Before you come" table guide inside Learner access, while the public site shows only a short teaser. The guide is read before the evening, so it belongs after booking confirmation, not in the public marketing flow.

## What is public, gated, and internal

| Content | Where it lives |
| --- | --- |
| 90 minutes, Noice after hours, 8–12 people, BND 20 redeemable, outcomes | Public offer card (already live) |
| "Start with what you like", the four-beat evening summary, "nothing to bring" | Public teaser (slice 1) |
| Minute-by-minute run sheet, triangle test, table basics, tasting card | Gated guide |
| Local flavour vocabulary | Gated guide. This is the one asset worth protecting because it grows from the tables. Do not quote its words in this repository. |
| Before-you-come logistics (venue contact, arrival time, cancellation) | Gated guide, after the placeholders are resolved |
| Format spec, cost model, margins | Never in this app |

Gating is for sequencing and to protect the vocabulary list, not secrecy. Anyone who books can print or photograph the guide, and that is accepted. The guide carries a "© Grey Matter Coffee Werks" line.

## Hard constraints

1. **Content cannot live in `src/` or `public/`.** Everything there ships in the bundle, so a login-only page would still be readable. The guide is read from Firestore, where Rules enforce access.
2. **Spark only.** No Functions, no Storage, no signed URLs. Staff seed the guide document in the Firebase Console, consistent with `docs/SPARK_ACCESS_GRANTS.md`.
3. **Render as text.** The guide is structured data rendered by React. Never inject HTML from Firestore.
4. **Every new allow path needs a Rules emulator test** (`CONVENTIONS.md`).
5. **Do not enable Firestore offline persistence** for this feature, so the guide is not cached in the browser beyond the session.
6. Work on a feature branch and open a PR. `main` has no branch protection.

## Phase 0 (no code): email the PDF

Until slices 2–4 ship, staff email a finished PDF with the booking confirmation. This is the documented concierge model. It needs the editorial placeholders resolved first (see "Editorial gate").

## Data model

One staff-seeded document per session, at `sessions/{sessionId}/guide/main`:

```json
{
  "offeringId": "cupping",
  "version": 1,
  "title": "Your table guide",
  "intro": "…",
  "facts": [{ "label": "Duration", "value": "90 min" }],
  "schedule": [{ "when": "0:00–0:10", "what": "…" }],
  "tastingCard": { "prompts": [{ "name": "Rank it", "help": "…" }] },
  "basics": [{ "step": "Smell", "text": "…" }],
  "vocabulary": [{ "group": "Group name", "words": ["word one", "word two"] }],
  "beforeYouCome": ["…"],
  "footer": "© Grey Matter Coffee Werks"
}
```

Also add `offeringId` to each `sessions/{sessionId}` document so the learner page can decide what to show (see slice 3).

The seed JSON lives in the gitignored `content-drafts/` folder, never in Git. The shape and the seeding steps are added to `docs/SPARK_ACCESS_GRANTS.md`.

## Firestore Rules

Inside `match /sessions/{sessionId}`:

```
match /guide/{guideId} {
  allow get: if hasConfirmedEnrolment(sessionId, request.auth.uid) || teaches(sessionId);
  allow list, write: if false;
}
```

It reuses the existing confirmed-enrolment and teaching-assignment functions, so it adds no new trust model. The catch-all deny remains.

### Rules tests (`tests/rules/firebase-rules.test.cjs`)

- Learner with an active grant and a confirmed enrolment can `get` the guide.
- Learner with a pending or withdrawn enrolment is denied.
- Authenticated learner with no enrolment for that session is denied.
- Learner enrolled in a different session is denied.
- Anonymous user is denied.
- Assigned instructor and admin can `get`; an unassigned instructor is denied.
- `list` is denied for everyone.
- Create, update, and delete are denied for everyone, including admin.

## Client changes

1. `src/lib/session-guide.ts`: `loadSessionGuide(sessionId)` returns a typed, validated `SessionGuide | null`. It narrows every field defensively, like `practiceWeek` in `practice.ts`.
2. `src/lib/learner-access.ts`: include `offeringId` in `ConfirmedSession`.
3. `src/App.tsx` (learner page):
   - `PracticeWorkspace` renders only for `brew101` sessions. Today it renders for every confirmed session, so a cupping guest would be offered a Brew 101 practice record.
   - The heading "Your Brew 101 table." becomes offering-aware ("Your table." when sessions are mixed).
   - New `SessionGuidePanel` renders above the practice workspace.
4. Styles: reuse site tokens and the existing `.panel`, `.eyebrow`, and `.facts` patterns. Add `@media print` rules so "Print this guide" produces a clean two-page sheet with the site chrome hidden.

## Tests (`tests/unit/App.test.tsx`)

- A confirmed cupping session shows the guide and does **not** show the Brew 101 practice start.
- A confirmed Brew 101 session still shows the practice workspace and no guide.
- A pending account shows neither.
- Guide text containing HTML renders as text.
- The public page still contains none of the guide-only strings (the teaser test from slice 1).

## Slices

| Slice | Content | Deploy |
| --- | --- | --- |
| 1 | Public teaser on the Public Cupping card (released 2026-10-18) | Hosting |
| 2 | Rules and tests for `sessions/{id}/guide/main` | Firestore Rules |
| 3 | Learner page made offering-aware, guide panel, print styles | Hosting |
| 4 | Staff seeds the guide for the first cupping session, then a live smoke test with a scoped test learner | Console only |

Slices 2 and 3 can ship together or separately. Slice 2 must be released before slice 3 is relied on.

## Editorial gate (before anything is seeded)

- Venue contact, arrival time, and cancellation policy are "to be confirmed" in the draft. Resolve them or keep them out.
- Confirm the local flavour vocabulary is approved for use.
- Check the "No scores are read aloud" and "nobody sees your card" promises match how the evening is actually run.
- The local draft `content-drafts/public-cupping-participant-guide-v0.1.md` is still marked an editorial draft.

## Fonts

The design system's brand fonts are **Figtree** (wordmark and display) and **Archivo** (body and UI). The site already renders them: computed styles on the running site show Figtree on headings and buttons and Archivo on body, navigation, and labels. The claude.ai guide artifact uses the same two families, so there is no mismatch to fix in the guide.

Two issues existed and are now resolved (released 2026-10-18, see `docs/DECISIONS.md`):

1. Both fonts loaded at runtime from Google Fonts. They are now self-hosted through `@fontsource/figtree` and `@fontsource/archivo`, so the guide and its print styles render with the brand fonts without a third-party request.
2. The licensed legacy Gotham OTF files were served publicly although nothing used them. They are removed.

## Acceptance

- A confirmed cupping guest sees the guide; a signed-in but unconfirmed account sees nothing about it.
- `npm.cmd run build` output contains none of the guide-only strings.
- Rules tests cover every allow path and the denials above.
- `npm.cmd run verify` passes; quality and security reviews recorded in the handoff.

## Work plan

Sizes are relative effort: S (under half a day), M (about a day). No dates are committed. Each code step is its own feature branch and pull request, gated by `npm.cmd run verify`, with the quality and security reviews recorded in the handoff.

| # | Step | Owner | Size | Needs | Output |
| --- | --- | --- | --- | --- | --- |
| A | **Editorial sign-off.** Resolve venue contact, arrival time, and cancellation text; approve the local flavour vocabulary; check the privacy promises match how the evening runs; finalise the copy. | Staff | M | Nothing | Final guide JSON in the gitignored `content-drafts/` folder. Never committed. |
| B | **Phase 0 PDF.** Print the finished guide to PDF and email it with each booking confirmation. | Staff | S | A | PDF kept outside Git. Works while C–E are built. |
| C | **Rules PR.** Add the `sessions/{id}/guide/main` allow path, the Rules tests listed above, and a Rules test that proves a learner cannot write it. Release with `firebase deploy --only firestore:rules`. | Engineering | S | Nothing | Released Rules. Check in the Rules Playground that a scoped test learner can read and an ungranted account cannot. |
| D | **Client PR.** Add `src/lib/session-guide.ts` (typed, validated, text-only), `offeringId` on confirmed sessions, an offering-aware learner page, the guide panel, print styles, and the unit tests above. Deploy Hosting. | Engineering | M | C released | Hosting release. Brew 101 learners see no change; cupping guests see the guide. |
| E | **Seed and smoke test.** In the Console, set `offeringId` on the cupping and Brew 101 session documents, create a test enrolment and the guide document from the ignored JSON, then sign in as the test learner and as a pending account. | Staff | S | A, C, D | Verified in production. Remove or keep the test records deliberately. |
| F | **Close out.** Record the release in the handoff, changelog, and decision log; mark the plan slices complete; delete test records if not kept. | Engineering | S | E | Docs current. |

### Order and dependencies

A can start now and does not block C or D. C must be released before D is relied on. E needs A, C, and D. B is the interim delivery route and is retired when E passes.

### Keeping the guide out of the public repository

This repository is public, so the guide, its seed JSON, and its vocabulary must never be committed, quoted in docs or tests, or pasted into pull requests.

- Keep everything in `content-drafts/`, which is gitignored (see `.gitignore` and `CONVENTIONS.md`).
- `npm.cmd run security:gated` fails if a gated-looking file is tracked or the ignore rules weaken.
- Public tests use structural markers only (section titles and run-sheet timings), never the vocabulary.
- Optional local check, worth adding in step D: a script that reads a private marker list from `content-drafts/` when present and fails if any marker appears in `src/`, `public/`, `docs/`, `tests/`, or a fresh `dist/`. CI skips it when the file is absent.

### Decisions needed from the owner

1. **Per session or per offering.** The plan uses one guide document per session (simple to seed by hand, but duplicated across sessions). A per-offering guide avoids duplication but needs an offering field on enrolments and a new Rules function.
2. **Instructor visibility.** The Rules let assigned instructors and admins read the guide. Say if instructors should not.
3. **On-screen only, or print too.** Print styles are in step D; drop them if the emailed PDF stays the printable route.
4. **Test records.** Keep a permanent test learner and session for future smoke tests, or delete them after step E.

### Risks

- **Brew 101 regression.** The learner page assumes Brew 101 today. Step D changes it, so the existing Brew 101 tests must keep passing unchanged.
- **Missing `offeringId`.** Existing session documents have no such field. Step E sets it by hand. Until then the client keeps today's behaviour for a session without the field (the Brew 101 practice record); only `cupping` sessions skip it, and a guide shows only when a guide document exists. Nothing is inferred about guide content.
- **Rules complexity.** The challenge update rule is near Firestore's expression limit. The new guide rule is a one-line reuse of existing functions and does not add to that rule.
- **Copying.** A confirmed guest can screenshot or print the guide. This is accepted; the gate controls sequencing and casual copying, not determined copying.
