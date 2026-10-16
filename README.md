# Werks Sessions

Werks Sessions is Grey Matter Coffee Werks' small, hands-on coffee-learning loop. It begins with Public Cupping and Brew 101, and stays focused on real tables, deliberate practice, and human follow-through rather than generic courseware.

## Spark MVP

The live MVP runs on Firebase Spark. The public site is hosted on Firebase Hosting; enquiries and the first cohort are operated personally by staff.

- Visitors select a session and open a prefilled email enquiry. Enquiring does not create an account or reserve a place.
- Staff confirm suitability, payment, a date, and learner access manually.
- No Cloud Functions, Firebase Storage, signed downloads, transactional email, or email-link sign-in are part of the Spark launch.
- Brew 101 remains non-assessed. Attendance and practice feedback are not certification or competency claims.

## Local setup

1. Install root dependencies: `npm.cmd install`.
2. Install Functions dependencies only when working on the future Blaze-compatible backend: `npm.cmd install --prefix functions`.
3. Run `npm.cmd run dev` for the interface or `npm.cmd run build` for a production build.

The public Spark launch does not require Firebase browser configuration. Do not deploy Functions from this repository while the project remains on Spark.

## Spark operating model

1. A visitor sends an enquiry from the public site.
2. Staff handle payment, confirmation, and cohort placement outside the portal.
3. Only after a learner is accepted will a future Spark portal create a manually seeded Firestore access grant.
4. Learner practice and instructor feedback will use direct Firestore access protected by deny-by-default Rules; clients will never be able to grant themselves a role or enrolment.
5. Private materials are delivered personally after confirmation. They must not be served from Firebase Storage or public Hosting while on Spark.

## Future SeduhID handoff

Firebase is still a temporary identity provider. Domain records retain a provider-neutral `person_id`, rather than treating the Firebase UID as the long-term identity. The Spark MVP deliberately postpones automated identity provisioning until a trusted server-side bridge is available.

## Safety notes

- Do not commit `.env`, service-account JSON, private contact lists, or course materials.
- Keep Firestore and Storage Rules deny-by-default. Add emulator coverage before allowing any new client path.
- Do not publish Brew 101 as a competency credential. `attended` and practice feedback are distinct from any future credential.
