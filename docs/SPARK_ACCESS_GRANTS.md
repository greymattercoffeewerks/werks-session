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

Practice is stored at `sessions/{sessionId}/challenges/{learnerUid}`. A learner can create an `in_progress` challenge and edit only their practice weeks. The learner portal starts a blank four-week record and saves each week as a draft. A learner may submit a week independently after that week contains a focus, coffee, recipe, tasting note, change made, and completed flag. A submitted week is locked to the learner while the other weeks remain drafts.

An assigned instructor can list only the active teaching assignments that belong to their own Firebase UID. Their review queue displays only submitted weeks from those sessions. Each review must target exactly one submitted week, preserve the learner’s observation, include non-blank feedback, and mark that week `approved` or `returned`. An approved week remains locked. A returned week retains the feedback, and the learner may revise it and submit it again. Neither party can change the challenge owner, session, or provider-neutral person mapping.

The current Spark document shape keeps all four weeks in one learner-owned challenge document. Firestore cannot authorize fields independently, so an assigned instructor’s session-level read is trusted access to that document; the portal queue deliberately displays only submitted weeks. If cohort policy requires drafts to be hidden from instructors at the database layer, split each week into a separate document before operating with multiple instructors.

Session documents are not a public calendar. A confirmed learner can read only a session for which they have an enrolment; an assigned instructor or administrator can read the session they operate. Public offer copy remains static on Firebase Hosting.

## Deliberately manual work

Payment, capacity, attendance, course materials, private resource delivery, account recovery, and grant seeding remain staff-operated while the project is on Spark. Do not add a client-side shortcut around those boundaries.
