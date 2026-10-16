# Werks Sessions MVP Roadmap

## Purpose

This roadmap turns Werks Sessions from a public interest experience into a small, repeatable operating loop for real cohorts. It does not broaden the product into a general LMS, a public calendar, or a certification pathway.

## MVP outcome

One accepted learner can move safely from interest through manual payment, confirmed enrolment, account access, attendance, four-week practice, and instructor review. Staff can operate that flow without manually editing Firebase records.

## Phase 1 — Identity and controlled access

### Goal

Replace public demo role switching with Firebase email-link sign-in and verified role-based access.

### Included

- Email-link request and completion screens.
- First-sign-in learner activation and provider-neutral `person_id` claim creation, gated by a staff-created confirmed invitation.
- Navigation and routes that derive access only from verified Firebase claims.
- A truthful signed-in landing state while real learner, instructor, and admin data is added in later phases.
- Clear signed-out, pending, and sign-in-error states.

### Not included

- Session, enrolment, payment, and roster management.
- Real learner records, challenge persistence, or instructor review UI.
- Course-material publication.

### Done when

- A signed-out visitor can use only public Sessions and About pages.
- A learner can request and complete an email-link sign-in, receives a stable `person_id`, and sees a signed-in account state.
- An uninvited email address cannot receive a learner claim or access a private portal state.
- The browser does not choose a role; learner, instructor, and admin navigation comes only from server-issued claims.
- Failed activation blocks private-area access rather than falling back to a Firebase UID.

## Phase 2 — Cohort operations

Build the admin workflow for converting interest leads into paid, confirmed places: session creation, enrolment, manual payment confirmation, account invitation, capacity enforcement, and an auditable roster.

## Phase 3 — Learner practice and instructor close-out

Replace static portal data with server-authorised learner records. Persist the four-week practice card, support learner submission, instructor review and feedback, attendance, and truthful learning records.

## Phase 4 — Pilot release

Configure and verify Firebase Authentication, Functions, Firestore Rules, Storage Rules, Resend, the first administrator, and an internal end-to-end pilot before accepting a paid cohort.

## Deliberately deferred

- Automated payment processing.
- A public calendar before demand is proven.
- Public or direct Storage access to learner materials.
- Brew 102 content, SeduhID migration, and advanced reporting.
- Any implication that Brew 101 attendance or practice approval is a credential or certification.
