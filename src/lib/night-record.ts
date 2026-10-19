import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { parseNightRecord, type NightRecord } from './night-record-model';

function databaseOrThrow() {
  if (!firestore) {
    throw new Error('Firebase is not configured.');
  }
  return firestore;
}

function nightRecordRef(sessionId: string) {
  return doc(databaseOrThrow(), 'sessions', sessionId, 'night_record', 'main');
}

export async function loadNightRecord(sessionId: string): Promise<NightRecord | null> {
  const snapshot = await getDoc(nightRecordRef(sessionId));
  return snapshot.exists() ? parseNightRecord(snapshot.data()) : null;
}

/**
 * Creates or updates the record. The Rules require the host and creation time to stay unchanged on update,
 * so the loaded values are sent back as they were; a new record is stamped with the signed-in host.
 */
export async function saveNightRecord(sessionId: string, uid: string, record: NightRecord): Promise<void> {
  const clean = parseNightRecord(record);
  const isUpdate = Boolean(record.createdAt && record.hostUid);
  await setDoc(nightRecordRef(sessionId), {
    sessionId,
    hostUid: isUpdate ? record.hostUid : uid,
    status: clean.status,
    date: clean.date,
    theme: clean.theme,
    host: clean.host,
    guests: clean.guests,
    redeemed: clean.redeemed,
    flight: clean.flight,
    seats: clean.seats,
    tally: clean.tally,
    words: clean.words,
    notes: clean.notes,
    createdAt: isUpdate ? record.createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
