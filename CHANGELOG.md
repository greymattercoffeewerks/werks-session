# Changelog

All notable user-visible, operational, and security-impacting changes are recorded by completion date.

## [2026-10-19]

### Added

- Added "Next tables" to the front page: a short list of upcoming dates with the offer, time, venue, a status label (interest list open, seats available, few seats left, full, or date to be confirmed), and an "Ask about this date" email link on each. Instructors manage the dates from a new Upcoming dates editor on the instructor page, past dates hide automatically, and the page shows a friendly message when no dates are published. It was released to production on 2026-10-19 (Firestore Rules, then Hosting) and shows a friendly message until the first dates are published.
- Added an online night record for Public Cupping in the instructor page: the host records each night's seats, #1 cups, would-buy and purchase answers, words heard, room ranking, and redemptions in the portal instead of on paper, sees tonight's totals and conversion, and sees a summary across their nights with a CSV download for analysis. It holds seat numbers and choices only, with no guest names or contact details. It was released to production on 2026-10-19 (Firestore Rules, then Hosting); it needs the cupping session labelled and the host's teaching assignment created before first use.

### Security

- Added the first publicly readable Firestore document, `public_schedule/current` (the upcoming dates): readable by anyone but not listable, writable only by active instructors and admins, fixed document id, server-time stamp, no delete, with emulator tests for every allow and denial.
- Added Firestore Rules for the night record (`sessions/{id}/night_record/main`): staff-only, Public Cupping sessions only, host, session, and creation time fixed on first write, and record-level size limits, with emulator tests for every allow path and denial.

## [2026-10-18]

### Added

- Added a public "How the evening runs" summary to the Public Cupping offer. It shares the spirit and four beats of the evening; the full table guide is reserved for confirmed guests.

### Changed

- Self-hosted the Figtree and Archivo brand fonts so the site no longer requests Google Fonts, and stopped shipping the unused licensed Gotham font files.
- Clarified the Public Cupping and Brew 101 offers, their practical outcomes, and the manual enquiry path.
- Reworked the About Werks Sessions section into a shorter, more informative explanation with a calmer responsive layout.
- Refined the hero learning-table card so its statement and supporting quote share one left alignment and the redundant divider is removed.
- Restored restrained Grey Matter turquoise cues to the public hero identity and About marker.
- Clarified the learner-facing Brew 101 practice journey, its independent weekly review states, and the next action at every stage.
- Widened the learner workspace for desktop use while preserving a single-column, no-overflow phone layout.

### Fixed

- Widened the instructor review page to the standard application width, matching the learner workspace, and let review cards sit side by side on wide screens.
- Instructor feedback now appears in its own labelled block, separate from the system guidance, on returned and approved weeks. It also stays visible while a learner revises a returned week.
- Instructor reviews now record the server review time that the Firestore Rules require, so approving or returning a practice week matches the access rules. This reaches the live site on the next Hosting deploy.

### Security

- Added an automated gated-content check to the verification gate and strengthened the ignore rules, so learner-gated guides, seed files, PDFs, and course documents cannot be committed to the public repository by accident.
- The public site no longer requests fonts from Google, removing a third-party request from every page view. The licensed Gotham font files are no longer served.

### Added

- Added the learner-only table guide to Learner access: a confirmed guest with a seeded guide sees "Before you come" with the run sheet, tasting card, table basics, flavour vocabulary, and practical notes, with a print option. Sessions can now carry an offering (`cupping` or `brew101`); Public Cupping guests no longer see the Brew 101 practice record, and sessions without an offering behave as before. No guide content is published until staff seed it.

### Operational

- Moved the project to a new GitHub repository, `werks-session`, with the clean rewritten history, after the old repository was deleted. The Firebase project and Hosting site are unchanged. Added a Codex update document with the local re-clone and dependency steps.
- Released the learner-only guide (Rules, then Hosting), the wider instructor review page, and the clearer instructor feedback on 2026-10-18 from merged `main` (PRs 5, 6, and 7). Functions, Storage, and indexes were not changed.
- Added the Firestore Rules path and emulator tests for a learner-only session guide (`sessions/{id}/guide/main`): readable only by confirmed enrolees and the teaching staff, never writable from a browser. The Rules were released to production on 2026-10-18; no guide content exists yet.
- Rewrote the repository history to remove gated course material and sample vocabulary from every commit, force-pushed `main` (content unchanged), and deleted the merged branches. Commit hashes changed; earlier clones should be discarded. GitHub cleanup of cached old commits is pending with GitHub Support.
- Released the instructor review timestamp fix to Firebase Hosting from merged `main` (PR 3).
- Released the teaser and font changes to Firebase Hosting from merged `main` (PR 1). Firestore Rules, indexes, Functions, and Storage were not changed or deployed.
- Added `docs/GATED_SESSION_GUIDE_PLAN.md`, the plan for a learner-only Public Cupping guide delivered under Firestore Rules; it is not built.

## [2026-10-17]

### Added

- Provisioned the Firebase Spark Cloud Firestore default database in `asia-southeast1` in production mode for manually granted learner access.
- Added the first learner-facing Firestore read: confirmed Brew 101 sessions and a read-only four-week practice preview.
- Added a learner-owned four-week Brew 101 practice record with draft saving and guarded submission.
- Added an assigned-instructor review queue for individually submitted Brew 101 practice weeks.

### Changed

- Replaced the granted learner's generic pending screen with a confirmed-session view; accounts without a confirmed enrolment remain pending.
- Replaced the read-only Brew 101 practice preview with the active weekly record; submitted records become read-only until instructor review.
- Corrected Brew 101 practice to save and submit each week independently; submitted weeks are learner-locked while the remaining weeks stay available.
- Added instructor feedback outcomes: approved weeks remain locked, while returned weeks retain feedback and may be revised and resubmitted by the learner.
- Corrected the live instructor test assignment to the seeded Brew 101 session and completed the end-to-end returned-for-revision smoke test.

### Security

- Released the deny-by-default Firestore Rules and verified in the live Rules Playground that the scoped learner can read its confirmed test session while an authenticated, ungranted UID is denied.
- Scoped Firestore enrolment queries to the active learner's UID, provider-neutral person ID, and confirmed status before exposing a session title.
- Enforced per-week completion and learner locking in Firestore Rules so a submitted week cannot be altered through the browser.
- Limited instructor reviews to one submitted week in an assigned session, preserving the learner’s observation and requiring feedback for an approve or return outcome.

## [2026-10-16]

### Added

- Added the persistent Codex development protocol, local commit gate, and GitHub Actions verification baseline.
- Added a full-screen Werks Sessions hero and About section to the public landing experience.
- Added the approved Grey Matter Design System tokens, typography, logo, and botanical assets used by the portal.
- Added the versioned Firebase Spark MVP roadmap, centred on concierge cohort operations and later manually seeded Firestore access grants.
- Added the Spark access-grant schema, staff operations guide, and emulator-verified Rules for learner practice and instructor review.

### Changed

- Added a Google sign-in foundation for confirmed Werks Sessions learners; signing in does not create access or an enrolment, and the public client no longer carries dormant callable-function code.
- Replaced the public callable interest form with an offering-specific email enquiry so the live public path works without Cloud Functions.
- Directed public Werks Sessions enquiries to `greymatter.cw@outlook.com`.
- Replaced the email-link sign-in screen with truthful learner-access guidance; confirmed-booking access is now a staff-operated step.
- Refreshed the responsive public portal around the coffee-tasting workshop experience while preserving existing session and dashboard content.
- Refined display scale, font weight, rules, and decorative contrast for a quieter, more controlled reading experience.
- Published the Werks Sessions production build to Firebase Hosting.
- Upgraded Firebase Functions/Admin and the frontend Firebase SDK as part of the security-verification baseline.

### Security

- Removed all gated course-work originals and planning archives from version control; added ignored paths and non-content placeholders for the private Firebase Storage publication flow.
- Pinned Firebase Firestore's transitive gRPC transport to the patched 1.14.6 release, clearing the production dependency-audit gate without suppressing findings.

## [2026-10-15]

### Added

- Added the initial Werks Sessions React/Vite portal, covering Public Cupping, Brew 101, learner practice, instructor, and administrator workflows.
- Added the Firebase project configuration, callable Functions, Firestore and Storage rules, and local development foundation.
