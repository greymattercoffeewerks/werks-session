import type { OfferingKind } from '../types';
import { parseOfferingKind } from './offering';

export const scheduleStatuses = ['interest', 'open', 'limited', 'full', 'tbc'] as const;
export type ScheduleStatus = typeof scheduleStatuses[number];

/** Status labels, not seat counts: staff set them by hand, so they never claim more than staff know. */
export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  interest: 'Interest list open',
  open: 'Seats available',
  limited: 'Few seats left',
  full: 'Full: ask for the waitlist',
  tbc: 'Date to be confirmed',
};

/** One upcoming session as shown on the public front page. Public data: never put guest details in it. */
export type ScheduleItem = {
  id: string;
  offeringId: OfferingKind;
  title: string;
  /** YYYY-MM-DD, or empty when the date is not set yet. */
  date: string;
  time: string;
  venue: string;
  status: ScheduleStatus;
  note: string;
};

export const maxScheduleItems = 12;
const limits = { id: 40, title: 80, time: 20, venue: 80, note: 200 };

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** A real calendar date in YYYY-MM-DD form, or an empty string. */
export function validDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : '';
}

export function todayDate(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function emptyScheduleItem(id: string): ScheduleItem {
  return { id, offeringId: 'cupping', title: '', date: '', time: '', venue: '', status: 'interest', note: '' };
}

/** Narrows stored data into display-ready items. Anything malformed is dropped or blanked, never thrown. */
export function parseSchedule(value: unknown): ScheduleItem[] {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const items: ScheduleItem[] = [];
  list.slice(0, maxScheduleItems).forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const source = entry as Record<string, unknown>;
    const title = text(source.title, limits.title);
    if (!title) return;
    let id = text(source.id, limits.id) || `item-${index + 1}`;
    if (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    items.push({
      id,
      offeringId: parseOfferingKind(source.offeringId) ?? 'cupping',
      title,
      date: validDate(source.date),
      time: text(source.time, limits.time),
      venue: text(source.venue, limits.venue),
      status: (scheduleStatuses as readonly unknown[]).includes(source.status) ? source.status as ScheduleStatus : 'tbc',
      note: text(source.note, limits.note),
    });
  });
  return items;
}

/** Hides dates that have passed (a date stays up through its own day), dated items first by date, then undated. */
export function upcomingItems(items: ScheduleItem[], now: Date = new Date()): ScheduleItem[] {
  const today = todayDate(now);
  const live = items.filter((item) => item.date === '' || item.date >= today);
  const dated = live.filter((item) => item.date !== '').sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  return [...dated, ...live.filter((item) => item.date === '')];
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function scheduleDateParts(date: string): { weekday: string; day: string; month: string; year: string } | null {
  if (!validDate(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return { weekday: weekdays[parsed.getDay()], day: String(day), month: months[month - 1], year: String(year) };
}

export function formatScheduleDate(date: string): string {
  const parts = scheduleDateParts(date);
  return parts ? `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}` : '';
}
