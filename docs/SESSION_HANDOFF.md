# Session Handoff

## Current state

Werks Sessions is being delivered as a Firebase Spark MVP. The public path is deliberately simple: Hosting presents Public Cupping and Brew 101, then opens an offering-specific enquiry to `greymatter.cw@outlook.com`. It does not write to Firestore, call a Function, create an account, reserve a place, or imply an automated reply.

Phase 3.1 adds the first learner-facing Firestore reads at Learner access. A signed-in account remains pending unless staff seed an active grant and confirmed enrolment. A granted learner can see only their confirmed session title and a read-only four-week Brew 101 practice preview. The browser cannot write practice, roles, enrolments, attendance, or staff records. The dormant browser email-link/custom-claim and callable helpers remain removed.

Firestore now has a live Spark access-grant model in the default Standard database in `asia-southeast1`, with production-mode deny-by-default rules. It uses manually seeded `access_grants`, confirmed enrolments, and teaching assignments rather than custom claims. The staff procedure is in `docs/SPARK_ACCESS_GRANTS.md`. No browser client can grant a role, person mapping, enrolment, attendance, or instructor status.

The trusted Functions, private Storage flow, and unpublished resource code remain in the repository but are not part of the Spark production path. Do not deploy Functions or Storage while the project remains on Spark.

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
- Non-blocking: Vite reports an 841 kB minified JavaScript chunk. Frontend owner should assess code splitting before Phase 3.2 expands the learner workspace.
- Not performed: a Functions release or a Storage release.

## Next action

Ask the staff-controlled test learner to sign in at `https://werks-session.web.app` and confirm the Brew 101 test session renders. Then Phase 3.2 can add learner-owned four-week practice entry and submission while retaining staff-only manual grant creation during Spark operation.
