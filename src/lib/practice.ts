import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

export const practiceWeekIds = ['week1', 'week2', 'week3', 'week4'] as const;
export type PracticeWeekId = typeof practiceWeekIds[number];

export type PracticeWeek = {
  focus: string;
  coffee: string;
  recipe: string;
  tastingNote: string;
  changeMade: string;
  complete: boolean;
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

function practiceWeek(value: unknown): PracticeWeek {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    focus: nonBlankString(source.focus) ? source.focus : '',
    coffee: nonBlankString(source.coffee) ? source.coffee : '',
    recipe: nonBlankString(source.recipe) ? source.recipe : '',
    tastingNote: nonBlankString(source.tastingNote) ? source.tastingNote : '',
    changeMade: nonBlankString(source.changeMade) ? source.changeMade : '',
    complete: source.complete === true,
  };
}

function readChallenge(value: Record<string, unknown>): PracticeChallenge {
  const sourceWeeks = value.weeks && typeof value.weeks === 'object' ? value.weeks as Record<string, unknown> : {};
  const status = value.status === 'submitted' || value.status === 'returned' ? value.status : 'in_progress';
  return {
    status,
    weeks: {
      week1: practiceWeek(sourceWeeks.week1),
      week2: practiceWeek(sourceWeeks.week2),
      week3: practiceWeek(sourceWeeks.week3),
      week4: practiceWeek(sourceWeeks.week4),
    },
  };
}

function databaseOrThrow() {
  if (!firestore) {
    throw new Error('Firebase is not configured.');
  }
  return firestore;
}

function challengeRef(sessionId: string, uid: string) {
  return doc(databaseOrThrow(), 'sessions', sessionId, 'challenges', uid);
}

export async function loadPracticeChallenge(sessionId: string, uid: string): Promise<PracticeChallenge | null> {
  const challenge = await getDoc(challengeRef(sessionId, uid));
  return challenge.exists() ? readChallenge(challenge.data()) : null;
}

export async function startPracticeChallenge(sessionId: string, uid: string): Promise<PracticeChallenge> {
  const database = databaseOrThrow();
  const grant = await getDoc(doc(database, 'access_grants', uid));
  const personId = grant.exists() ? grant.data().personId : null;
  if (grant.data()?.status !== 'active' || !nonBlankString(personId)) {
    throw new Error('Learner access is not active.');
  }

  const challenge: PracticeChallenge = { status: 'in_progress', weeks: emptyPracticeWeeks() };
  await setDoc(challengeRef(sessionId, uid), {
    sessionId,
    ownerUid: uid,
    personId,
    status: challenge.status,
    weeks: challenge.weeks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return challenge;
}

export async function savePracticeChallenge(sessionId: string, uid: string, weeks: PracticeWeeks): Promise<void> {
  await updateDoc(challengeRef(sessionId, uid), {
    weeks,
    status: 'in_progress',
    updatedAt: serverTimestamp(),
  });
}

export async function submitPracticeChallenge(sessionId: string, uid: string, weeks: PracticeWeeks): Promise<void> {
  await updateDoc(challengeRef(sessionId, uid), {
    weeks,
    status: 'submitted',
    updatedAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
  });
}
