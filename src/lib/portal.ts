import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { LearningResource } from '../types';

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

/** The server checks an eligible enrolment before returning short-lived links. */
export async function listMyLearningResources(): Promise<LearningResource[]> {
  if (!functions) return [];
  const result = await httpsCallable<void, { resources: LearningResource[] }>(functions, 'listMyLearningResources')();
  return result.data.resources;
}
