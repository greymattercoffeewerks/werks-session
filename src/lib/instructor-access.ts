import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { firestore } from './firebase';
import type { OfferingKind } from '../types';
import { practiceWeek, practiceWeekIds, type PracticeWeek, type PracticeWeekId, type PracticeWeeks } from './practice';

export type InstructorReview = {
  learnerUid: string;
  weekId: PracticeWeekId;
  week: PracticeWeek;
  weeks: PracticeWeeks;
};

export type InstructorSession = {
  id: string;
  title: string;
  /** Set by staff on the session document. Null for sessions seeded before the field existed. */
  offeringId: OfferingKind | null;
  reviews: InstructorReview[];
};

export type InstructorAccess =
  | { state: 'not_instructor' }
  | { state: 'assigned'; sessions: InstructorSession[] };

export type ReviewDecision = 'approved' | 'returned';

function nonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function databaseOrThrow() {
  if (!firestore) {
    throw new Error('Firebase is not configured.');
  }
  return firestore;
}

export async function loadInstructorAccess(uid: string): Promise<InstructorAccess> {
  const database = databaseOrThrow();
  const grant = await getDoc(doc(database, 'access_grants', uid));
  if (!grant.exists() || grant.data().status !== 'active' || grant.data().role !== 'instructor') {
    return { state: 'not_instructor' };
  }

  const assignments = await getDocs(query(
    collection(database, 'teaching_assignments'),
    where('uid', '==', uid),
    where('status', '==', 'active'),
  ));

  const sessions = await Promise.all(assignments.docs.map(async (assignment) => {
    const sessionId = assignment.data().sessionId;
    if (!nonBlankString(sessionId)) {
      return null;
    }

    const session = await getDoc(doc(database, 'sessions', sessionId));
    if (!session.exists()) {
      return null;
    }

    const { title, offeringId: sessionOffering } = session.data();
    const offeringId: OfferingKind | null = sessionOffering === 'cupping' || sessionOffering === 'brew101' ? sessionOffering : null;
    // Public Cupping sessions have no practice records to review; they have a night record instead.
    const challenges = offeringId === 'cupping' ? { docs: [] } : await getDocs(collection(database, 'sessions', sessionId, 'challenges'));
    const reviews: InstructorReview[] = [];
    challenges.docs.forEach((challenge) => {
      const data = challenge.data();
      const learnerUid = data.ownerUid;
      const sourceWeeks = data.weeks && typeof data.weeks === 'object' ? data.weeks as Record<string, unknown> : {};
      const weeks = {
        week1: practiceWeek(sourceWeeks.week1),
        week2: practiceWeek(sourceWeeks.week2),
        week3: practiceWeek(sourceWeeks.week3),
        week4: practiceWeek(sourceWeeks.week4),
      };
      if (!nonBlankString(learnerUid)) {
        return;
      }
      practiceWeekIds.forEach((weekId) => {
        const week = weeks[weekId];
        if (week.status === 'submitted') {
          reviews.push({ learnerUid, weekId, week, weeks });
        }
      });
    });

    return { id: sessionId, title: nonBlankString(title) ? title : 'Assigned session', offeringId, reviews };
  }));

  return { state: 'assigned', sessions: sessions.filter((session): session is InstructorSession => session !== null) };
}

export async function reviewPracticeWeek(
  sessionId: string,
  learnerUid: string,
  weekId: PracticeWeekId,
  weeks: PracticeWeeks,
  decision: ReviewDecision,
  reviewerNote: string,
): Promise<void> {
  const trimmedNote = reviewerNote.trim();
  if (!trimmedNote) {
    throw new Error('Feedback is required before review.');
  }

  await updateDoc(doc(databaseOrThrow(), 'sessions', sessionId, 'challenges', learnerUid), {
    // Rules require reviewedAt to equal the server time of every review, so the client must send the sentinel.
    weeks: { ...weeks, [weekId]: { ...weeks[weekId], status: decision, reviewerNote: trimmedNote, reviewedAt: serverTimestamp() } },
    updatedAt: serverTimestamp(),
  });
}
