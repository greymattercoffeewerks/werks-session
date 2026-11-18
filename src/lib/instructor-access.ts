import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { firestore } from './firebase';
import type { OfferingKind } from '../types';
import { hasPracticeRecord, parseOfferingKind } from './offering';
import { practiceWeek, practiceWeekIds, type PracticeWeek, type PracticeWeekId, type PracticeWeeks } from './practice';

export type InstructorReview = {
  learnerUid: string;
  weekId: PracticeWeekId;
  week: PracticeWeek;
  weeks: PracticeWeeks;
};

/** A week the instructor already approved or returned, kept so the decision stays visible. */
export type InstructorHistoryEntry = {
  learnerUid: string;
  weekId: PracticeWeekId;
  week: PracticeWeek;
  decision: 'approved' | 'returned';
  reviewerNote: string;
  reviewedAt?: unknown;
};

export type InstructorSession = {
  id: string;
  title: string;
  /** Set by staff on the session document. Null for sessions seeded before the field existed. */
  offeringId: OfferingKind | null;
  reviews: InstructorReview[];
  history: InstructorHistoryEntry[];
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

/** Firestore timestamps expose toMillis; anything else sorts as unknown and keeps its order. */
function reviewedMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    const millis = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(millis) ? millis : 0;
  }
  return 0;
}

function newestFirst(history: InstructorHistoryEntry[]): InstructorHistoryEntry[] {
  return [...history].sort((a, b) => reviewedMillis(b.reviewedAt) - reviewedMillis(a.reviewedAt));
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
    const offeringId: OfferingKind | null = parseOfferingKind(sessionOffering);
    // Only Brew 101 has practice records to review; Public Cupping has a night record instead.
    const challenges = !hasPracticeRecord(offeringId) ? { docs: [] } : await getDocs(collection(database, 'sessions', sessionId, 'challenges'));
    const reviews: InstructorReview[] = [];
    const history: InstructorHistoryEntry[] = [];
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
        if (week.status === 'approved' || week.status === 'returned') {
          history.push({
            learnerUid,
            weekId,
            week,
            decision: week.status,
            reviewerNote: week.reviewerNote ?? '',
            ...(week.reviewedAt ? { reviewedAt: week.reviewedAt } : {}),
          });
        }
      });
    });

    return { id: sessionId, title: nonBlankString(title) ? title : 'Assigned session', offeringId, reviews, history: newestFirst(history) };
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
