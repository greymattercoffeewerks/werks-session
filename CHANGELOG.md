# Changelog

All notable user-visible, operational, and security-impacting changes are recorded by completion date.

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

### Security

- The public site no longer requests fonts from Google, removing a third-party request from every page view. The licensed Gotham font files are no longer served.

### Operational

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
