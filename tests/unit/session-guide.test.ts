import { afterEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  doc: vi.fn((...segments: unknown[]) => ({ path: segments.slice(1).join('/') })),
  getDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('../../src/lib/firebase', () => ({ firestore: { name: 'test-firestore' } }));

import { loadSessionGuide, parseSessionGuide } from '../../src/lib/session-guide';

afterEach(() => vi.clearAllMocks());

const snapshot = (data: Record<string, unknown> | null) => ({ exists: () => data !== null, data: () => data ?? {} });

describe('parseSessionGuide', () => {
  it('keeps only well-formed text and trims it', () => {
    const guide = parseSessionGuide({
      offeringId: 'cupping',
      version: 2,
      title: '  Title  ',
      intro: 'Intro',
      facts: [{ label: 'A', value: 'B' }, { label: 'No value' }, 'not an object', null],
      schedule: [{ when: '1', what: '2' }, { when: '', what: 'dropped' }],
      tastingCard: { title: 'Card', prompts: [{ name: 'P', help: 'H' }, { help: 'no name' }], note: 'N' },
      basics: [{ step: 'S', text: 'T' }],
      vocabulary: [{ group: 'G', words: ['a', '  ', 7, 'b'] }, { group: 'Empty', words: [] }],
      vocabularyNote: ' VN ',
      sections: [{ title: ' Sec ', intro: ' I ', rows: [{ label: 'L', text: 'T' }, { label: 'No text' }, 'nope'] }, { title: 'Empty', rows: [] }, { rows: [{ label: 'x', text: 'y' }] }],
      beforeYouCome: ['x', '', 5],
      footer: 'F',
    });
    expect(guide).toEqual({
      offeringId: 'cupping',
      version: 2,
      title: 'Title',
      intro: 'Intro',
      facts: [{ label: 'A', value: 'B' }],
      schedule: [{ when: '1', what: '2' }],
      tastingCard: { title: 'Card', prompts: [{ name: 'P', help: 'H' }], note: 'N' },
      basics: [{ step: 'S', text: 'T' }],
      vocabulary: [{ group: 'G', words: ['a', 'b'] }],
      vocabularyNote: 'VN',
      sections: [{ title: 'Sec', intro: 'I', rows: [{ label: 'L', text: 'T' }] }],
      beforeYouCome: ['x'],
      footer: 'F',
    });
  });

  it('returns null for missing, malformed, or empty documents', () => {
    expect(parseSessionGuide(null)).toBeNull();
    expect(parseSessionGuide('text')).toBeNull();
    expect(parseSessionGuide([])).toBeNull();
    expect(parseSessionGuide({ title: 'Only a title', facts: 'nope' })).toBeNull();
  });

  it('caps text length and item counts and ignores unknown offerings', () => {
    const guide = parseSessionGuide({ offeringId: 'other', intro: 'x'.repeat(5000), beforeYouCome: Array.from({ length: 200 }, (_, index) => `item ${index}`) });
    expect(guide?.offeringId).toBeNull();
    expect(guide?.intro).toHaveLength(2000);
    expect(guide?.beforeYouCome).toHaveLength(60);
  });

  it('accepts the Barista 101 offering and caps the number of sections and rows', () => {
    const guide = parseSessionGuide({
      offeringId: 'barista101',
      sections: Array.from({ length: 30 }, (_, index) => ({ title: `S${index}`, rows: Array.from({ length: 200 }, (_, row) => ({ label: `L${row}`, text: 't' })) })),
    });
    expect(guide?.offeringId).toBe('barista101');
    expect(guide?.sections).toHaveLength(12);
    expect(guide?.sections[0].rows).toHaveLength(60);
  });
});

describe('loadSessionGuide', () => {
  it('reads sessions/{id}/guide/main and accepts content pasted as one JSON string', async () => {
    firestoreMock.getDoc.mockResolvedValueOnce(snapshot({ offeringId: 'cupping', version: 3, title: 'From fields', contentJson: JSON.stringify({ intro: 'From JSON', beforeYouCome: ['Arrive on time.'] }) }));
    const guide = await loadSessionGuide('cupping-01');
    expect(firestoreMock.doc).toHaveBeenCalledWith({ name: 'test-firestore' }, 'sessions', 'cupping-01', 'guide', 'main');
    expect(guide).toMatchObject({ offeringId: 'cupping', version: 3, title: 'From fields', intro: 'From JSON', beforeYouCome: ['Arrive on time.'] });
  });

  it('falls back to document fields when contentJson is absent or invalid', async () => {
    firestoreMock.getDoc.mockResolvedValueOnce(snapshot({ intro: 'Direct field', contentJson: '{not json' }));
    expect(await loadSessionGuide('cupping-01')).toMatchObject({ intro: 'Direct field' });
  });

  it('returns null when the guide is missing or the read is denied', async () => {
    firestoreMock.getDoc.mockResolvedValueOnce(snapshot(null));
    expect(await loadSessionGuide('cupping-01')).toBeNull();
    firestoreMock.getDoc.mockRejectedValueOnce(new Error('permission-denied'));
    expect(await loadSessionGuide('cupping-01')).toBeNull();
  });
});
