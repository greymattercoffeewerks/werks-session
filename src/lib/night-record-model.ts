export const nightSeatIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'] as const;
export type NightSeatId = typeof nightSeatIds[number];
export const nightCups = [1, 2, 3, 4] as const;
export type NightCup = typeof nightCups[number];
export type NightAnswer = '' | 'yes' | 'no';

export type NightSeat = { cup: NightCup | null; buy: NightAnswer; bought: NightAnswer; words: string };

export const tallyKeys = [1, 2, 3, 4].flatMap((rank) => [1, 2, 3, 4].map((cup) => `r${rank}c${cup}`));

/**
 * One record per Public Cupping session, written by the teaching staff after the night.
 * It holds seat numbers and choices only: no guest names, contact details, or account identifiers.
 */
export type NightRecord = {
  status: 'draft' | 'final';
  date: string;
  theme: string;
  host: string;
  guests: number;
  redeemed: number;
  flight: [string, string, string, string];
  seats: Record<NightSeatId, NightSeat>;
  tally: Record<string, number>;
  words: string[];
  notes: string;
  /** Set when loaded from Firestore; the Rules require it, and createdAt, to stay unchanged on every update. */
  hostUid?: string;
  createdAt?: unknown;
};

export type NightSummary = {
  guestsCounted: number;
  wouldBuyYes: number;
  wouldBuyNo: number;
  bought: number;
  /** Seats that said they would buy and did. */
  converted: number;
  /** converted / wouldBuyYes, or null when nobody said yes. */
  conversion: number | null;
  /** Bought although they did not tick would-buy yes. */
  boughtWithoutYes: number;
  firstCupCounts: [number, number, number, number];
};

const limits = { short: 80, date: 20, words: 300, notes: 1000, listItems: 40, listWord: 60, guests: 40 };

export function todayIso(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function emptyNightSeat(): NightSeat {
  return { cup: null, buy: '', bought: '', words: '' };
}

export function emptyNightRecord(host = '', now: Date = new Date()): NightRecord {
  const seats = Object.fromEntries(nightSeatIds.map((id) => [id, emptyNightSeat()])) as Record<NightSeatId, NightSeat>;
  return { status: 'draft', date: todayIso(now), theme: '', host, guests: 0, redeemed: 0, flight: ['', '', '', ''], seats, tally: {}, words: [], notes: '' };
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function count(value: unknown, max: number): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.min(Math.max(number, 0), max);
}

function answer(value: unknown): NightAnswer {
  return value === 'yes' || value === 'no' ? value : '';
}

/** Narrows a stored document into a form-ready record. Anything malformed becomes blank rather than throwing. */
export function parseNightRecord(value: unknown): NightRecord {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const base = emptyNightRecord('', new Date(0));
  const sourceSeats = source.seats && typeof source.seats === 'object' && !Array.isArray(source.seats) ? source.seats as Record<string, unknown> : {};
  const seats = Object.fromEntries(nightSeatIds.map((id) => {
    const seat = sourceSeats[id] && typeof sourceSeats[id] === 'object' ? sourceSeats[id] as Record<string, unknown> : {};
    const cup = typeof seat.cup === 'number' && (nightCups as readonly number[]).includes(seat.cup) ? seat.cup as NightCup : null;
    return [id, { cup, buy: answer(seat.buy), bought: answer(seat.bought), words: text(seat.words, limits.words) }];
  })) as Record<NightSeatId, NightSeat>;

  const sourceFlight = Array.isArray(source.flight) ? source.flight : [];
  const sourceTally = source.tally && typeof source.tally === 'object' && !Array.isArray(source.tally) ? source.tally as Record<string, unknown> : {};
  const tally: Record<string, number> = {};
  tallyKeys.forEach((key) => {
    if (sourceTally[key] !== undefined) tally[key] = count(sourceTally[key], limits.guests);
  });

  return {
    ...base,
    status: source.status === 'final' ? 'final' : 'draft',
    date: text(source.date, limits.date),
    theme: text(source.theme, limits.short),
    host: text(source.host, limits.short),
    guests: count(source.guests, limits.guests),
    redeemed: count(source.redeemed, limits.guests),
    flight: [0, 1, 2, 3].map((index) => text(sourceFlight[index], limits.short)) as NightRecord['flight'],
    seats,
    tally,
    words: Array.isArray(source.words) ? source.words.map((word) => text(word, limits.listWord)).filter(Boolean).slice(0, limits.listItems) : [],
    notes: text(source.notes, limits.notes),
    ...(typeof source.hostUid === 'string' && source.hostUid ? { hostUid: source.hostUid } : {}),
    ...(source.createdAt ? { createdAt: source.createdAt } : {}),
  };
}

function seatHasData(seat: NightSeat): boolean {
  return seat.cup !== null || seat.buy !== '' || seat.bought !== '' || seat.words.trim() !== '';
}

export function summariseNight(record: NightRecord): NightSummary {
  const seats = nightSeatIds.map((id) => record.seats[id]);
  const firstCupCounts: [number, number, number, number] = [0, 0, 0, 0];
  let guestsCounted = 0;
  let wouldBuyYes = 0;
  let wouldBuyNo = 0;
  let bought = 0;
  let converted = 0;
  seats.forEach((seat) => {
    if (seatHasData(seat)) guestsCounted += 1;
    if (seat.cup !== null) firstCupCounts[seat.cup - 1] += 1;
    if (seat.buy === 'yes') wouldBuyYes += 1;
    if (seat.buy === 'no') wouldBuyNo += 1;
    if (seat.bought === 'yes') bought += 1;
    if (seat.buy === 'yes' && seat.bought === 'yes') converted += 1;
  });
  return {
    guestsCounted,
    wouldBuyYes,
    wouldBuyNo,
    bought,
    converted,
    conversion: wouldBuyYes > 0 ? converted / wouldBuyYes : null,
    boughtWithoutYes: bought - converted,
    firstCupCounts,
  };
}

export type NightEntry = { sessionId: string; sessionTitle: string; record: NightRecord };

export type NightTrends = {
  nights: number;
  guests: number;
  wouldBuyYes: number;
  bought: number;
  converted: number;
  conversion: number | null;
};

export function summariseTrends(entries: NightEntry[]): NightTrends {
  const totals = entries.reduce((sum, entry) => {
    const summary = summariseNight(entry.record);
    return {
      guests: sum.guests + (entry.record.guests || summary.guestsCounted),
      wouldBuyYes: sum.wouldBuyYes + summary.wouldBuyYes,
      bought: sum.bought + summary.bought,
      converted: sum.converted + summary.converted,
    };
  }, { guests: 0, wouldBuyYes: 0, bought: 0, converted: 0 });
  return { nights: entries.length, ...totals, conversion: totals.wouldBuyYes > 0 ? totals.converted / totals.wouldBuyYes : null };
}

/** Spreadsheet formulas can run when a CSV cell begins with one of these characters, so they are neutralised. */
function csvCell(value: string | number): string {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const csvHeader = ['session_id', 'session', 'date', 'theme', 'host', 'status', 'guests', 'redeemed', 'seat', 'first_cup', 'first_cup_coffee', 'would_buy', 'bought', 'words_heard'];

/** One row per seat that has data, with the night's details repeated, ready for a spreadsheet. */
export function nightRecordsToCsv(entries: NightEntry[]): string {
  const rows: string[] = [csvHeader.join(',')];
  entries.forEach(({ sessionId, sessionTitle, record }) => {
    nightSeatIds.forEach((id, index) => {
      const seat = record.seats[id];
      if (!seatHasData(seat)) return;
      rows.push([
        sessionId, sessionTitle, record.date, record.theme, record.host, record.status, record.guests, record.redeemed,
        index + 1, seat.cup ?? '', seat.cup ? record.flight[seat.cup - 1] : '', seat.buy, seat.bought, seat.words,
      ].map(csvCell).join(','));
    });
  });
  return rows.join('\r\n') + '\r\n';
}
