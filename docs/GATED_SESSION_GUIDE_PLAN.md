# Plan: gated Public Cupping table guide

Status: proposed, not built. Slice 1 (the public teaser) was released to Hosting on 2026-10-18 (PR 1). Slices 2–4 are not started.

## Goal

Give a confirmed Public Cupping guest the full "Before you come" table guide inside Learner access, while the public site shows only a short teaser. The guide is read before the evening, so it belongs after booking confirmation, not in the public marketing flow.

## What is public, gated, and internal

| Content | Where it lives |
| --- | --- |
| 90 minutes, Noice after hours, 8–12 people, BND 20 redeemable, outcomes | Public offer card (already live) |
| "Start with what you like", the four-beat evening summary, "nothing to bring" | Public teaser (slice 1) |
| Minute-by-minute run sheet, triangle test, table basics, tasting card | Gated guide |
| Local flavour vocabulary ([removed], [removed], [removed]…) | Gated guide. This is the one asset worth protecting because it grows from the tables. |
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
  "vocabulary": [{ "group": "Sweet", "words": ["[removed]", "palm sugar"] }],
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
