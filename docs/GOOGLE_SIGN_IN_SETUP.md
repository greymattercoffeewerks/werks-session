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
- **Granted:** not part of Phase 2.1. It begins only after the live Firestore Rules and manual grant workflow have been proved.

## Pre-release check

- Test Google sign-in and sign-out on `https://werks-session.web.app`.
- Confirm the new Firebase Authentication user has no Firestore data access before a staff grant exists.
- Do not deploy Firestore Rules until the first staff-controlled learner and instructor records are ready for the live grant test.
