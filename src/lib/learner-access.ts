import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './firebase';
import type { OfferingKind } from '../types';

export type ConfirmedSession = {
  id: string;
  title: string;
  /** Set by staff on the session document. Null for sessions seeded before the field existed. */
  offeringId: OfferingKind | null;
};

export type LearnerAccess =
  | { state: 'pending' }
  | { state: 'confirmed'; sessions: ConfirmedSession[] };

function nonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Reads staff-created, learner-visible records only. Firestore Rules remain the
 * authority: client-side values are used only to form direct reads for display.
 */
export async function loadLearnerAccess(uid: string): Promise<LearnerAccess> {
  const database = firestore;
  if (!database) {
    throw new Error('Firebase is not configured.');
  }

  const grant = await getDoc(doc(database, 'access_grants', uid));
  if (!grant.exists()) {
    return { state: 'pending' };
  }

  const grantData = grant.data();
  if (grantData.status !== 'active' || !nonBlankString(grantData.personId)) {
    return { state: 'pending' };
  }

  const enrolments = await getDocs(query(
    collection(database, 'enrolments'),
    where('uid', '==', uid),
    where('personId', '==', grantData.personId),
    where('status', '==', 'confirmed'),
  ));

  const sessions = await Promise.all(enrolments.docs.map(async (enrolment) => {
    const sessionId = enrolment.data().sessionId;
    if (!nonBlankString(sessionId)) {
      return null;
    }

    const session = await getDoc(doc(database, 'sessions', sessionId));
    if (!session.exists()) {
      return null;
    }

    const { title, offeringId } = session.data();
    return {
      id: session.id,
      title: nonBlankString(title) ? title : 'Confirmed session',
      offeringId: offeringId === 'cupping' || offeringId === 'brew101' ? offeringId : null,
    };
  }));

  return { state: 'confirmed', sessions: sessions.filter((session): session is ConfirmedSession => session !== null) };
}
