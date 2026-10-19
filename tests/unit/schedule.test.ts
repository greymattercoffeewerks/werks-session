import { afterEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  doc: vi.fn((...segments: unknown[]) => ({ path: segments.slice(1).join('/') })),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => ({ sentinel: 'server-timestamp' })),
}));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('../../src/lib/firebase', () => ({ firestore: { name: 'test-firestore' } }));

import { loadPublicSchedule, loadPublicScheduleForEditing, savePublicSchedule } from '../../src/lib/schedule';
import { emptyScheduleItem, formatScheduleDate, parseSchedule, scheduleDateParts, todayDate, upcomingItems, validDate, type ScheduleItem } from '../../src/lib/schedule-model';

afterEach(() => vi.clearAllMocks());

const item = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({ ...emptyScheduleItem('a'), title: 'Range Night', date: '2026-11-07', ...overrides });

describe('validDate, todayDate, and date formatting', () => {
  it('accepts only real calendar dates in YYYY-MM-DD form', () => {
    expect(validDate('2026-11-07')).toBe('2026-11-07');
    ['2026-02-30', '2026-13-01', '2026-1-1', '07-11-2026', '', null, 5].forEach((value) => expect(validDate(value)).toBe(''));
  });

  it('formats a date for display and splits it for the date block', () => {
    expect(formatScheduleDate('2026-10-24')).toBe('Sat 24 Oct 2026');
    expect(scheduleDateParts('2026-10-24')).toEqual({ weekday: 'Sat', day: '24', month: 'Oct', year: '2026' });
    expect(formatScheduleDate('')).toBe('');
    expect(scheduleDateParts('nonsense')).toBeNull();
  });

  it('writes today in local YYYY-MM-DD form', () => {
    expect(todayDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('parseSchedule', () => {
  it('keeps well-formed items, trims and caps text, and falls back safely', () => {
    const items = parseSchedule([
      { id: ' x ', offeringId: 'brew101', title: '  Manual Brew  ', date: '2026-12-01', time: ' 7 pm ', venue: 'V'.repeat(200), status: 'limited', note: 'N'.repeat(500) },
      { title: 'Plain', date: '2026-02-30', status: 'bogus', offeringId: 'other' },
      { title: '' },
      { id: 'no-title' },
      'not an object',
      null,
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 'x', offeringId: 'brew101', title: 'Manual Brew', date: '2026-12-01', time: '7 pm', status: 'limited' });
    expect(items[0].venue).toHaveLength(80);
    expect(items[0].note).toHaveLength(200);
    expect(items[1]).toMatchObject({ offeringId: 'cupping', title: 'Plain', date: '', status: 'tbc' });
  });

  it('makes ids unique, caps the list at twelve, and tolerates non-lists', () => {
    const many = parseSchedule(Array.from({ length: 20 }, () => ({ id: 'same', title: 'T' })));
    expect(many).toHaveLength(12);
    expect(new Set(many.map((entry) => entry.id)).size).toBe(12);
    [undefined, null, 'x', 5, {}].forEach((value) => expect(parseSchedule(value)).toEqual([]));
  });

  it('keeps markup-looking text as plain text for the page to escape', () => {
    expect(parseSchedule([{ title: '<b>Bold</b>' }])[0].title).toBe('<b>Bold</b>');
  });
});

describe('upcomingItems', () => {
  const now = new Date(2026, 10, 8, 15, 0);

  it('hides past dates but keeps today, and orders dated items before undated ones', () => {
    const result = upcomingItems([
      item({ id: 'undated', date: '', status: 'tbc' }),
      item({ id: 'later', date: '2026-12-20' }),
      item({ id: 'past', date: '2026-11-07' }),
      item({ id: 'today', date: '2026-11-08', time: '8 pm' }),
      item({ id: 'today-early', date: '2026-11-08', time: '10 am' }),
      item({ id: 'soon', date: '2026-11-15' }),
    ], now);
    expect(result.map((entry) => entry.id)).toEqual(['today-early', 'today', 'soon', 'later', 'undated']);
  });

  it('returns nothing when everything has passed', () => {
    expect(upcomingItems([item({ date: '2020-01-01' })], now)).toEqual([]);
  });
});

describe('loadPublicSchedule, loadPublicScheduleForEditing, and savePublicSchedule', () => {
  it('reads public_schedule/current and parses it', async () => {
    firestoreMock.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [{ title: 'Range Night', date: '2026-11-07', status: 'open' }] }) });
    const items = await loadPublicSchedule();
    expect(firestoreMock.doc).toHaveBeenCalledWith({ name: 'test-firestore' }, 'public_schedule', 'current');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: 'Range Night', status: 'open' });
  });

  it('never breaks the front page: a missing document or a failed read means no dates', async () => {
    firestoreMock.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) });
    expect(await loadPublicSchedule()).toEqual([]);
    firestoreMock.getDoc.mockRejectedValueOnce(new Error('offline'));
    expect(await loadPublicSchedule()).toEqual([]);
  });

  it('lets the editor see a failed read, so an empty list can never overwrite the real one', async () => {
    firestoreMock.getDoc.mockRejectedValueOnce(new Error('offline'));
    await expect(loadPublicScheduleForEditing()).rejects.toThrow('offline');
    firestoreMock.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) });
    expect(await loadPublicScheduleForEditing()).toEqual([]);
  });

  it('publishes cleaned items in one write with the server time', async () => {
    await savePublicSchedule([item({ id: 'kept', title: '  Range Night  ' }), item({ id: 'dropped', title: '' }), item({ id: 'bad-date', date: '2026-02-30' })]);
    const [ref, payload] = firestoreMock.setDoc.mock.calls[0] as unknown as [{ path: string }, { items: ScheduleItem[]; updatedAt: unknown }];
    expect(ref.path).toBe('public_schedule/current');
    expect(Object.keys(payload).sort()).toEqual(['items', 'updatedAt']);
    expect(payload.updatedAt).toEqual({ sentinel: 'server-timestamp' });
    expect(payload.items.map((entry) => entry.id)).toEqual(['kept', 'bad-date']);
    expect(payload.items[0].title).toBe('Range Night');
    expect(payload.items[1].date).toBe('');
  });
});
