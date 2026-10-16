# Session Handoff

## Current state

Werks Sessions is now being delivered as a Firebase Spark MVP. The public production path is deliberately simple: the site is hosted on Firebase Hosting, a visitor selects Public Cupping or Brew 101, and an offering-specific prefilled email enquiry opens. It does not write to Firestore, call a Function, create an account, reserve a place, or imply an automated reply.

The former public email-link sign-in/activation route is no longer exposed. It required a callable Function to validate staff-created invitations and issue custom claims, which cannot deploy on Spark. The learner-access page now truthfully explains that staff arrange access after a confirmed booking.

The original trusted Functions, Firestore custom-claim Rules, private Storage flow, and unpublished resource code remain in the repository but are not part of the Spark production path. Do not deploy Functions or Storage while the project remains on Spark.

## Spark architecture decision

- Keep Firebase Hosting for the public offer.
- Keep payment confirmation, enrolment, capacity, attendance, and private-material delivery manual for the first cohort.
- Do not use Firebase email-link sign-in as a normal learner login; its Spark email quota is unsuitable for a public offering.
- The next implementation phase will replace custom-claim Rules with Firestore Rules based on staff-seeded role and enrolment/access-grant documents. No client may grant a role, person mapping, enrolment, attendance, or instructor status.
- Continue to store a provider-neutral `person_id` in domain records for the future SeduhID bridge, while accepting that staff must assign it during the Spark interim.

## Verification to run for this increment

- `npm.cmd run lint`
- `npm.cmd run check`
- `npm.cmd run test:unit`
- `npm.cmd run test:rules`
- `npm.cmd run build`
- `npm.cmd run security:secrets`
- `npm.cmd run security:deps`
- local browser smoke test for the public enquiry and learner-access screens

## Next action

Validate and deploy the public Spark-safe Hosting update. Then begin Phase 2: define and test manually seeded Firestore access grants before building any authenticated learner screen.

## 2026-10-16 Spark public-path validation

- Passed: lint, strict type-checking, frontend unit tests (2), Functions authorization tests (4), production build, secret scanning, and both production dependency audits (0 vulnerabilities).
- Passed: Firebase Emulator Rules tests (3). The expected denied staff write remains covered.
- Passed: local browser smoke test. The public enquiry link includes the selected offering and learner access contains no sign-in or activation flow.
- Note: the first combined verification run exceeded the tool timeout and left a temporary Firestore Emulator process on port 8080. It was stopped by PID after inspection; the Rules suite then passed cleanly in a fresh emulator run.
- Not performed: Functions, Firestore Rules, Storage Rules, or Hosting deployment. This increment has no production backend release.
