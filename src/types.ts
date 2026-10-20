export type Role = 'admin' | 'instructor' | 'learner';
export type OfferingKind = 'cupping' | 'brew101' | 'barista101';
export type SessionStatus = 'interest' | 'proposed' | 'confirmed' | 'completed' | 'cancelled';
export type EnrolmentStatus = 'interested' | 'invited' | 'confirmed' | 'attended' | 'withdrawn' | 'no_show';
export type PaymentStatus = 'pending' | 'deposit_paid' | 'paid' | 'refunded';
export type RecordType = 'attended' | 'challenge_complete' | 'credential';
export type ResourceFormat = 'guide' | 'worksheet' | 'recipe_card';

export interface Actor { personId: string; role: Role; displayName: string; email: string; }
/** Public-safe summary of an evening. The full guide is learner-only and never ships in this bundle. */
export interface OfferingTeaser { summary: string; lead: string; beats: string[]; note: string; }
export interface Offering { id: OfferingKind; title: string; eyebrow: string; description: string; format: string; price: string; capacity: string; outcomes: string[]; teaser?: OfferingTeaser; }
export interface Session { id: string; offeringId: OfferingKind; title: string; startsAt: string; venue: string; capacity: number; minimum: number; confirmedSeats: number; status: SessionStatus; instructorName: string; }
export interface Enrolment { id: string; sessionId: string; personId: string; offeringId: OfferingKind; status: EnrolmentStatus; paymentStatus: PaymentStatus; accountInviteSent: boolean; }
export interface ChallengeWeek { week: number; focus: string; coffee: string; recipe: string; tastingNote: string; changeMade: string; complete: boolean; }
export interface Challenge { id: string; personId: string; status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'returned'; weeks: ChallengeWeek[]; reviewerNote?: string; }
export interface LearningRecord { id: string; personId: string; title: string; type: RecordType; issuedAt: string; issuer: string; }
/** A short-lived, server-authorised download. Never store a public Storage URL here. */
export interface LearningResource { id: string; title: string; description: string; format: ResourceFormat; updatedAt: string; downloadUrl: string; }
