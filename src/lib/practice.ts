import { collection, doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from './firebase';

export const practiceWeekIds = ['week1', 'week2', 'week3', 'week4'] as const;
export type PracticeWeekId = (typeof practiceWeekIds)[number];

export type PracticeWeek = {
  focus: string;
  coffee: string;
  recipe: string;
  tastingNote: string;
  changeMade: string;
  complete: boolean;
  status: 'draft' | 'submitted' | 'returned' | 'approved';
  reviewerNote?: string;
  reviewedAt?: unknown;
};

export type PracticeWeeks = Record<PracticeWeekId, PracticeWeek>;

export type PracticeChallenge = {
  status: 'in_progress' | 'returned' | 'submitted';
  weeks: PracticeWeeks;
};

const weekTemplate = (): PracticeWeek => ({
  focus: '',
  coffee: '',
  recipe: '',
  tastingNote: '',
  changeMade: '',
  complete: false,
  status: 'draft',
});

export function emptyPracticeWeeks(): PracticeWeeks {
  return {
    week1: weekTemplate(),
    week2: weekTemplate(),
    week3: weekTemplate(),
    week4: weekTemplate(),
  };
}

function nonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function practiceWeek(value: unknown): PracticeWeek {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const status =
    source.status === 'submitted' || source.status === 'returned' || source.status === 'approved'
      ? source.status
      : 'draft';
  return {
    focus: nonBlankString(source.focus) ? source.focus : '',
    coffee: nonBlankString(source.coffee) ? source.coffee : '',
    recipe: nonBlankString(source.recipe) ? source.recipe : '',
    tastingNote: nonBlankString(source.tastingNote) ? source.tastingNote : '',
    changeMade: nonBlankString(source.changeMade) ? source.changeMade : '',
    complete: source.complete === true,
    status,
    ...(nonBlankString(source.reviewerNote) ? { reviewerNote: source.reviewerNote } : {}),
    ...(source.reviewedAt ? { reviewedAt: source.reviewedAt } : {}),
  };
}

function databaseOrThrow() {
  if (!firestore) {
    throw new Error('Firebase is not configured.');
  }
  return firestore;
}

/** One document per week, with a small header document per learner and session. */
function challengeRef(sessionId: string, uid: string) {
  return doc(databaseOrThrow(), 'sessions', sessionId, 'challenges', uid);
}

function weekRef(sessionId: string, uid: string, weekId: PracticeWeekId) {
  return doc(collection(challengeRef(sessionId, uid), 'weeks'), weekId);
}

function weekPayload(week: PracticeWeek, status: PracticeWeek['status']) {
  return {
    focus: week.focus,
    coffee: week.coffee,
    recipe: week.recipe,
    tastingNote: week.tastingNote,
    changeMade: week.changeMade,
    complete: week.complete,
    status,
    updatedAt: serverTimestamp(),
  };
}

export async function loadPracticeChallenge(sessionId: string, uid: string): Promise<PracticeChallenge | null> {
  const header = await getDoc(challengeRef(sessionId, uid));
  if (!header.exists()) {
    return null;
  }

  const snapshots = await Promise.all(practiceWeekIds.map((weekId) => getDoc(weekRef(sessionId, uid, weekId))));
  const weeks = emptyPracticeWeeks();
  snapshots.forEach((snapshot, index) => {
    if (snapshot.exists()) {
      weeks[practiceWeekIds[index]] = practiceWeek(snapshot.data());
    }
  });

  const statuses = practiceWeekIds.map((weekId) => weeks[weekId].status);
  const status = statuses.includes('submitted')
    ? 'submitted'
    : statuses.includes('returned')
      ? 'returned'
      : 'in_progress';

  return { status, weeks };
}

export async function startPracticeChallenge(sessionId: string, uid: string): Promise<PracticeChallenge> {
  const database = databaseOrThrow();
  const grant = await getDoc(doc(database, 'access_grants', uid));
  const personId = grant.exists() ? grant.data().personId : null;
  if (grant.data()?.status !== 'active' || !nonBlankString(personId)) {
    throw new Error('Learner access is not active.');
  }

  const batch = writeBatch(database);
  batch.set(challengeRef(sessionId, uid), {
    sessionId,
    ownerUid: uid,
    personId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  practiceWeekIds.forEach((weekId) => {
    batch.set(weekRef(sessionId, uid, weekId), {
      sessionId,
      learnerUid: uid,
      weekId,
      ...weekTemplate(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();

  return { status: 'in_progress', weeks: emptyPracticeWeeks() };
}

export async function savePracticeWeek(
  sessionId: string,
  uid: string,
  weekId: PracticeWeekId,
  week: PracticeWeek,
): Promise<void> {
  await updateDoc(weekRef(sessionId, uid, weekId), weekPayload(week, 'draft'));
}

export async function submitPracticeWeek(
  sessionId: string,
  uid: string,
  weekId: PracticeWeekId,
  week: PracticeWeek,
): Promise<void> {
  await updateDoc(weekRef(sessionId, uid, weekId), {
    ...weekPayload(week, 'submitted'),
    submittedAt: serverTimestamp(),
  });
}
