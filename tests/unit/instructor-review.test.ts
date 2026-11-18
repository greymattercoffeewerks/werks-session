import { afterEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn((...segments: unknown[]) => ({ path: segments.slice(1).join('/') })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => ({ sentinel: 'server-timestamp' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  where: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('../../src/lib/firebase', () => ({ firestore: { name: 'test-firestore' } }));

import { emptyPracticeWeeks } from '../../src/lib/practice';
import { loadInstructorAccess, reviewPracticeWeek } from '../../src/lib/instructor-access';

afterEach(() => vi.clearAllMocks());

describe('loadInstructorAccess', () => {
  it('returns waiting weeks and a newest-first history of reviewed weeks from the same documents', async () => {
    firestoreMock.collection.mockImplementation((...segments: unknown[]) => ({ path: segments.slice(1).join('/') }));
    firestoreMock.query.mockImplementation((ref: unknown) => ref);
    firestoreMock.getDoc.mockImplementation((ref: { path: string }) => {
      if (ref.path.startsWith('access_grants/')) {
        return Promise.resolve({ exists: () => true, data: () => ({ status: 'active', role: 'instructor', personId: 'person-1' }) });
      }
      return Promise.resolve({ exists: () => true, data: () => ({ title: 'Brew 101', offeringId: 'brew101' }) });
    });
    const week = (overrides: Record<string, unknown> = {}) => ({ focus: 'Ratio', coffee: 'Konga', recipe: '15 g', tastingNote: 'Sweet', changeMade: 'Grind', complete: true, status: 'draft', ...overrides });
    firestoreMock.getDocs.mockImplementation((ref: { path: string }) => {
      if (ref.path === 'teaching_assignments') {
        return Promise.resolve({ docs: [{ data: () => ({ sessionId: 'brew101-01', uid: 'instructor-uid', status: 'active' }) }] });
      }
      if (ref.path === 'sessions/brew101-01/challenges') {
        return Promise.resolve({
          docs: [{
            data: () => ({
              ownerUid: 'learner-1',
              weeks: {
                week1: week({ status: 'submitted' }),
                week2: week({ status: 'approved', reviewerNote: 'Older approval', reviewedAt: { toMillis: () => 1_000 } }),
                week3: week({ status: 'returned', reviewerNote: 'Newer return', reviewedAt: { toMillis: () => 2_000 } }),
                week4: week(),
              },
            }),
          }],
        });
      }
      return Promise.resolve({ docs: [] });
    });

    const access = await loadInstructorAccess('instructor-uid');

    expect(access.state).toBe('assigned');
    if (access.state !== 'assigned') return;
    const session = access.sessions[0];
    expect(session.reviews.map((review) => review.weekId)).toEqual(['week1']);
    expect(session.history.map((entry) => entry.weekId)).toEqual(['week3', 'week2']);
    expect(session.history[0]).toMatchObject({ decision: 'returned', reviewerNote: 'Newer return' });
  });
});

describe('reviewPracticeWeek', () => {
  it('stamps each review with the server timestamp that the Firestore Rules require', async () => {
    const weeks = emptyPracticeWeeks();
    weeks.week2 = { ...weeks.week2, focus: 'Grind', status: 'submitted', complete: true };

    await reviewPracticeWeek('brew101-01', 'learner-uid', 'week2', weeks, 'returned', '  Compare the sweetness once more.  ');

    expect(firestoreMock.updateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = firestoreMock.updateDoc.mock.calls[0] as unknown as [{ path: string }, { weeks: Record<string, Record<string, unknown>>; updatedAt: unknown }];
    expect(ref.path).toBe('sessions/brew101-01/challenges/learner-uid');
    expect(payload.weeks.week2).toMatchObject({
      status: 'returned',
      reviewerNote: 'Compare the sweetness once more.',
      reviewedAt: { sentinel: 'server-timestamp' },
      focus: 'Grind',
    });
    expect(payload.updatedAt).toEqual({ sentinel: 'server-timestamp' });
    expect(payload.weeks.week1).toEqual(weeks.week1);
  });

  it('refuses to review without feedback', async () => {
    await expect(reviewPracticeWeek('brew101-01', 'learner-uid', 'week1', emptyPracticeWeeks(), 'approved', '   ')).rejects.toThrow('Feedback is required');
    expect(firestoreMock.updateDoc).not.toHaveBeenCalled();
  });
});
