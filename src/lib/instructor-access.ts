import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { OfferingKind } from '../types';
import { hasPracticeRecord, parseOfferingKind } from './offering';
import { practiceWeek, practiceWeekIds, type PracticeWeek, type PracticeWeekId } from './practice';

/** The queue and history load ten weeks at a time. */
export const reviewPageSize = 10;
// Each session in the collection-group query makes the Rules read its assignment document, and
// a list request may perform only 20 document accesses, so the query is capped at eight.
const maxSessionsPerQuery = 8;

export type InstructorReview = {
  sessionId: string;
  learnerUid: string;
  weekId: PracticeWeekId;
  week: PracticeWeek;
};

/** A week the instructor already approved or returned. */
export type InstructorHistoryEntry = {
  sessionId: string;
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
};

export type InstructorAccess =
  | { state: 'not_instructor' }
  | {
      state: 'assigned';
      sessions: InstructorSession[];
      reviews: InstructorReview[];
      history: InstructorHistoryEntry[];
      reviewCursor: QueryDocumentSnapshot | null;
      historyCursor: QueryDocumentSnapshot | null;
      reviewHasMore: boolean;
      historyHasMore: boolean;
    };

export type InstructorReport = 'approved' | 'returned';

function nonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function databaseOrThrow() {
  if (!firestore) {
    throw new Error('Firebase is not configured.');
  }
  return firestore;
}

function sessionIdsForQuery(sessions: InstructorSession[]): string[] {
  // Practice sessions come first so the 30-session query cap cannot hide the review queue.
  return [...sessions]
    .sort((a, b) => Number(hasPracticeRecord(b.offeringId)) - Number(hasPracticeRecord(a.offeringId)))
    .map((session) => session.id)
    .slice(0, maxSessionsPerQuery);
}

function parseWeek(
  snapshot: QueryDocumentSnapshot,
): { sessionId: string; learnerUid: string; weekId: PracticeWeekId; week: PracticeWeek } | null {
  const data = snapshot.data();
  const sessionId = data.sessionId;
  const learnerUid = data.learnerUid;
  const weekId = data.weekId;
  if (
    !nonBlankString(sessionId) ||
    !nonBlankString(learnerUid) ||
    !practiceWeekIds.includes(weekId as PracticeWeekId)
  ) {
    return null;
  }
  return { sessionId, learnerUid, weekId: weekId as PracticeWeekId, week: practiceWeek(data) };
}

function queueQuery(sessionIds: string[], cursor: QueryDocumentSnapshot | null) {
  const constraints: QueryConstraint[] = [
    where('sessionId', 'in', sessionIds),
    where('status', '==', 'submitted'),
    orderBy('submittedAt', 'desc'),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(reviewPageSize + 1));
  return query(collectionGroup(db(), 'weeks'), ...constraints);
}

function historyQuery(sessionIds: string[], cursor: QueryDocumentSnapshot | null) {
  const constraints: QueryConstraint[] = [
    where('sessionId', 'in', sessionIds),
    where('status', 'in', ['approved', 'returned']),
    orderBy('reviewedAt', 'desc'),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(reviewPageSize + 1));
  return query(collectionGroup(db(), 'weeks'), ...constraints);
}

function db() {
  return databaseOrThrow();
}

export async function loadInstructorAccess(uid: string): Promise<InstructorAccess> {
  const database = databaseOrThrow();
  const grant = await getDoc(doc(database, 'access_grants', uid));
  if (!grant.exists() || grant.data().status !== 'active' || grant.data().role !== 'instructor') {
    return { state: 'not_instructor' };
  }

  const assignments = await getDocs(
    query(collection(database, 'teaching_assignments'), where('uid', '==', uid), where('status', '==', 'active')),
  );

  const sessions = await Promise.all(
    assignments.docs.map(async (assignment) => {
      const sessionId = assignment.data().sessionId;
      if (!nonBlankString(sessionId)) {
        return null;
      }
      const session = await getDoc(doc(database, 'sessions', sessionId));
      if (!session.exists()) {
        return null;
      }
      const { title, offeringId } = session.data();
      return {
        id: sessionId,
        title: nonBlankString(title) ? title : 'Assigned session',
        offeringId: parseOfferingKind(offeringId),
      };
    }),
  );

  const assigned = sessions.filter((session): session is InstructorSession => session !== null);
  const ids = sessionIdsForQuery(assigned);
  if (ids.length === 0) {
    return {
      state: 'assigned',
      sessions: assigned,
      reviews: [],
      history: [],
      reviewCursor: null,
      historyCursor: null,
      reviewHasMore: false,
      historyHasMore: false,
    };
  }

  const [reviewResult, historyResult] = await Promise.allSettled([
    getDocs(queueQuery(ids, null)),
    getDocs(historyQuery(ids, null)),
  ]);
  if (reviewResult.status === 'rejected' && historyResult.status === 'rejected') {
    throw reviewResult.reason;
  }
  const reviews =
    reviewResult.status === 'fulfilled'
      ? reviewsPage(reviewResult.value.docs)
      : { reviews: [], cursor: null, hasMore: false };
  const history =
    historyResult.status === 'fulfilled'
      ? historyPage(historyResult.value.docs)
      : { history: [], cursor: null, hasMore: false };

  return {
    state: 'assigned',
    sessions: assigned,
    reviews: reviews.reviews,
    history: history.history,
    reviewCursor: reviews.cursor,
    historyCursor: history.cursor,
    reviewHasMore: reviews.hasMore,
    historyHasMore: history.hasMore,
  };
}

type ReviewsPage = { reviews: InstructorReview[]; cursor: QueryDocumentSnapshot | null; hasMore: boolean };
type HistoryPage = { history: InstructorHistoryEntry[]; cursor: QueryDocumentSnapshot | null; hasMore: boolean };

/** The query fetches one row beyond the page so "Load more" can hide on the last page. */
function reviewsPage(docs: QueryDocumentSnapshot[]): ReviewsPage {
  const page = docs.slice(0, reviewPageSize);
  return {
    reviews: page.map(parseWeek).filter((entry): entry is InstructorReview => entry !== null),
    cursor: page.at(-1) ?? null,
    hasMore: docs.length > reviewPageSize,
  };
}

function historyPage(docs: QueryDocumentSnapshot[]): HistoryPage {
  const page = docs.slice(0, reviewPageSize);
  return {
    history: page
      .map((snapshot) => {
        const entry = parseWeek(snapshot);
        const status = snapshot.data().status;
        const reviewerNote = snapshot.data().reviewerNote;
        if (!entry || (status !== 'approved' && status !== 'returned') || !nonBlankString(reviewerNote)) {
          return null;
        }
        return {
          ...entry,
          decision: status,
          reviewerNote,
          ...(snapshot.data().reviewedAt ? { reviewedAt: snapshot.data().reviewedAt } : {}),
        };
      })
      .filter((entry): entry is InstructorHistoryEntry => entry !== null),
    cursor: page.at(-1) ?? null,
    hasMore: docs.length > reviewPageSize,
  };
}

export async function loadMoreReviews(sessionIds: string[], cursor: QueryDocumentSnapshot): Promise<ReviewsPage> {
  const ids = sessionIds.slice(0, maxSessionsPerQuery);
  if (ids.length === 0) return { reviews: [], cursor: null, hasMore: false };
  const page = await getDocs(queueQuery(ids, cursor));
  return reviewsPage(page.docs);
}

export async function loadMoreHistory(sessionIds: string[], cursor: QueryDocumentSnapshot): Promise<HistoryPage> {
  const ids = sessionIds.slice(0, maxSessionsPerQuery);
  if (ids.length === 0) return { history: [], cursor: null, hasMore: false };
  const page = await getDocs(historyQuery(ids, cursor));
  return historyPage(page.docs);
}

export async function reviewPracticeWeek(
  sessionId: string,
  learnerUid: string,
  weekId: PracticeWeekId,
  decision: InstructorReport,
  reviewerNote: string,
): Promise<void> {
  const trimmedNote = reviewerNote.trim();
  if (!trimmedNote) {
    throw new Error('Feedback is required before review.');
  }

  await updateDoc(doc(databaseOrThrow(), 'sessions', sessionId, 'challenges', learnerUid, 'weeks', weekId), {
    status: decision,
    reviewerNote: trimmedNote,
    // Rules require reviewedAt to equal the server time of the review.
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
