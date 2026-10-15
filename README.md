# Werks Sessions

Werks Sessions is Grey Matter Coffee Werks' operating and learning portal for small, hands-on coffee education. The first release supports Public Cupping and Brew 101—from interest through confirmed attendance and the Brew 101 30-day practice card.

## What is implemented

- Public offering and interest-list experience without an account wall.
- Learner, instructor, and admin portal views.
- Manual payment / enrolment workflow, instructor attendance, and truthful learning-record states.
- Four-week Brew 101 challenge with instructor approval as the Brew 102 eligibility gate.
- Dedicated Firebase backend configuration: Hosting, Auth, Firestore rules, callable Functions, and emulator settings.
- Provider-neutral `person_id` records so Firebase email-link login can later hand over to SeduhID on Supabase.

## Local setup

1. Copy `.env.example` to `.env` and enter the dedicated Education Firebase web-app configuration.
2. Install root dependencies: `npm.cmd install`.
3. Install Functions dependencies: `npm.cmd install --prefix functions`.
4. Run `npm.cmd run dev` for the interface or `npm.cmd run build` for a production build.

The app remains safe to preview without `.env`: it renders realistic demonstration data but sends no Firebase requests.

## Firebase setup before deployment

1. Create and select the dedicated Education Firebase project: `npm.cmd run firebase:use`.
2. Enable Email Link sign-in in Firebase Authentication.
3. Configure `RESEND_API_KEY` as a Functions secret and verify the sender domain before enabling transactional email.
4. Deploy Firestore rules, Functions, and Hosting after testing with the Firebase Emulator Suite.
5. Bootstrap the first administrator by adding `role: "admin"` and a provider-neutral `person_id` custom claim in Firebase Auth; all further sensitive actions are protected by those claims.

## SeduhID handoff

Firebase is temporary for portal sign-in. Every Education record is keyed by a provider-neutral `person_id`, while `identity_links` stores the temporary Firebase mapping. When SeduhID is live on Supabase, its verified `person_id` becomes the central identity; a server-side token bridge will exchange a valid Supabase session for a Firebase custom token so existing Firestore rules remain intact during transition.

Do not publish Brew 101 as a competency credential. `attended` and `challenge_complete` are distinct record types; `credential` is reserved for future assessed, licensed delivery.
