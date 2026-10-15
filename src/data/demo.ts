import type { Challenge, Enrolment, LearningRecord, Offering, Session } from '../types';

export const offerings: Offering[] = [
  { id: 'cupping', eyebrow: 'Community session', title: 'Public Cupping', description: 'A friendly, blind tasting table. Start with what you like; the vocabulary can come later.', format: '90 minutes · Noice after hours', price: 'BND 20, redeemable against beans', capacity: '8–12 learners', outcomes: ['Rank four coffees with confidence', 'Find the words you already use', 'Take home your favourite coffee'] },
  { id: 'brew101', eyebrow: 'Hands-on foundations', title: 'Brew 101', description: 'A small, practical manual-brew session built around tasting, comparison, and one repeatable recipe.', format: '3.5 hours · Noice after hours', price: 'BND 165 group · BND 320 private', capacity: 'Group minimum 2 · maximum 3', outcomes: ['Separate strength from extraction', 'Diagnose a cup with one change', 'Leave with your own recipe and 30-day practice plan'] },
];

export const sessions: Session[] = [
  { id: 'cupping-range-01', offeringId: 'cupping', title: 'Range Night', startsAt: 'Interest list open', venue: 'Noice, after hours', capacity: 12, minimum: 8, confirmedSeats: 7, status: 'interest', instructorName: 'Firdaus' },
  { id: 'brew101-01', offeringId: 'brew101', title: 'Manual Brew Foundations', startsAt: 'Confirming after two paid seats', venue: 'Noice, after hours', capacity: 3, minimum: 2, confirmedSeats: 1, status: 'proposed', instructorName: 'Firdaus' },
];

export const demoEnrolment: Enrolment = { id: 'enrol-demo', sessionId: 'brew101-01', personId: 'person-demo', offeringId: 'brew101', status: 'confirmed', paymentStatus: 'paid', accountInviteSent: true };
export const demoChallenge: Challenge = { id: 'challenge-demo', personId: 'person-demo', status: 'in_progress', weeks: [
  { week: 1, focus: 'Ratio', coffee: 'ttku', recipe: '15g : 250g · 1:16', tastingNote: 'Sweeter at 1:16 than 1:15.', changeMade: 'Held grind steady.', complete: true },
  { week: 2, focus: 'Grind', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false },
  { week: 3, focus: 'Beans', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false },
  { week: 4, focus: 'Technique', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false },
] };
export const demoRecords: LearningRecord[] = [{ id: 'record-1', personId: 'person-demo', title: 'Public Cupping · Range Night', type: 'attended', issuedAt: '18 September 2026', issuer: 'Grey Matter Coffee Werks' }];
