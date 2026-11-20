# Changelog

All notable user-visible, operational, and security-impacting changes are recorded by completion date.

## [2026-11-20]

### Changed

- Brew 101 practice is now stored one document per week instead of one map of all four weeks on the learner's record. The instructor review queue and Reviewed history page through ten weeks at a time with a "Load more" control, backed by collection-group queries rather than reading every learner document, and an instructor can no longer read a week that is still a draft. The learner experience is unchanged: save, submit, return, and resubmit work as before, with each write touching only its own week.

### Security

- Draft practice weeks are no longer readable by teaching staff. The Rules only expose a week to an instructor once it is submitted, approved, or returned, so the queue cannot include work a learner has not chosen to submit.

### Operational

- Adopted Prettier for the code base. `npm.cmd run format` formats; `npm.cmd run format:check` now runs inside `verify`, so unformatted code blocks a commit. Hand-written prose (Markdown), the vendored design system, `firestore.rules`, and lockfiles are deliberately outside the formatter, and `.git-blame-ignore-revs` records the one-off reformat commit so blame stays useful. The reformat is mechanical: no behaviour changed, and the full gate still passes.

## [2026-11-18]

### Changed

- The instructor experience is now four addressable pages instead of one long scroll: `/instructor` (an overview of what needs you now), `/instructor/review`, `/instructor/nights`, and `/instructor/dates`. Deep links, the back button, and browser history work, and the night record and dates editor only load when their page is opened. Hosting now rewrites those paths to the app, so a refresh or a copied link loads the page instead of a 404. The review queue is grouped by session and now keeps a Reviewed list of approved and returned weeks with their feedback, newest first, so an instructor can see what they decided after the queue has emptied. A half-typed review or an unsaved night record survives switching between the tabs. The public Sessions and Learner access navigation entries are real links now.

### Security

- A Public Cupping night record can now be changed only by the host who created it, or by an administrator. Another instructor assigned to the same session can still read the record and download the CSV, but not rewrite someone else's seats, totals, or notes. The instructor page shows that record read-only with a short note instead of offering a save the Rules would refuse. Covered by emulator tests for the host, a second assigned instructor, and an administrator, plus a browser test for the read-only page. Takes effect when the Firestore Rules are released.

### Operational

- Released the routed instructor pages on 2026-11-18 from merged `main` (`dc245b5`) with `firebase deploy --only hosting`. The live site serves entry `index-u56APJRm.js`, stylesheet `index-DZq500UX.css`, and lazy `LearnerAccess-O5BMEb2N.js`; the post-deploy smoke check passed 15/15, including `/instructor/review` and `/access` serving the app and a missing asset still returning 404. Firestore Rules, indexes, Functions, and Storage were not changed.
- Released the night-record host restriction on 2026-11-18 from merged `main` (`a5c7057`): Firestore Rules were deployed with `firebase deploy --only firestore:rules` (compiled and released) and Hosting with `firebase deploy --only hosting`. The live site served entry `index-B8Y5ZeTr.js` and stylesheet `index-CHNvHQAm.css`; the post-deploy smoke check passed 12/12, including the 403 on an anonymous night-record read. The database no longer accepts an update from an instructor who did not host the night.
- Moved the Node pin to 24 (`.nvmrc`), after checking that Node 20 reached end of life on 2026-04-30 and no longer receives security fixes. CI reads the pin, so all four jobs now install Node 24, and `engines` requires `>=22`. The Functions deployment target stays Node 20 because Functions are not deployed on Spark.
- Pinned the supported Node version in `.nvmrc` (20) and pointed every GitHub workflow at that file instead of repeating the version, so there is one place to bump. `engines` stays a floor (`>=20`) so a newer local Node still installs, and Java 21 remains the CI choice for the emulators.
- Added `SECURITY.md` and enabled GitHub's private vulnerability reporting, so a security report has a private channel instead of the booking enquiry address. The policy sets the scope, a 3-business-day acknowledgement, no bug bounty, anonymous-by-default credit, and safe-harbour wording. Secret scanning and push protection were already on; the non-provider pattern scan is not offered for this repository by GitHub.
- Added an explicit MIT licence for the source code, with a `NOTICE` file excluding course content, written copy, brand assets, and the design system from that grant. Previously the public repository had no licence, so reuse was implicitly forbidden rather than stated.
- Released the front-page date refresh and the colour-contrast fixes to Firebase Hosting from merged `main` (`36f498f`). The live site served entry chunk `index-BV9WeJF9.js` and stylesheet `index-DYT2af2g.css`; the post-deploy smoke check passed 12/12. Firestore Rules, indexes, Functions, and Storage were not deployed.
- Released the clock-order and unsaved-edit fixes to Firebase Hosting from merged `main` (`bc7881a`). The live site serves entry chunk `index-bmo8uaCn.js`; the post-deploy smoke check passed 12/12.

### Added

- Added a browser-level journey suite (Playwright) against the Firebase emulators. It signs in through the real "Continue with Google" button by driving the Auth emulator's identity-provider page, seeds a staff grant, guide, and teaching assignment, saves and submits a practice week, approves it as the instructor, records a Public Cupping night, and publishes a date that then appears on the front page. Six tests in 45 seconds, run in GitHub Actions as its own job.
- Added an axe accessibility check on the public page and the learner sign-in page, a unit-test coverage floor (80% lines and statements, 85% branches, 50% functions), and a post-deploy smoke check (`npm run smoke:production`) that verifies the live entry bundle carries no signed-in code, the lazy chunk and self-hosted WOFF2 fonts are served, and anonymous Firestore reads are still denied. The smoke check runs on the daily schedule and on demand.

### Fixed

- The front page now reloads the upcoming dates whenever it is shown, so a date an instructor has just published appears without a browser reload. The new browser suite found this.
- Darkened the muted label colour and removed the opacity from the method numbers, clearing the colour-contrast failures the accessibility check found (4.46:1 and 3.66:1 for 13px label text).
- Same-day dates on the front page now sort by the clock instead of by the text of the time, so "8:00 am" comes before "10:00 am" (previously "10:00 am" won). A time that cannot be read sorts after the readable ones.
- The night-record form no longer loses unsaved edits silently when the host switches sessions: it asks before discarding them and shows "Unsaved changes" until the record is saved.

### Changed

- Lint now checks React hook dependencies and hook order, plus the accessibility rules in `eslint-plugin-jsx-a11y`. The night-record loading effect no longer closes over `hostName`, `selectedId`, and `sessions`.
- Removed the unused demo fixtures (`sessions`, `demoEnrolment`, `demoChallenge`, `demoRecords`) and the unused `VITE_AUTH_CONTINUE_URL` placeholder.

### Security

- Emulator support in the browser app is build-time only (`VITE_FIREBASE_EMULATORS`), so a deployed bundle can never connect to a local emulator; the production build does not set it. The public-bundle check and the live smoke check both fail if a build contains emulator endpoints, so a stray local `.env` flag cannot ship localhost addresses to visitors.

## [2026-11-17]

### Operational

- Released the smaller public bundle and the WOFF2-only fonts to Firebase Hosting on 2026-11-17 from merged `main` (`5a604b3`). The live site serves entry chunk `index-DZTBS9gk.js` and stylesheet `index-DwgssCIH.css`; an anonymous visitor no longer downloads the instructor or learner app, and the ten legacy WOFF files are gone. Firestore Rules, indexes, Functions, and Storage were not deployed.

### Changed

- The site now ships only WOFF2 brand fonts. The Fontsource stylesheets were replaced with ten `@font-face` rules in `src/fonts.css` that request the WOFF2 file only, so the ten legacy WOFF copies (about 165 kB) no longer ship and the stylesheet is slightly smaller. Modern browsers already selected WOFF2 from the old font stack, so what a visitor downloads is unchanged; the saving is in the deployed assets.
- The public page no longer ships the signed-in app. The instructor and learner experience now loads on demand when someone opens Learner access, so an anonymous visitor fetches a 750 kB entry chunk instead of 900 kB (207 kB gzipped instead of 239 kB), and that chunk contains no instructor or learner screen and no signed-in data path. The signed-in code, including the Firebase Auth SDK, is a separate 156 kB chunk (36 kB gzipped) fetched only on demand. If that chunk cannot be downloaded, the page says so and offers a reload instead of losing the public page. A new public-bundle check in the verification gate fails if any of those screens, their Firestore paths, a stale build, or a broken split slips back into the public bundle.

### Security

- Pinned the Firebase CLI. `firebase-tools` was declared as `"latest"`, so a routine dependency pass silently moved it from 15.33.0 to 15.36.0 and any future CLI release could change the local verification gate without a code change. It is now pinned to 15.36.0 and only moves through a reviewed dependency pull request.
- Turned on the advisory feed. Dependabot alerts and automated security updates were both disabled on the repository, so new advisories surfaced only when someone ran the dependency gate by hand. They are now enabled, with Dependabot watching the web-app lockfile, the Functions lockfile, and the GitHub Actions workflows. A daily scheduled `verify` run now also checks the emulators and the build between pull requests, and a separate dependency-audit job fails the run on a production advisory even when lint or the build fails first.
- Ran `npm audit fix` in both packages. The full root dependency tree drops from 36 advisories to 20 (17 moderate, 1 high, 2 critical); all of them are development-only, and the high and critical ones are `vite`, `vitest`, and `tinypool`, whose fixes need a major upgrade and are left to the new Dependabot pull requests. The production audits are unchanged: 0 for the web app and 6 moderate for Functions, below the high-severity gate.
- Patched the two production dependency findings that had started failing `npm run verify` (and therefore the commit hook and CI). The web app's Firestore dependency now uses `re2js` 2.10.0 instead of 2.8.6, clearing a high-severity denial-of-service advisory in the regex engine Firestore bundles; the trusted Functions dependencies now use `body-parser` 2.4.0 (clearing a high-severity denial-of-service advisory) and `fast-xml-parser` 5.12.1 (clearing a low-severity CPU-consumption advisory). The change is lockfile-only: no override or audit exception was added. Six moderate advisories remain in the Functions dependency tree, below the high-severity gate. The site was not redeployed, so the live bundle stays as it is until the next Hosting release.

## [2026-10-21]

### Added

- Added Barista 101 (Espresso Foundations) to the public front page as a third offer card with an email enquiry. It describes the four-hour, small-group course and says plainly that it is not an SCA-certified course. There are no published dates yet.
- Barista 101 sessions can now be labelled in the portal, so confirmed learners see the pre-class guide (with extra sections such as the recipe model and steam-wand rules) and are not offered the Brew 101 four-week practice record. The staff Upcoming dates editor lists Barista 101 as a session type.

### Changed

- The three session cards now sit in one row on screens 1080 pixels wide and above (two across on tablets, one on phones), so Barista 101 no longer sits alone on a second row.

## [2026-10-20]

### Changed

- Tightened the public front page. The About section's heading no longer wraps to eight lines in a narrow column (it was capped at a width measured in the small body font), so About is roughly half its former height on desktop, and About and the method block use less padding. The page is about 480 pixels shorter on desktop.
- Gave "Next tables" its own dark band so it no longer runs into the "Ask about the next table" block, with the date cards staying light on it.

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
