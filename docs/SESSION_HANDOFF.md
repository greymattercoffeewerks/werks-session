# Session Handoff

## Current state

Phase 1 of the versioned MVP roadmap is implemented locally: public visitors now see only Sessions, About, and Sign in. Firebase email-link sign-in creates or retrieves the provider-neutral `person_id` through `activateLearner`, refreshes the claim token, and only then renders a signed-in private state. The callable requires a staff-created, confirmed `account_invites/{lowercase-email}` record before issuing a learner claim; uninvited email-link users are signed out and denied portal access. The activation transaction re-reads its identity link so concurrent sign-ins cannot create multiple people for one Firebase subject. The former public role-switching demo dashboards are not exposed. Real cohort, learner-practice, and instructor-workspace data remain Phase 2 and Phase 3 work; the current private view is intentionally truthful about that state.

The new `docs/ROADMAP.md` records the approved MVP sequence: controlled identity, cohort operations, learner/instructor loop, then pilot release. The roadmap explicitly keeps automated payments, a public calendar, resource publication, Brew 102, and SeduhID migration out of the immediate MVP scope.

## 2026-10-16 Phase 1 validation

- Passed: lint, strict type-checking, frontend unit tests (2), Functions authorization tests (4), Firebase Rules tests (3), secret scanning, and `node --check functions/index.js`.
- Passed: production build in an isolated temporary output directory. The normal `npm.cmd run build` cannot replace the pre-existing locked `dist/404.html` in this sandbox; no source or generated production asset was changed as a workaround.
- Passed: the root and Functions production dependency audits after a root npm override pinned Firestore's vulnerable transitive `@grpc/grpc-js` dependency to 1.14.6. This is a version pin, not an audit exception; revisit it when Firebase updates its own range.
- Next action: commit the verified Phase 1 and dependency remediation, then configure Firebase Email Link sign-in, create one confirmed test invitation, and run the first controlled learner sign-in before beginning Phase 2 cohort operations.

The portal has pre-existing uncommitted product work in Firebase configuration, Functions, app UI, portal client code, styles, types, Storage Rules, `.firebaserc`, and `content-drafts/`. Protocol work was added without resetting, staging, or overwriting that work.

The landing experience has been redesigned as a responsive, full-viewport Werks Sessions website. It retains the existing Public Cupping and Brew 101 content and all learner, instructor, and admin flows, while adding a full-screen tasting-table hero and an About section that explains the practice-first format. No Firebase, authorization, content-publication, or resource-access behavior changed.

The supplied Grey Matter Design System is now available under `public/grey-matter-design-system/` and the portal imports its official token stylesheet. The site now uses the approved logo artwork, Figtree/Archivo typography, cream/charcoal foundation, border-led components, and restrained botanical artwork for the hero. The public information sections use the Swedish Simplistic expression; the hero alone uses the Old School Rich botanical treatment.

The visual hierarchy was subsequently refined without changing the design direction, content, assets, or layout. The hero, section headings, session cards, dashboards, and responsive type scale now use fewer heavy weights, smaller display ranges, lighter rules, and a lower-contrast botanical treatment so the page reads more calmly while retaining its Grey Matter character.

## 2026-10-16 interface refresh validation

- Passed: `npm.cmd run lint`, `npm.cmd run test:unit` (2 frontend and 3 Functions tests), `npm.cmd run test:rules` (3 Firebase Rules tests), `npm.cmd run build`, and `npm.cmd run security:secrets`.
- Passed: local browser review of the public landing page at desktop and 390px mobile widths; the About navigation works and no browser console errors were reported.
- Security review: no authentication, authorization, Firestore/Storage Rules, Functions, published-resource, dependency, or external-asset code changed as part of this redesign.
- Known release blocker remains: `npm.cmd run security:deps` reports the existing 4 high-severity `@grpc/grpc-js` findings below Firebase Firestore. The only suggested fix is a breaking Firebase downgrade; no dependency change was made.

## 2026-10-16 Grey Matter Design System alignment

- Passed: `npm.cmd run lint`, `npm.cmd run test:unit` (2 frontend and 3 Functions tests), `npm.cmd run test:rules` (3 Firebase Rules tests), `npm.cmd run build`, and `npm.cmd run security:secrets` after integrating the supplied styles and approved assets.
- Passed: local browser review at desktop and 390px mobile widths. The approved logo, Figtree/Archivo type pairing, botanical hero artwork, navigation, primary CTA, and responsive hierarchy render without browser console errors.
- Security review: only public design-system styles and approved static image/font assets were added. Runtime reference source, demo files, and the reference-only image were removed from `public/` so they are not linted or served unnecessarily. No authentication, authorization, Firestore/Storage Rules, Function, or learner-resource access behavior changed.
- Known release blocker remains unchanged: `npm.cmd run security:deps` reports 4 high-severity `@grpc/grpc-js` findings transitively under Firebase Firestore. No dependency change was made.

## 2026-10-16 quiet visual refinement

- Passed: `npm.cmd run lint`, `npm.cmd run test:unit` (2 frontend and 3 Functions tests), `npm.cmd run test:rules` (3 Firebase Rules tests), `npm.cmd run build`, and `npm.cmd run security:secrets`.
- Passed: the Impeccable detector on `src/styles.css` returned no findings. Desktop and 390px mobile visual review confirmed a calmer hero hierarchy, reduced decorative contrast, and no browser console errors.
- Quality/security review: this is a CSS-only refinement. Existing content, approved Design System assets, page structure, Firebase behavior, authorization, and resource access remain unchanged. The known production dependency-audit blocker is unchanged.

## 2026-10-16 Firebase Hosting deployment

- Deployed: the current production `dist/` build to Firebase Hosting project `werks-session` with `npm.cmd run hosting:deploy`.
- Verified: `https://werks-session.web.app` returned HTTP 200 with the Vite React root and a versioned JavaScript bundle.
- Scope: Hosting only; no Functions, Firestore Rules, or Storage Rules release was performed.

## 2026-10-16 gated course-material source control

- Removed all course-work originals from version control while leaving their local copies intact and ignored for future commits: the Brew 101 takeaway PDF, every planning/curriculum document and archive, and the Public Cupping participant-guide draft.
- Added non-content placeholders that document the private Firebase Storage publication flow. No learner material is publicly served by Hosting or GitHub.
- Security review: the public portal contains only its existing gated-resource placeholder state. The private Storage, callable-function authorisation, and Rules behavior are unchanged.
- Verification: lint, type-checking, unit tests, Firebase Rules tests, build, and secret scanning passed. The only full-gate failure remains the documented Firebase Firestore transitive dependency audit finding; no audit exception was added.

## Protocol baseline

- Repository memory, session hook, review playbooks, local pre-commit hook, and GitHub Actions verification are installed.
- Local verification covers lint, type check, unit tests, Firebase Rules tests, build, dependency audit, and secret scanning.
- Firebase was upgraded to 13.0.0, and the Functions package now uses `firebase-admin` 14.5.0 and `firebase-functions` 7.4.0.
- Firebase Console access for `werks-session` remains a release blocker; deployments are intentionally not automated.

## Validation

- Passed: `npm.cmd run lint`, `npm.cmd run check`, `npm.cmd run test:unit` (2 frontend + 3 Functions tests), `npm.cmd run test:rules` (3 emulator Rules tests), `npm.cmd run build`, and `npm.cmd run security:secrets`.
- Passed: Functions production dependency audit after the Firebase Admin/Functions upgrade.
- Blocked as designed: root `npm audit --omit=dev --audit-level=high` reports a high-severity Node-only `@grpc/grpc-js` dependency transitively pinned by Firebase 13 Firestore. No audit exception was added.

## Open risks

- GitHub branch protection must be enabled by an administrator after the verification workflow is pushed.
- The first Codex session in this clone must review and trust `.codex/hooks.json`; repository trust is intentionally a manual security decision.
- The Firebase project ID/account permission requires confirmation before any deployment.
- Revisit the root `@grpc/grpc-js` override when Firebase updates Firestore's dependency range, and remove it after the production audit remains clear without the pin.

## Next action

Configure Firebase Email Link sign-in and run the controlled first-learner sign-in; retain the gRPC override until Firebase updates Firestore's own range, then remove it after verification.
