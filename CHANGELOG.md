# Changelog

All notable user-visible, operational, and security-impacting changes are recorded by completion date.

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
