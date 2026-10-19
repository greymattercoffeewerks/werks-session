import { useEffect, useMemo, useState } from 'react';
import type { InstructorSession } from './lib/instructor-access';
import { loadNightRecord, saveNightRecord } from './lib/night-record';
import {
  emptyNightRecord, nightCups, nightRecordsToCsv, nightSeatIds, summariseNight, summariseTrends,
  type NightAnswer, type NightCup, type NightEntry, type NightRecord, type NightSeat, type NightSeatId,
} from './lib/night-record-model';

const answerOptions: { value: NightAnswer; label: string }[] = [{ value: '', label: '–' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

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

export function NightRecordWorkspace({ sessions, uid, hostName }: { sessions: InstructorSession[]; uid: string; hostName: string }) {
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? '');
  const [saved, setSaved] = useState<Record<string, NightRecord | null> | undefined>(undefined);
  const [draft, setDraft] = useState<NightRecord>(() => emptyNightRecord(hostName));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sessionKey = sessions.map((session) => session.id).join('|');

  useEffect(() => {
    let cancelled = false;
    setSaved(undefined);
    Promise.all(sessions.map((session) => loadNightRecord(session.id).then((record) => [session.id, record] as const).catch(() => [session.id, null] as const)))
      .then((pairs) => {
        if (cancelled) return;
        const map = Object.fromEntries(pairs);
        setSaved(map);
        setDraft(map[selectedId] ?? emptyNightRecord(hostName));
      });
    return () => { cancelled = true; };
    // Reload only when the assigned sessions change; selection is applied separately.
  }, [sessionKey]);

  const selectSession = (sessionId: string) => {
    setSelectedId(sessionId);
    setDraft(saved?.[sessionId] ?? emptyNightRecord(hostName));
    setMessage('');
    setError('');
  };

  const update = (change: Partial<NightRecord>) => {
    setDraft((current) => ({ ...current, ...change }));
    setMessage('');
  };
  const updateSeat = (id: NightSeatId, change: Partial<NightSeat>) => update({ seats: { ...draft.seats, [id]: { ...draft.seats[id], ...change } } });
  const updateFlight = (index: number, value: string) => update({ flight: draft.flight.map((coffee, position) => position === index ? value : coffee) as NightRecord['flight'] });
  const updateTally = (key: string, value: string) => {
    const tally = { ...draft.tally };
    if (value === '') delete tally[key];
    else tally[key] = Math.max(0, Math.min(40, Math.floor(Number(value)) || 0));
    update({ tally });
  };
  const updateNumber = (field: 'guests' | 'redeemed', value: string) => update({ [field]: Math.max(0, Math.min(40, Math.floor(Number(value)) || 0)) });

  const save = async (status: 'draft' | 'final') => {
    if (!selectedId) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await saveNightRecord(selectedId, uid, { ...draft, status });
      // Reload so the stored host and creation time travel with every later update, as the Rules require.
      const stored = await loadNightRecord(selectedId);
      setSaved((current) => ({ ...(current ?? {}), [selectedId]: stored }));
      if (stored) setDraft(stored);
      setMessage(status === 'final' ? 'Night record saved as final. You can still edit it.' : 'Night record saved as a draft.');
    } catch {
      setError('We could not save this night record. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const summary = useMemo(() => summariseNight(draft), [draft]);
  const entries: NightEntry[] = useMemo(
    () => sessions.flatMap((session) => saved?.[session.id] ? [{ sessionId: session.id, sessionTitle: session.title, record: saved[session.id] as NightRecord }] : []),
    [sessions, saved],
  );
  const trends = useMemo(() => summariseTrends(entries), [entries]);

  if (saved === undefined) {
    return <section className="panel night-record" aria-live="polite"><p>Loading night records…</p></section>;
  }

  return (
    <section className="night-record" aria-labelledby="night-record-heading">
      <div className="night-record-heading">
        <div><p className="eyebrow">Public Cupping</p><h2 id="night-record-heading">Record a night</h2><p>One record per night. Seat numbers and choices only: no guest names or contact details.</p></div>
        {sessions.length > 1 && (
          <label>Session<select value={selectedId} onChange={(event) => selectSession(event.target.value)}>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select></label>
        )}
      </div>

      <form className="panel night-form" onSubmit={(event) => event.preventDefault()}>
        <div className="night-fields">
          <label>Date<input type="date" value={draft.date} onChange={(event) => update({ date: event.target.value })} /></label>
          <label>Theme<input value={draft.theme} onChange={(event) => update({ theme: event.target.value })} placeholder="e.g. Range Night" /></label>
          <label>Host<input value={draft.host} onChange={(event) => update({ host: event.target.value })} /></label>
          <label>Guests<input type="number" min={0} max={40} value={draft.guests} onChange={(event) => updateNumber('guests', event.target.value)} /></label>
        </div>

        <fieldset className="night-flight">
          <legend>The flight</legend>
          {nightCups.map((cup) => (
            <label key={cup}>Cup {cup} coffee<input value={draft.flight[cup - 1]} onChange={(event) => updateFlight(cup - 1, event.target.value)} /></label>
          ))}
        </fieldset>

        <div className="night-table-wrap">
          <table className="night-seats">
            <caption>Seats</caption>
            <thead><tr><th scope="col">Seat</th><th scope="col">#1 cup</th><th scope="col">Would buy?</th><th scope="col">Bought tonight?</th><th scope="col">Words you heard</th></tr></thead>
            <tbody>
              {nightSeatIds.map((id, index) => {
                const seat = draft.seats[id];
                const label = `Seat ${index + 1}`;
                return (
                  <tr key={id}>
                    <th scope="row">{index + 1}</th>
                    <td><select aria-label={`${label}: #1 cup`} value={seat.cup === null ? '' : String(seat.cup)} onChange={(event) => updateSeat(id, { cup: event.target.value === '' ? null : Number(event.target.value) as NightCup })}><option value="">–</option>{nightCups.map((cup) => <option key={cup} value={cup}>{cup}</option>)}</select></td>
                    <td><select aria-label={`${label}: would buy`} value={seat.buy} onChange={(event) => updateSeat(id, { buy: event.target.value as NightAnswer })}>{answerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                    <td><select aria-label={`${label}: bought tonight`} value={seat.bought} onChange={(event) => updateSeat(id, { bought: event.target.value as NightAnswer })}>{answerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
                    <td><input aria-label={`${label}: words heard`} value={seat.words} maxLength={300} onChange={(event) => updateSeat(id, { words: event.target.value })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="night-lower">
          <fieldset className="night-tally">
            <legend>Room ranking (how many guests ranked each cup)</legend>
            <table>
              <thead><tr><th scope="col"><span className="visually-hidden">Rank</span></th>{nightCups.map((cup) => <th key={cup} scope="col">Cup {cup}</th>)}</tr></thead>
              <tbody>
                {[1, 2, 3, 4].map((rank) => (
                  <tr key={rank}>
                    <th scope="row">Ranked {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : '4th'}</th>
                    {nightCups.map((cup) => <td key={cup}><input type="number" min={0} max={40} aria-label={`Ranked ${rank} for cup ${cup}`} value={draft.tally[`r${rank}c${cup}`] ?? ''} onChange={(event) => updateTally(`r${rank}c${cup}`, event.target.value)} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </fieldset>
          <div className="night-side">
            <label>Unprompted words (one per line)<textarea value={draft.words.join('\n')} onChange={(event) => update({ words: event.target.value.split('\n') })} /></label>
            <label>Redeemed BND 20<input type="number" min={0} max={40} value={draft.redeemed} onChange={(event) => updateNumber('redeemed', event.target.value)} /></label>
            <label>Notes<textarea value={draft.notes} maxLength={1000} onChange={(event) => update({ notes: event.target.value })} /></label>
          </div>
        </div>

        <dl className="night-summary" aria-label="Tonight in numbers">
          <div><dt>Guests with data</dt><dd>{summary.guestsCounted}</dd></div>
          <div><dt>Would buy</dt><dd>{summary.wouldBuyYes}</dd></div>
          <div><dt>Bought</dt><dd>{summary.bought}</dd></div>
          <div><dt>Said yes and bought</dt><dd>{summary.converted} ({percent(summary.conversion)})</dd></div>
          <div><dt>#1 picks, cups 1 to 4</dt><dd>{summary.firstCupCounts.join(' / ')}</dd></div>
        </dl>

        <div className="night-actions">
          <button className="button secondary" type="button" onClick={() => save('draft')} disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button>
          <button className="button primary" type="button" onClick={() => save('final')} disabled={busy}>{busy ? 'Saving…' : 'Save as final'}</button>
          <span className="night-status">{draft.status === 'final' ? 'Status: final' : 'Status: draft'}</span>
        </div>
        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="auth-message" role="alert">{error}</p>}
      </form>

      {entries.length > 0 && (
        <section className="panel night-trends" aria-labelledby="night-trends-heading">
          <div className="night-trends-heading">
            <h3 id="night-trends-heading">Across your nights</h3>
            <button className="button secondary" type="button" onClick={() => downloadCsv('public-cupping-nights.csv', nightRecordsToCsv(entries))}>Download CSV</button>
          </div>
          <p>{trends.nights} {trends.nights === 1 ? 'night' : 'nights'}, {trends.guests} guests, {trends.wouldBuyYes} would buy, {trends.bought} bought. Of those who said yes, {percent(trends.conversion)} bought.</p>
          <div className="night-table-wrap">
            <table className="night-trend-table">
              <thead><tr><th scope="col">Date</th><th scope="col">Theme</th><th scope="col">Guests</th><th scope="col">Would buy</th><th scope="col">Bought</th><th scope="col">Said yes and bought</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {entries.map(({ sessionId, record }) => {
                  const nightSummary = summariseNight(record);
                  return <tr key={sessionId}><th scope="row">{record.date || '–'}</th><td>{record.theme || '–'}</td><td>{record.guests || nightSummary.guestsCounted}</td><td>{nightSummary.wouldBuyYes}</td><td>{nightSummary.bought}</td><td>{percent(nightSummary.conversion)}</td><td>{record.status}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
