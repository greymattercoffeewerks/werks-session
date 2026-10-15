# Project Memory

## Product

Werks Sessions is Grey Matter Coffee Werks' hands-on coffee learning and operations portal. The initial offers are Public Cupping and Brew 101. Attendance, practice completion, and future credentials are distinct record types.

## Architecture

- React 18 and Vite frontend in `src/`.
- Firebase Authentication, Callable Functions, Firestore, Storage, Hosting, and Emulator Suite.
- Firebase project configuration currently names `werks-session`.
- Firebase is a temporary identity provider. Records use provider-neutral `person_id` values to support a future SeduhID/Supabase handoff.

## Security invariants

- Browser code never authorizes privileged actions.
- Callable Functions authorize from verified Firebase custom claims.
- Firestore and Storage Rules deny unmatched access.
- Private resources are delivered with a server-created short-lived URL only after enrolment eligibility is checked.
- No secrets belong in Git. `.env.example` contains placeholders only.

## Current operational constraint

The configured Firebase Console project could not be opened by the active Google account on 2026-10-15. Treat project-ID/account access confirmation as a release prerequisite; emulator checks remain valid for local and CI verification.
