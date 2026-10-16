# Werks Sessions Spark MVP Roadmap

## Purpose

Launch a small, premium coffee-learning loop while keeping Firebase on Spark. The product remains Werks Sessions: Public Cupping and Brew 101, not a generic LMS, public calendar, or certification pathway.

## Spark boundaries

- Firebase Hosting, Authentication, and Firestore are available within Spark quotas.
- Cloud Functions, trusted Admin SDK actions, custom-claim issuance, transactional email, Firebase Storage, and signed private downloads are out of scope because they require Blaze.
- Firebase email-link sign-in is not an operational login channel on Spark because its email-send quota is too small for a real offering.

## MVP outcome

One learner can move from public enquiry through staff confirmation, payment, session attendance, and a four-week practice conversation. The initial cohort is intentionally concierge-operated; the portal earns complexity only where it improves the learner or instructor experience.

## Phase 1 - Public enquiry and truthful access state

### Goal

Offer a public, production-safe way to enquire without implying an account system that Spark cannot operate.

### Included

- Firebase Hosting public Sessions and About pages.
- Offering-specific email enquiry, with no Firestore write, automated email, or account creation.
- Learner-access page that explains access follows a confirmed booking.
- Manual staff handling of payment, dates, enrolment, attendance, and private resources.

### Done when

- The public site has no callable-Function dependency.
- It no longer exposes email-link activation or a sign-in promise that cannot be fulfilled.
- An enquiry clearly does not reserve a place or create an account.

## Phase 2 - Manually seeded access grants

### Goal

Prepare a small authenticated portal without Cloud Functions or custom claims.

### Included

- Choose a Spark-suitable sign-in provider; prefer Google Sign-In or email/password over email links.
- Keep every self-created account pending by default.
- Staff manually seed immutable role and enrolment/access-grant documents in Firebase Console after payment and acceptance.
- Rework Firestore schema and Rules so a learner can only read/write their own approved practice data, and staff roles cannot be granted by browser code.
- Retain a provider-neutral `person_id` field, assigned by staff during this interim period.

### Not included

- Automated invitations, payments, capacity transactions, custom claims, or server-side account provisioning.

### Done when

- A pending authenticated account cannot access cohort data.
- A manually granted learner can access only their confirmed data.
- Learners cannot modify role, enrolment, attendance, or instructor-review fields.
- Rules tests cover every allowed direct-client path.

## Phase 3 - Learner practice and instructor close-out

### Goal

Make the Brew 101 follow-through useful without overstating it as assessment or certification.

### Included

- Learner-owned four-week practice entries in Firestore.
- Instructor cohort view, feedback, and review status through a manually seeded staff role.
- Staff-entered attendance and factual learner records, guarded by Rules.

### Not included

- Private course-resource downloads, public Storage URLs, downloadable credentials, or automatic reminders.

## Phase 4 - Small paid pilot

### Goal

Run one manually operated paid cohort end to end.

### Pilot checklist

1. Public enquiry arrives through the Hosting site.
2. Staff confirm payment and place outside the portal.
3. Staff seed the learner access grant and explain the chosen sign-in method.
4. Learner completes one practice entry after Brew 101.
5. Instructor adds feedback; staff records attendance.
6. Private resources are delivered personally, not through Firebase Storage.

## Revisit Blaze only when needed

Move to Blaze when protected downloads, transactional email, server-side invitation activation, custom claims, rate limiting, automated payments, or SeduhID token bridging become necessary for the operating model.
