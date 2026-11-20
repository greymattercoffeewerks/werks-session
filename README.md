# Werks Sessions

Werks Sessions is Grey Matter Coffee Werks' small, hands-on coffee-learning loop. It offers Public Cupping, Brew 101, and Barista 101, and stays focused on real tables, deliberate practice, and human follow-through rather than generic courseware.

## Spark MVP

The live MVP runs on Firebase Spark. The public site is hosted on Firebase Hosting; enquiries and the first cohort are operated personally by staff.

- The front page lists the next dates that staff publish from the instructor page, each with an "Ask about this date" email link. Visitors can also select a session and open a prefilled email enquiry. Enquiring does not create an account or reserve a place.
- Staff confirm suitability, payment, a date, and learner access manually.
- Cloud Functions, Firebase Storage, signed downloads, transactional email, and email-link sign-in are not used by the Spark launch. The trusted Functions code remains in `functions/` for a future Blaze migration and is never deployed while the project is on Spark.
- Brew 101 remains non-assessed. Attendance and practice feedback are not certification or competency claims.

## Local setup

1. Use Node 24, the version pinned in `.nvmrc` (`nvm use`); CI reads the same file. `engines` requires `>=22`, because Node 20 reached end of life in April 2026. Java 21 or later is needed for the Firestore and Storage emulators.
2. Install root dependencies: `npm.cmd install`.
3. Install Functions dependencies only when working on the future Blaze-compatible backend: `npm.cmd install --prefix functions`.
4. Run `npm.cmd run dev` for the interface or `npm.cmd run build` for a production build.
5. Format with `npm.cmd run format`; `npm.cmd run format:check` runs inside the verification gate.

The public Spark launch does not require Firebase browser configuration. Do not deploy Functions from this repository while the project remains on Spark.

## Spark operating model

1. A visitor sends an enquiry from the public site.
2. Staff handle payment, confirmation, and cohort placement outside the portal.
3. After a learner is accepted, staff manually seed the documented Firestore access grant and confirmed enrolment. The Rules are deployed to the live Firestore database and verified by emulator tests.
4. Learner practice and instructor feedback use direct Firestore access protected by deny-by-default Rules; clients can never grant themselves a role or enrolment.
5. Private materials are delivered personally after confirmation. They must not be served from Firebase Storage or public Hosting while on Spark.

## Documentation map

- `docs/SESSION_HANDOFF.md`: current state, verification, risks, and next action. Read first.
- `docs/PROJECT_MEMORY.md`, `docs/DECISIONS.md`, `CONVENTIONS.md`: product, architecture decisions, and working rules.
- `docs/ROADMAP.md`: Spark MVP phases.
- `docs/SPARK_ACCESS_GRANTS.md`: the staff procedure for access, enrolment, and teaching records.
- `docs/GATED_SESSION_GUIDE_PLAN.md`: the learner-only Public Cupping guide, built and released but not yet seeded in production.
- `SECURITY.md`: how to report a vulnerability privately, and what is in scope.
- `CHANGELOG.md`: user-visible, operational, and security-impacting changes.

## Future SeduhID handoff

Firebase is still a temporary identity provider. Domain records retain a provider-neutral `person_id`, rather than treating the Firebase UID as the long-term identity. The Spark MVP deliberately postpones automated identity provisioning until a trusted server-side bridge is available.

## Licence

The source code is licensed under the MIT License (see [`LICENSE`](LICENSE)). Course
content, written copy, brand assets, and the design system are not covered by that licence
and remain all rights reserved (see [`NOTICE`](NOTICE)). The Figtree and Archivo fonts keep
their own OFL-1.1 licences.

## Safety notes

- Do not commit `.env`, service-account JSON, private contact lists, or course materials. This repository is public; keep anything behind the learner gate in the gitignored `content-drafts/` folder. `npm.cmd run security:gated` enforces this.
- Keep Firestore and Storage Rules deny-by-default. Add emulator coverage before allowing any new client path.
- Do not publish Brew 101 as a competency credential. `attended` and practice feedback are distinct from any future credential.
