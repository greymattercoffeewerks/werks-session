# Spark access grants

This is the manually operated trust boundary for the Firebase Spark MVP. It replaces the previous custom-claim and callable-Function model for direct Firestore access.

## Important constraints

- Create and edit these documents only in Firebase Console using a staff-controlled account. Browser clients must never write them.
- Use the Firebase Authentication UID as the document key. Keep the provider-neutral `personId` as a field, assigned by staff.
- Authentication is not enrolment. A signed-in person has no private access until the required grant and confirmed enrolment documents exist.
- Do not deploy these Rules until the first staff-controlled account and manual documents are ready to test.

## Required documents

### `access_grants/{uid}`

```json
{
  "personId": "person-123",
  "role": "learner",
  "status": "active"
}
```

Valid roles are `learner`, `instructor`, and `admin`. Only active grants are authorised. The Rules allow a person to read only their own grant; no browser client can create, update, or list grants.

### `enrolments/{sessionId}_{uid}`

```json
{
  "sessionId": "brew101-01",
  "uid": "firebase-auth-uid",
  "personId": "person-123",
  "status": "confirmed"
}
```

Create this only after payment and a place are confirmed. A learner requires it before reading, creating, or updating their challenge for that session.

The learner portal can query only confirmed enrolments whose Firebase UID and provider-neutral `personId` match the active access grant. Pending or mismatched enrolments cannot be read or listed by the learner browser.

### `teaching_assignments/{sessionId}_{uid}`

```json
{
  "sessionId": "brew101-01",
  "uid": "firebase-auth-uid",
  "status": "active"
}
```

An instructor needs an active assignment before viewing or reviewing that session's learner challenges. Administrators have access across sessions.

## Challenge path and permitted changes

Practice is stored at `sessions/{sessionId}/challenges/{learnerUid}`. A learner can create an `in_progress` challenge and edit only their practice weeks. The learner portal starts a blank four-week record, saves drafts, and enables submission only after all four weeks contain a focus, coffee, recipe, tasting note, change made, and a completed flag. Once submitted, only an assigned instructor or administrator can set it to `approved` or `returned` and add review feedback. Neither party can change its owner, session, or provider-neutral person mapping.

Session documents are not a public calendar. A confirmed learner can read only a session for which they have an enrolment; an assigned instructor or administrator can read the session they operate. Public offer copy remains static on Firebase Hosting.

## Deliberately manual work

Payment, capacity, attendance, course materials, private resource delivery, account recovery, and grant seeding remain staff-operated while the project is on Spark. Do not add a client-side shortcut around those boundaries.
