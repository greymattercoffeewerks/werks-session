import type { Challenge, Enrolment, LearningRecord, Offering, Session } from '../types';

export const offerings: Offering[] = [
  { id: 'cupping', eyebrow: 'Community tasting', title: 'Public Cupping', description: 'A relaxed blind tasting table for curious coffee drinkers. Taste four coffees side by side, notice what changes, and use the words that already make sense to you.', format: '90 minutes · Noice after hours', price: 'BND 20, redeemable against beans', capacity: '8–12 people', outcomes: ['Taste and compare four coffees with more confidence', 'Find useful words for what you like', 'Take home the coffee you choose'], teaser: { summary: 'How the evening runs', lead: 'Start with what you like. This isn’t a test or a professional score sheet, and your preference is valid before you know a single coffee word.', beats: ['Arrive and settle in over a familiar kopi-o. No lecture.', 'Taste four numbered coffees, blind, and rank them privately.', 'Meet the coffees and compare how the room ranked them.', 'Take home a small sample of your favourite.'], note: 'No experience or equipment needed, and nothing to bring. Confirmed guests receive the full table guide before they come.' } },
  { id: 'brew101', eyebrow: 'Hands-on foundations', title: 'Brew 101', description: 'A practical manual-brew session for people who want to make better coffee at home—without chasing a perfect recipe. Compare cups, understand what changed, and leave with a method you can repeat.', format: '3.5 hours · Noice after hours', price: 'BND 165 group · BND 320 private', capacity: 'Group minimum 2 · maximum 3', outcomes: ['Tell strength and extraction apart in the cup', 'Make one deliberate adjustment and taste its effect', 'Leave with a repeatable recipe and a 30-day practice plan'] },
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
