import { useEffect, useMemo, useState } from 'react';
import type { InstructorSession } from './lib/instructor-access';
import { loadNightRecord } from './lib/night-record';
import {
  nightRecordsToCsv,
  summariseNight,
  summariseTrends,
  type NightEntry,
  type NightRecord,
} from './lib/night-record-model';
import { RouteLink } from './access/dashboard';
import { navigate } from './lib/router';

const nightsPerPage = 10;

function percent(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)}%`;
}

function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type LoadedNight = NightRecord | null | 'error';

/** The nights list is a read-only overview; the editor lives on the night's own page. */
export function NightsList({ sessions }: { sessions: InstructorSession[] }) {
  const [records, setRecords] = useState<Record<string, LoadedNight> | undefined>(undefined);
  const [shown, setShown] = useState(nightsPerPage);
  const sessionKey = sessions.map((session) => session.id).join('|');

  useEffect(() => {
    let cancelled = false;
    const ids = sessionKey === '' ? [] : sessionKey.split('|');
    setRecords(undefined);
    Promise.all(
      ids.map((id) =>
        loadNightRecord(id)
          .then((record) => [id, record] as const)
          .catch(() => [id, 'error' as const] as const),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      setRecords(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  const ordered = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const dateA = records?.[a.id] && records[a.id] !== 'error' ? (records[a.id] as NightRecord).date : '';
        const dateB = records?.[b.id] && records[b.id] !== 'error' ? (records[b.id] as NightRecord).date : '';
        if (dateA === dateB) return a.title.localeCompare(b.title);
        if (dateA === '') return 1;
        if (dateB === '') return -1;
        return dateB.localeCompare(dateA);
      }),
    [sessions, records],
  );
  const visible = ordered.slice(0, shown);
  const entries: NightEntry[] = visible.flatMap((session) => {
    const record = records?.[session.id];
    return record && record !== 'error' ? [{ sessionId: session.id, sessionTitle: session.title, record }] : [];
  });
  const trends = useMemo(() => summariseTrends(entries), [entries]);

  if (records === undefined) {
    return (
      <section className="panel night-record" aria-live="polite">
        <p>Loading your nights…</p>
      </section>
    );
  }

  return (
    <section className="night-record" aria-labelledby="nights-list-heading">
      <div className="night-record-heading">
        <div>
          <p className="eyebrow">Public Cupping</p>
          <h2 id="nights-list-heading">Your nights</h2>
          <p>One row per cupping session. Open a night to record it, or read what you wrote.</p>
        </div>
        {entries.length > 0 && (
          <button
            className="button secondary"
            type="button"
            onClick={() => downloadCsv('public-cupping-nights-page.csv', nightRecordsToCsv(entries))}
          >
            Download this page
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <p className="panel night-trend-summary">
          Across the {trends.nights} recorded {trends.nights === 1 ? 'night' : 'nights'} shown: {trends.guests} guests,{' '}
          {trends.wouldBuyYes} would buy, {trends.bought} bought. Of those who said yes, {percent(trends.conversion)}{' '}
          bought.
        </p>
      )}
      {ordered.length > shown && (
        <p className="night-trend-summary">
          Showing {visible.length} of {ordered.length} nights.
        </p>
      )}

      <div className="night-table-wrap">
        <table className="night-trend-table nights-table">
          <caption className="visually-hidden">Your recorded and unrecorded nights</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Theme</th>
              <th scope="col">Session</th>
              <th scope="col">Host</th>
              <th scope="col">Guests</th>
              <th scope="col">Would buy</th>
              <th scope="col">Bought</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((session) => {
              const loaded = records[session.id];
              const failed = loaded === 'error';
              const record = loaded && loaded !== 'error' ? loaded : null;
              const summary = record ? summariseNight(record) : null;
              return (
                <tr key={session.id} className={record ? '' : 'night-row-empty'}>
                  <th scope="row">{failed ? 'Could not load' : record?.date || 'Not recorded'}</th>
                  <td>{failed ? '–' : record?.theme || '–'}</td>
                  <td>{session.title}</td>
                  <td>{failed ? '–' : record?.host || '–'}</td>
                  <td>{!record ? '–' : record.guests || summary?.guestsCounted || 0}</td>
                  <td>{summary ? summary.wouldBuyYes : '–'}</td>
                  <td>{summary ? summary.bought : '–'}</td>
                  <td>{failed ? 'Could not load' : record ? record.status : 'No record'}</td>
                  <td>
                    <RouteLink
                      to={`/instructor/nights/${encodeURIComponent(session.id)}`}
                      label={record ? `Open ${session.title}` : `Record ${session.title}`}
                      current={false}
                      onNavigate={navigate}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ordered.length > shown && (
        <button
          className="button secondary"
          type="button"
          onClick={() => setShown((current) => current + nightsPerPage)}
        >
          Show more nights
        </button>
      )}
    </section>
  );
}
