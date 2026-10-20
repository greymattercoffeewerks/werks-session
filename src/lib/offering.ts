import type { OfferingKind } from '../types';

export const offeringKinds: readonly OfferingKind[] = ['cupping', 'brew101', 'barista101'];

/** Narrows an untrusted value from Firestore to a known offering, or null when it is missing or unknown. */
export function parseOfferingKind(value: unknown): OfferingKind | null {
  return offeringKinds.find((kind) => kind === value) ?? null;
}

/**
 * Only Brew 101 has the four-week practice record. Sessions seeded before `offeringId` existed keep the
 * Brew 101 experience they already had; Public Cupping and Barista 101 do not get a practice record.
 */
export function hasPracticeRecord(offeringId: OfferingKind | null | undefined): boolean {
  return offeringId !== 'cupping' && offeringId !== 'barista101';
}
