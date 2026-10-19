import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { maxScheduleItems, parseSchedule, type ScheduleItem } from './schedule-model';

function scheduleRef() {
  if (!firestore) {
    throw new Error('Firebase is not configured.');
  }
  return doc(firestore, 'public_schedule', 'current');
}

/**
 * Reads the published upcoming dates. This is the one document anyone may read without signing in, so a
 * failure (offline, blocked, empty) must never break the front page: it simply shows no dates.
 */
export async function loadPublicSchedule(): Promise<ScheduleItem[]> {
  try {
    const snapshot = await getDoc(scheduleRef());
    return snapshot.exists() ? parseSchedule(snapshot.data().items) : [];
  } catch {
    return [];
  }
}

/**
 * Reads the published dates for editing. Unlike the public read, a failure throws, so the editor never shows an
 * empty list that a save would then use to wipe the real one.
 */
export async function loadPublicScheduleForEditing(): Promise<ScheduleItem[]> {
  const snapshot = await getDoc(scheduleRef());
  return snapshot.exists() ? parseSchedule(snapshot.data().items) : [];
}

/** Publishes the full list in one write. Only an active instructor or admin may; the Rules enforce that. */
export async function savePublicSchedule(items: ScheduleItem[]): Promise<void> {
  await setDoc(scheduleRef(), {
    items: parseSchedule(items).slice(0, maxScheduleItems),
    updatedAt: serverTimestamp(),
  });
}
