import { afterEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  doc: vi.fn((...segments: unknown[]) => ({ path: segments.slice(1).join('/') })),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => ({ sentinel: 'server-timestamp' })),
}));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('../../src/lib/firebase', () => ({ firestore: { name: 'test-firestore' } }));

import { loadNightRecord, saveNightRecord } from '../../src/lib/night-record';
import { emptyNightRecord, nightRecordsToCsv, parseNightRecord, summariseNight, summariseTrends, tallyKeys, type NightRecord } from '../../src/lib/night-record-model';

afterEach(() => vi.clearAllMocks());

function sampleRecord(): NightRecord {
  const record = emptyNightRecord('Host', new Date(2026, 9, 24));
  record.theme = 'Range Night';
  record.guests = 4;
  record.flight = ['ttku', 'mana saja', 'xixu', 'aura'];
  record.seats.s1 = { cup: 2, buy: 'yes', bought: 'yes', words: 'sweet' };
  record.seats.s2 = { cup: 2, buy: 'yes', bought: 'no', words: '' };
  record.seats.s3 = { cup: 1, buy: 'no', bought: 'yes', words: '' };
  record.seats.s4 = { cup: null, buy: '', bought: '', words: '' };
  return record;
}

describe('emptyNightRecord and parseNightRecord', () => {
  it('starts as a dated blank draft with twelve empty seats', () => {
    const record = emptyNightRecord('Host', new Date(2026, 9, 5));
    expect(record).toMatchObject({ status: 'draft', date: '2026-10-05', host: 'Host', guests: 0, redeemed: 0, words: [], notes: '' });
    expect(Object.keys(record.seats)).toHaveLength(12);
    expect(record.seats.s12).toEqual({ cup: null, buy: '', bought: '', words: '' });
  });

  it('keeps only well-formed values, trims text, and caps lengths and counts', () => {
    const record = parseNightRecord({
      status: 'final', date: ' 2026-10-24 ', theme: ' Range Night ', host: 'H'.repeat(200), guests: 99, redeemed: -3,
      flight: ['a', 7, ' c '], seats: {
        s1: { cup: 3, buy: 'yes', bought: 'later', words: ' sweet ' },
        s2: { cup: 9, buy: 'maybe', bought: 'no', words: 'w'.repeat(400) },
        s13: { cup: 1, buy: 'yes', bought: 'yes', words: 'ignored' },
      },
      tally: { r1c1: 5, r9c9: 3, r2c2: 'x', r3c3: 100 }, words: [' one ', '', 5, ...Array.from({ length: 60 }, (_, index) => `w${index}`)],
      notes: 'n'.repeat(2000), hostUid: 'host-uid', createdAt: 'created',
    });
    expect(record.status).toBe('final');
    expect(record.date).toBe('2026-10-24');
    expect(record.theme).toBe('Range Night');
    expect(record.host).toHaveLength(80);
    expect(record.guests).toBe(40);
    expect(record.redeemed).toBe(0);
    expect(record.flight).toEqual(['a', '', 'c', '']);
    expect(record.seats.s1).toEqual({ cup: 3, buy: 'yes', bought: '', words: 'sweet' });
    expect(record.seats.s2).toEqual({ cup: null, buy: '', bought: 'no', words: 'w'.repeat(300) });
    expect('s13' in record.seats).toBe(false);
    expect(record.tally).toEqual({ r1c1: 5, r3c3: 40, r2c2: 0 });
    expect(record.words).toHaveLength(40);
    expect(record.words[0]).toBe('one');
    expect(record.notes).toHaveLength(1000);
    expect(record.hostUid).toBe('host-uid');
    expect(record.createdAt).toBe('created');
  });

  it('turns anything unusable into a blank draft rather than throwing', () => {
    ['text', null, [], 42].forEach((value) => {
      expect(parseNightRecord(value)).toMatchObject({ status: 'draft', guests: 0, words: [], theme: '' });
    });
    expect(tallyKeys).toHaveLength(16);
  });
});

describe('summariseNight and summariseTrends', () => {
  it('counts guests, would-buy, purchases, conversion, and first-cup picks', () => {
    expect(summariseNight(sampleRecord())).toEqual({
      guestsCounted: 3, wouldBuyYes: 2, wouldBuyNo: 1, bought: 2, converted: 1, conversion: 0.5, boughtWithoutYes: 1, firstCupCounts: [1, 2, 0, 0],
    });
  });

  it('has no conversion when nobody said yes', () => {
    expect(summariseNight(emptyNightRecord()).conversion).toBeNull();
  });

  it('adds nights together, preferring the entered guest count', () => {
    const second = sampleRecord();
    second.guests = 0;
    const trends = summariseTrends([
      { sessionId: 'a', sessionTitle: 'A', record: sampleRecord() },
      { sessionId: 'b', sessionTitle: 'B', record: second },
    ]);
    expect(trends).toEqual({ nights: 2, guests: 4 + 3, wouldBuyYes: 4, bought: 4, converted: 2, conversion: 0.5 });
  });
});

describe('nightRecordsToCsv', () => {
  it('writes one row per seat with data, repeating the night details', () => {
    const csv = nightRecordsToCsv([{ sessionId: 'cupping-01', sessionTitle: 'Range Night', record: sampleRecord() }]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('session_id,session,date,theme,host,status,guests,redeemed,seat,first_cup,first_cup_coffee,would_buy,bought,words_heard');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe('cupping-01,Range Night,2026-10-24,Range Night,Host,draft,4,0,1,2,mana saja,yes,yes,sweet');
    expect(lines[3]).toContain(',3,1,ttku,no,yes,');
  });

  it('quotes awkward text and neutralises spreadsheet formulas', () => {
    const record = sampleRecord();
    record.seats.s1.words = '=HYPERLINK("http://x")';
    record.seats.s2.words = 'sweet, "round"';
    const csv = nightRecordsToCsv([{ sessionId: 's', sessionTitle: '+Title', record }]);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain('"sweet, ""round"""');
    expect(csv.split('\r\n')[1].startsWith("s,'+Title,")).toBe(true);
  });
});

describe('loadNightRecord and saveNightRecord', () => {
  it('loads sessions/{id}/night_record/main and returns null when absent', async () => {
    firestoreMock.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ theme: 'Range Night', hostUid: 'host-uid' }) });
    expect(await loadNightRecord('cupping-01')).toMatchObject({ theme: 'Range Night', hostUid: 'host-uid' });
    expect(firestoreMock.doc).toHaveBeenCalledWith({ name: 'test-firestore' }, 'sessions', 'cupping-01', 'night_record', 'main');
    firestoreMock.getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) });
    expect(await loadNightRecord('cupping-01')).toBeNull();
  });

  it('creates a new record stamped with the signed-in host and server times', async () => {
    await saveNightRecord('cupping-01', 'host-uid', { ...sampleRecord(), status: 'draft' });
    const [ref, payload] = firestoreMock.setDoc.mock.calls[0] as unknown as [{ path: string }, Record<string, unknown>];
    expect(ref.path).toBe('sessions/cupping-01/night_record/main');
    expect(payload).toMatchObject({
      sessionId: 'cupping-01', hostUid: 'host-uid', status: 'draft', date: '2026-10-24', theme: 'Range Night', guests: 4,
      createdAt: { sentinel: 'server-timestamp' }, updatedAt: { sentinel: 'server-timestamp' },
    });
    expect(Object.keys(payload).sort()).toEqual(['createdAt', 'date', 'flight', 'guests', 'host', 'hostUid', 'notes', 'redeemed', 'seats', 'sessionId', 'status', 'tally', 'theme', 'updatedAt', 'words']);
    expect(Object.keys(payload.seats as object)).toHaveLength(12);
  });

  it('keeps the stored host and creation time on update, as the Rules require', async () => {
    await saveNightRecord('cupping-01', 'another-instructor', { ...sampleRecord(), status: 'final', hostUid: 'original-host', createdAt: 'stored-created-at' });
    const [, payload] = firestoreMock.setDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(payload).toMatchObject({ hostUid: 'original-host', createdAt: 'stored-created-at', status: 'final', updatedAt: { sentinel: 'server-timestamp' } });
  });

  it('never writes anything but cleaned values', async () => {
    const record = sampleRecord();
    record.theme = `  ${'t'.repeat(200)}  `;
    record.words = ['  kept  ', '', 'x'];
    await saveNightRecord('cupping-01', 'host-uid', record);
    const [, payload] = firestoreMock.setDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect((payload.theme as string)).toHaveLength(80);
    expect(payload.words).toEqual(['kept', 'x']);
  });
});
