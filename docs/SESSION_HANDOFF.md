# Session Handoff

## Current state

Werks Sessions is being delivered as a Firebase Spark MVP. The public path is deliberately simple: Hosting presents Public Cupping and Brew 101, then opens an offering-specific enquiry to `greymatter.cw@outlook.com`. It does not write to Firestore, call a Function, create an account, reserve a place, or imply an automated reply.

Phase 3.3 adds the assigned-instructor review queue to the learner-owned four-week Brew 101 practice record at Learner access. A signed-in account remains pending unless staff seed an active grant and confirmed enrolment. A granted learner can start one record for each confirmed session, save each weekly observation as a draft, and submit a week independently once its own fields are complete. The assigned-instructor queue displays submitted weeks from the instructor’s own sessions and requires feedback to approve or return one week. Approved weeks remain locked; returned weeks retain feedback and may be revised and submitted again. The browser cannot write roles, enrolments, attendance, or staff records. The dormant browser email-link/custom-claim and callable helpers remain removed.

Firestore now has a live Spark access-grant model in the default Standard database in `asia-southeast1`, with production-mode deny-by-default rules. It uses manually seeded `access_grants`, confirmed enrolments, and teaching assignments rather than custom claims. The staff procedure is in `docs/SPARK_ACCESS_GRANTS.md`. No browser client can grant a role, person mapping, enrolment, attendance, or instructor status.

The trusted Functions, private Storage flow, and unpublished resource code remain in the repository but are not part of the Spark production path. Do not deploy Functions or Storage while the project remains on Spark.

Phase 3.4.1 refreshes the public offer content before the paid pilot. It keeps the existing Spark enquiry flow but makes the offer, practical outcomes, and manual next step clearer. The About section now describes the hands-on learning table in a shorter two-column composition rather than relying on an oversized statement.

Phase 3.4.2 refines the public hero learning-table card. Its large statement and smaller supporting quote now share one inset, with enough reserved space for the quote and no decorative divider.

Phase 3.4.3 restores two restrained Grey Matter turquoise brand cues: the hero identity label on charcoal and the About marker in teal-deep on cream. It does not repurpose teal as a generic UI or status colour.

Phase 3.4.4a clarifies the learner-facing Brew 101 practice journey. It explains the four-week cadence, independent save, submit, and review states, and next steps without changing any Spark access or review behaviour.

Phase 3.4.4b widens the learner workspace from the tight reading container to the normal application container. At phone widths, the navigation wraps safely and the learner heading scales down to preserve a single-column, no-horizontal-overflow layout.

## Spark architecture decision

- Keep Firebase Hosting for the public offer.
- Keep payment confirmation, enrolment, capacity, attendance, and private-material delivery manual for the first cohort.
- Do not use Firebase email-link sign-in as a normal learner login; its Spark email quota is unsuitable for a public offering.
- The access-grant Rules retain a provider-neutral `person_id` field, assigned manually by staff during the Spark interim.
- Use Google Sign-In for the Spark cohort; every account is pending by default.
- Do not treat sign-in as a Firestore or product entitlement.

## Validation

- Passed: `npm.cmd run verify` — lint, strict type checking, frontend unit tests (3), Functions authorization tests (4), Firebase Rules emulator tests (4), production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: independent quality review and security review; neither found a release blocker.
- Passed: Google Sign-In is enabled for `werks-session`; an intentionally invalid Google provider token reached the enabled provider and was rejected as invalid, and the project owner then completed a real Google sign-in.
- Passed: deployed the verified Phase 2.1 batch to Firebase Hosting at `https://werks-session.web.app`; the live bundle exposes Google Sign-In and omits the retired email-link path.
- Passed: provisioned the Firebase Spark Cloud Firestore default database in `asia-southeast1` with production-mode rules and no backups.
- Passed: released `firestore.rules` to the production Firestore database. The Rules Playground allowed the scoped test learner to read `sessions/brew101-test-01` and denied the identical read to an authenticated, ungranted UID.
- Passed: manually seeded only the scoped test learner grant, confirmed Brew 101 test enrolment, and minimal test session record needed for this verification.
- Passed: full Phase 3.1 verification - lint, strict type checking, frontend unit tests (4), Functions authorization tests (4), Firebase Rules emulator tests (4), production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: manual quality and security review found no release blocker. The learner client has no write path; Firestore Rules independently restrict enrolment reads and queries to the active learner's confirmed records.
- Passed: deployed the Phase 3.1 Hosting build and Firestore Rules/indexes; `https://werks-session.web.app` returned HTTP 200 and served the new Phase 3.1 bundle.
- Passed: full Phase 3.2 verification - lint, strict type checking, frontend unit tests (5), Functions authorization tests (4), Firebase Rules emulator tests (4), production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: independent quality review found no correctness, type-safety, accessibility, or regression blocker. The learner form uses labelled inputs, semantic fieldsets, and a disabled submit action until the relevant week is complete.
- Passed: independent security review found no authorization bypass, new public path, secret, or production dependency finding. The Rules independently enforce confirmed enrolment, immutable ownership, and complete individual-week submission.
- Passed: deployed the Phase 3.2 Hosting build. `https://werks-session.web.app` returned HTTP 200 and served the new bundle containing the four-week practice workflow.
- Not deployed: Firestore Rules and indexes. They are unchanged from the previously released access model and did not require a deployment for this phase.
- Passed: full Phase 3.2.1 verification - lint, strict type checking, frontend unit tests (5), Functions authorization tests (4), Firebase Rules emulator tests (4), production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: independent quality review found no correctness, accessibility, or regression blocker. The visible completion control is a normal keyboard-focusable checkbox, and each week has its own clear save and submit action.
- Passed: independent security review found no authorization bypass, new public path, secret, or production dependency finding. Emulator coverage proves a learner can continue drafting later weeks after submission but cannot alter an already submitted week.
- Passed: deployed the Phase 3.2.1 Hosting build. `https://werks-session.web.app` returned HTTP 200 and served bundle `index-BRm-E5jq.js` with the per-week submit action.
- Passed: released the Phase 3.2.1 Firestore Rules. The CLI compiled and released `firestore.rules`; Firestore indexes are unchanged and were not deployed.
- Passed: staff-controlled learner smoke test saved and submitted Week 1 in the live portal. The learner received the submitted-and-locked confirmation while later weeks remained available.
- Passed: full Phase 3.3 verification - lint, strict type checking, frontend unit tests (7), Functions authorization tests (4), Firebase Rules emulator tests (4), production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: interface detector found no mechanical design issue in the changed access UI. The production build remains subject to the existing 865 kB minified JavaScript chunk warning.
- Passed: independent quality review found no correctness, accessibility, or regression blocker. The instructor queue has labelled feedback, explicit actions, and an empty state; the learner sees feedback with the correct locked or returned state.
- Passed: independent security review found no role-write or cross-session review bypass. Rules require an active assignment, one submitted target week, a server timestamp, and non-blank feedback; they preserve all learner observations and lock approved weeks.
- Non-blocking: the current one-document-per-learner challenge model grants assigned instructors trusted read access to all four weeks in an assigned session. The portal queue renders only submitted weeks; split weeks into separate documents before a policy that requires database-level draft secrecy.
- Passed: deployed Phase 3.3 Hosting and Firestore Rules. `https://werks-session.web.app` returned HTTP 200 and served bundle `index-CxITGnoV.js`, including the instructor review, approval, and returned-for-revision paths. Firestore compiled and released `firestore.rules`; indexes, Functions, and Storage were not deployed.
- Passed: live Phase 3.3 instructor smoke test. The assigned instructor saw the learner's submitted Week 1 and returned it with feedback; the returned-week state is now available to the learner for revision and resubmission.
- Non-blocking: Vite reports an 860 kB minified JavaScript chunk. Frontend owner should assess code splitting before Phase 3.3 expands the learner workspace.
- Not performed: a Functions release or a Storage release.
- Passed: full Phase 3.4.1 verification - lint, strict type checking, frontend unit tests (7), Functions authorization tests (4), Firebase Rules emulator tests (4), production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: desktop and 360px visual QA of the public offer and About section. The updated About layout has no horizontal overflow at 360px; the Impeccable UI consistency detector reported no issues.
- Passed: independent quality review and security review found no release blocker. This batch changes public copy, layout, and the existing mailto wording only; it adds no public write path, secrets, access-control change, or backend deployment.
- Passed: deployed Phase 3.4.1 Hosting. `https://werks-session.web.app` returned HTTP 200 and served bundle `index-CHh2f3qU.js` containing the approved About and enquiry copy.
- Not deployed: Firestore Rules, indexes, Functions, and Storage. They are unchanged.
- Passed: Phase 3.4.3 desktop and 360px visual QA. The new hero and About brand cues retain their designated teal roles, with no horizontal overflow at 360px.
- Passed: the Impeccable UI consistency detector reported no issues. Quality and security review found no blocker; this CSS-only public presentation change adds no write, access, secret, or backend path.
- Passed: deployed Phase 3.4.3 Hosting. `https://werks-session.web.app` returned HTTP 200 and served CSS bundle `index-Dkxlrh_d.css` containing both teal brand cues.
- Not deployed: Firestore Rules, indexes, Functions, and Storage. They are unchanged.
- Passed: Phase 3.4.2 production build and desktop/360px hero-card QA. The supporting quote aligns with the large statement, remains below it, and the card has no horizontal overflow at 360px.
- Passed: Impeccable layout and final UI consistency scans reported no issues. Quality and security review found no blocker; this is a CSS-only public presentation change with no new write, access, secret, or backend path.
- Passed: deployed Phase 3.4.2 Hosting. `https://werks-session.web.app` returned HTTP 200 and served the refined hero-card CSS bundle `index-D-IFA7ls.css`.
- Not deployed: Firestore Rules, indexes, Functions, and Storage. They are unchanged.

- Passed: Phase 3.4.4a focused verification — lint, strict type checking, seven frontend unit tests, four Functions authorization tests, and a production build.
- Passed: the Impeccable UI consistency detector reported no issues. Quality review found the copy matches the existing individual-week workflow; security review found no new write, access, secret, Rules, or backend path.
- Passed: deployed Phase 3.4.4a Hosting. `https://werks-session.web.app` returned HTTP 200 and served bundle `index-DwkyvUgi.js` containing the learner practice, submission, and returned-for-revision copy.
- Not to deploy: Firestore Rules, indexes, Functions, and Storage. They are unchanged.

- Passed: Phase 3.4.4b full verification — lint, strict type checking, seven frontend unit tests, four Functions authorization tests, four Rules emulator tests, production build, secret scan, and both production dependency audits (0 vulnerabilities).
- Passed: the Impeccable UI consistency detector reported no issues. Desktop review confirms the learner workspace now uses the standard application width; a real 360px browser viewport reports equal document scroll and client widths, with the phone navigation and learner heading adapting safely.
- Passed: deployed Phase 3.4.4b Hosting. `https://werks-session.web.app` returned HTTP 200 and served stylesheet `index-BTrM3jBU.css` containing the widened learner container and phone heading safeguard.
- Not to deploy: Firestore Rules, indexes, Functions, and Storage. They are unchanged.

## Next action

Prepare the instructor-facing content batch before the paid pilot. Retain the documented one-document-per-learner limitation until practice weeks are split into individually protected documents.
