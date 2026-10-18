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
import { reviewPracticeWeek } from '../../src/lib/instructor-access';

afterEach(() => vi.clearAllMocks());

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
