# Session Handoff

## Current state

Werks Sessions is being delivered as a Firebase Spark MVP. The public path is deliberately simple: Hosting presents Public Cupping and Brew 101, then opens an offering-specific email enquiry. It does not write to Firestore, call a Function, create an account, reserve a place, or imply an automated reply.

The former public email-link sign-in and activation route is no longer exposed. It required a callable Function to validate invitations and issue custom claims, which cannot deploy on Spark. Learner access is now arranged by staff after a confirmed booking.

Firestore now has a locally verified Spark access-grant model. It uses manually seeded `access_grants`, confirmed enrolments, and teaching assignments rather than custom claims. The staff procedure is in `docs/SPARK_ACCESS_GRANTS.md`. No browser client can grant a role, person mapping, enrolment, attendance, or instructor status.

The trusted Functions, private Storage flow, and unpublished resource code remain in the repository but are not part of the Spark production path. Do not deploy Functions or Storage while the project remains on Spark.

## Spark architecture decision

- Keep Firebase Hosting for the public offer.
- Keep payment confirmation, enrolment, capacity, attendance, and private-material delivery manual for the first cohort.
- Do not use Firebase email-link sign-in as a normal learner login; its Spark email quota is unsuitable for a public offering.
- The access-grant Rules retain a provider-neutral `person_id` field, assigned manually by staff during the Spark interim.
- Select and configure a Spark Authentication provider before exposing an authenticated learner screen.

## Validation

- Passed: staged verification of the public-path commit: lint, strict type checking, frontend unit tests (2), Functions authorization tests (4), Firebase Rules tests (3), production build, secret scan, and both dependency audits (0 vulnerabilities).
- Passed: local browser smoke test. The public enquiry link includes the selected offering and learner access contains no sign-in or activation flow.
- Passed: new Firebase Emulator Rules tests (4). A granted learner can create/submit only their own challenge; only an assigned instructor can review it; ungranted users and every Storage path remain denied.
- Not performed: Firebase Authentication provider configuration, a production Firestore Rules release, a Functions release, a Storage release, or a Hosting deployment.

## Next action

Select and configure the Spark Authentication provider, then validate the manually seeded access-grant flow in production before building any authenticated learner screen.
