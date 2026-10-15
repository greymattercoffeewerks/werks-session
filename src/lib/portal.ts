import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface InterestPayload {
  offeringId: 'cupping' | 'brew101';
  name: string;
  email: string;
  whatsapp: string;
  marketingConsent: boolean;
}

export async function submitInterest(payload: InterestPayload): Promise<void> {
  if (!functions) return;
  await httpsCallable<InterestPayload, { ok: boolean }>(functions, 'submitInterest')(payload);
}
