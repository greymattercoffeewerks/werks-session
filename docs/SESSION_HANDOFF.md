# Session Handoff

## Current state

Werks Sessions is being delivered as a Firebase Spark MVP. The public path is deliberately simple: Hosting presents Public Cupping and Brew 101, then opens an offering-specific enquiry to `greymatter.cw@outlook.com`. It does not write to Firestore, call a Function, create an account, reserve a place, or imply an automated reply.

Phase 2.1 adds a Google account foundation at Learner access. Its Firebase web-app configuration is public, production configuration; the screen supports Google sign-in and sign-out but does not query Firestore, call a Function, or expose learner data. A signed-in account remains pending until staff separately confirm a booking and seed its manual access documents. The dormant browser email-link/custom-claim and callable helpers were removed.

Firestore now has a locally verified Spark access-grant model. It uses manually seeded `access_grants`, confirmed enrolments, and teaching assignments rather than custom claims. The staff procedure is in `docs/SPARK_ACCESS_GRANTS.md`. No browser client can grant a role, person mapping, enrolment, attendance, or instructor status.

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
- Not performed: a production Firestore Rules release, a Functions release, or a Storage release.

## Next action

Confirm the signed-out and pending states in production. Only then create live manual grants and release Firestore Rules.
