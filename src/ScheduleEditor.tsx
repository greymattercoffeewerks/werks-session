import { useEffect, useState } from 'react';
import { offerings } from './data/demo';
import { loadPublicScheduleForEditing, savePublicSchedule } from './lib/schedule';
import { emptyScheduleItem, maxScheduleItems, scheduleStatuses, scheduleStatusLabels, type ScheduleItem, type ScheduleStatus } from './lib/schedule-model';
import type { OfferingKind } from './types';

function newId(): string {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Staff editor for the upcoming dates shown on the public front page. Everything entered here is visible to
 * everyone who opens the site, so it takes dates, venues, and status labels only.
 */
export function ScheduleEditor() {
  const [items, setItems] = useState<ScheduleItem[] | undefined>(undefined);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadPublicScheduleForEditing()
      .then((loaded) => { if (!cancelled) setItems(loaded); })
      .catch(() => { if (!cancelled) { setLoadFailed(true); setItems([]); } });
    return () => { cancelled = true; };
  }, []);

  const change = (id: string, patch: Partial<ScheduleItem>) => {
    setItems((current) => (current ?? []).map((item) => item.id === id ? { ...item, ...patch } : item));
    setMessage('');
  };
  const add = () => {
    setItems((current) => [...(current ?? []), emptyScheduleItem(newId())]);
    setMessage('');
  };
  const remove = (id: string) => {
    setItems((current) => (current ?? []).filter((item) => item.id !== id));
    setMessage('');
  };

  const publish = async () => {
    if (!items) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await savePublicSchedule(items);
      setMessage('Published. The front page shows these dates now, and past dates hide on their own.');
    } catch {
      setError('We could not publish the dates. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (items === undefined) {
    return <section className="panel schedule-editor" aria-live="polite"><p>Loading the published dates…</p></section>;
  }

  return (
    <section className="schedule-editor" aria-labelledby="schedule-editor-heading">
      <div className="night-record-heading">
        <div>
          <p className="eyebrow">Public front page</p>
          <h2 id="schedule-editor-heading">Upcoming dates</h2>
          <p>Everyone who visits the site sees these. Dates, venue, and a status label only: no names or guest details. Rows without a title are not published.</p>
        </div>
        <button className="button secondary" type="button" onClick={add} disabled={items.length >= maxScheduleItems || loadFailed}>Add a date</button>
      </div>

      {loadFailed && <p className="auth-message" role="alert">We could not load the dates that are already published, so editing is switched off to protect them. Please refresh and try again.</p>}

      <form className="panel schedule-form" onSubmit={(event) => event.preventDefault()}>
        {items.length === 0 && !loadFailed && <p className="schedule-empty">No dates are published. Use “Add a date”, then publish.</p>}
        {items.map((item, index) => (
          <fieldset className="schedule-row" key={item.id} disabled={loadFailed || busy}>
            <legend>Date {index + 1}</legend>
            <label>Session<select value={item.offeringId} onChange={(event) => change(item.id, { offeringId: event.target.value as OfferingKind })}>{offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.title}</option>)}</select></label>
            <label>Title<input value={item.title} maxLength={80} onChange={(event) => change(item.id, { title: event.target.value })} placeholder="e.g. Range Night" /></label>
            <label>Date<input type="date" value={item.date} onChange={(event) => change(item.id, { date: event.target.value })} /></label>
            <label>Time<input value={item.time} maxLength={20} onChange={(event) => change(item.id, { time: event.target.value })} placeholder="e.g. 8:00 pm" /></label>
            <label>Venue<input value={item.venue} maxLength={80} onChange={(event) => change(item.id, { venue: event.target.value })} placeholder="e.g. Noice, after hours" /></label>
            <label>Status<select value={item.status} onChange={(event) => change(item.id, { status: event.target.value as ScheduleStatus })}>{scheduleStatuses.map((status) => <option key={status} value={status}>{scheduleStatusLabels[status]}</option>)}</select></label>
            <label className="schedule-note">Note (optional)<input value={item.note} maxLength={200} onChange={(event) => change(item.id, { note: event.target.value })} /></label>
            <button className="text-button schedule-remove" type="button" onClick={() => remove(item.id)}>Remove date {index + 1}</button>
          </fieldset>
        ))}
        <div className="night-actions">
          <button className="button primary" type="button" onClick={publish} disabled={busy || loadFailed}>{busy ? 'Publishing…' : 'Publish dates'}</button>
        </div>
        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="auth-message" role="alert">{error}</p>}
      </form>
    </section>
  );
}
