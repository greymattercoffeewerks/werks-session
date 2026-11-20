import { afterEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  collection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  collectionGroup: vi.fn((_db: unknown, name: string) => ({ kind: 'collectionGroup', name })),
  doc: vi.fn((...segments: unknown[]) => ({ path: segments.slice(1).join('/') })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn((n: number) => ({ kind: 'limit', n })),
  orderBy: vi.fn((field: string, direction: string) => ({ kind: 'orderBy', field, direction })),
  query: vi.fn((collection: unknown, ...constraints: unknown[]) => ({ collection, constraints })),
  serverTimestamp: vi.fn(() => ({ sentinel: 'server-timestamp' })),
  startAfter: vi.fn((cursor: unknown) => ({ kind: 'startAfter', cursor })),
  updateDoc: vi.fn(() => Promise.resolve()),
  where: vi.fn((field: string, operation: string, value: unknown) => ({
    kind: 'where',
    field,
    operation,
    value,
  })),
}));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('../../src/lib/firebase', () => ({ firestore: { name: 'test-firestore' } }));

import { loadInstructorAccess, reviewPracticeWeek } from '../../src/lib/instructor-access';

afterEach(() => vi.clearAllMocks());

const weekDocument = (data: Record<string, unknown>) => ({ data: () => data });

describe('reviewPracticeWeek', () => {
  it('stamps the review with the server timestamp the Rules require, on the week document', async () => {
    await reviewPracticeWeek('brew101-01', 'learner-uid', 'week2', 'returned', '  Compare the sweetness once more.  ');

    expect(firestoreMock.updateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = firestoreMock.updateDoc.mock.calls[0] as unknown as [
      { path: string },
      Record<string, unknown>,
    ];
    expect(ref.path).toBe('sessions/brew101-01/challenges/learner-uid/weeks/week2');
    expect(payload).toMatchObject({
      status: 'returned',
      reviewerNote: 'Compare the sweetness once more.',
      reviewedAt: { sentinel: 'server-timestamp' },
      updatedAt: { sentinel: 'server-timestamp' },
    });
  });

  it('refuses to review without feedback', async () => {
    await expect(reviewPracticeWeek('brew101-01', 'learner-uid', 'week1', 'approved', '   ')).rejects.toThrow(
      'Feedback is required',
    );
    expect(firestoreMock.updateDoc).not.toHaveBeenCalled();
  });
});

describe('loadInstructorAccess', () => {
  it('pages the queue and history from the weeks collection group, not from the learner documents', async () => {
    firestoreMock.getDoc.mockImplementation((ref: { path: string }) => {
      if (ref.path.startsWith('access_grants/')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ status: 'active', role: 'instructor', personId: 'person-1' }),
        });
      }
      return Promise.resolve({ exists: () => true, data: () => ({ title: 'Brew 101', offeringId: 'brew101' }) });
    });

    firestoreMock.getDocs.mockImplementation(
      (request: {
        collection?: { name?: string };
        constraints?: { kind: string; field?: string; operation?: string }[];
      }) => {
        if (request.collection?.name === 'teaching_assignments') {
          return Promise.resolve({
            docs: [{ data: () => ({ sessionId: 'brew101-01', uid: 'instructor-uid', status: 'active' }) }],
          });
        }
        const statusFilter = (request.constraints ?? []).find(
          (constraint) => constraint.kind === 'where' && constraint.field === 'status',
        );
        if (statusFilter?.operation === '==') {
          return Promise.resolve({
            docs: [
              weekDocument({
                sessionId: 'brew101-01',
                learnerUid: 'learner-1',
                weekId: 'week1',
                status: 'submitted',
                focus: 'Ratio',
                coffee: 'Konga',
                recipe: '15 g',
                tastingNote: 'Sweet',
                changeMade: 'Grind',
                complete: true,
              }),
            ],
          });
        }
        return Promise.resolve({
          docs: [
            weekDocument({
              sessionId: 'brew101-01',
              learnerUid: 'learner-1',
              weekId: 'week3',
              status: 'approved',
              reviewerNote: 'Good work',
              reviewedAt: { toMillis: () => 2_000 },
              focus: 'Grind',
            }),
          ],
        });
      },
    );

    const access = await loadInstructorAccess('instructor-uid');

    expect(access.state).toBe('assigned');
    if (access.state !== 'assigned') return;
    expect(access.sessions.map((session) => session.id)).toEqual(['brew101-01']);
    expect(access.reviews).toEqual([
      expect.objectContaining({
        sessionId: 'brew101-01',
        learnerUid: 'learner-1',
        weekId: 'week1',
        week: expect.objectContaining({ focus: 'Ratio' }),
      }),
    ]);
    expect(access.history).toEqual([
      expect.objectContaining({
        sessionId: 'brew101-01',
        learnerUid: 'learner-1',
        weekId: 'week3',
        decision: 'approved',
        reviewerNote: 'Good work',
      }),
    ]);
    expect(access.reviewHasMore).toBe(false);
    expect(access.historyHasMore).toBe(false);
  });
});

describe('review paging', () => {
  it('fills a page of ten and reports that more remain', async () => {
    firestoreMock.getDoc.mockImplementation((ref: { path: string }) => {
      if (ref.path.startsWith('access_grants/')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ status: 'active', role: 'instructor', personId: 'person-1' }),
        });
      }
      return Promise.resolve({ exists: () => true, data: () => ({ title: 'Brew 101', offeringId: 'brew101' }) });
    });
    firestoreMock.getDocs.mockImplementation((request: { collection?: { name?: string } }) => {
      if (request.collection?.name === 'teaching_assignments') {
        return Promise.resolve({
          docs: [{ data: () => ({ sessionId: 'brew101-01', uid: 'instructor-uid', status: 'active' }) }],
        });
      }
      const docs = Array.from({ length: 11 }, (_, index) =>
        weekDocument({
          sessionId: 'brew101-01',
          learnerUid: `learner-${index}`,
          weekId: 'week1',
          status: 'submitted',
          focus: 'Ratio',
        }),
      );
      return Promise.resolve({ docs });
    });

    const access = await loadInstructorAccess('instructor-uid');

    expect(access.state).toBe('assigned');
    if (access.state !== 'assigned') return;
    expect(access.reviews).toHaveLength(10);
    expect(access.reviewCursor).not.toBeNull();
    expect(access.reviewHasMore).toBe(true);
  });

  it('caps the paged query at eight sessions so the Rules document budget holds', async () => {
    const assignments = Array.from({ length: 9 }, (_, index) => ({
      data: () => ({ sessionId: `s${index + 1}`, uid: 'instructor-uid', status: 'active' }),
    }));
    firestoreMock.getDoc.mockImplementation((ref: { path: string }) => {
      if (ref.path.startsWith('access_grants/')) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ status: 'active', role: 'instructor', personId: 'person-1' }),
        });
      }
      return Promise.resolve({ exists: () => true, data: () => ({ title: 'Session', offeringId: 'brew101' }) });
    });
    firestoreMock.getDocs.mockImplementation((request: { collection?: { name?: string } }) => {
      if (request.collection?.name === 'teaching_assignments') return Promise.resolve({ docs: assignments });
      return Promise.resolve({ docs: [] });
    });

    await loadInstructorAccess('instructor-uid');

    const sessionFilters = firestoreMock.where.mock.calls
      .filter(([field, operation]) => field === 'sessionId' && operation === 'in')
      .map(([, , value]) => value as string[]);
    expect(sessionFilters.length).toBeGreaterThan(0);
    sessionFilters.forEach((ids) => expect(ids.length).toBeLessThanOrEqual(8));
  });
});
