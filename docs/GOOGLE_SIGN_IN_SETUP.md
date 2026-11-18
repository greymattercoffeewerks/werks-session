# Google Sign-In setup for Spark

This document covers only the Phase 2.1 identity foundation. Authentication proves who is using the browser; it does not grant a learner a place, role, session, or course material.

## One-time Firebase Console setup

1. In Firebase project `werks-session`, open **Authentication** and enable the **Google** provider.
2. Use the support email and project-facing name that staff want learners to see. Do not add a broad OAuth scope.
3. Confirm `werks-session.web.app` and `werks-session.firebaseapp.com` remain in Authentication's authorised domains. Add a custom domain only when it is actually attached to Hosting.
4. Publish the Hosting build, then use a staff-controlled Google account to complete one sign-in.

The checked-in Firebase web-app configuration is public client configuration, not a service credential. It identifies `Werks Sessions Portal` (`1:558755925947:web:d9158b18d7351135763e9e`) and is intentionally safe to send to the browser.

## Expected account states

- **Signed out:** the learner can select Google and is told that signing in does not create access.
- **Signed in, pending:** the learner sees no course or cohort data. Staff separately confirm the booking and create the manual documents described in `SPARK_ACCESS_GRANTS.md`.
- **Granted:** implemented after Phase 2.1. A learner with an active grant and a confirmed enrolment sees only their confirmed sessions, guide, and practice record; staff create those documents as described in `SPARK_ACCESS_GRANTS.md`.

## Pre-release check (completed 2026-10-17, re-run after identity changes)

- Google sign-in and sign-out work on `https://werks-session.web.app`; the owner re-confirmed a live sign-in on 2026-11-18.
- A new Firebase Authentication user has no Firestore data access before a staff grant exists.
- Firestore Rules were released on 2026-10-17 once the first staff-controlled learner and instructor records were ready for the live grant test. Re-run this check whenever the provider, authorised domains, or Rules change.
