import { FormEvent, useMemo, useState } from 'react';
import { demoChallenge, demoEnrolment, demoRecords, offerings, sessions } from './data/demo';
import { submitInterest } from './lib/portal';
import type { Challenge, OfferingKind, Role } from './types';

type View = 'home' | 'learn' | 'teach' | 'manage';

const viewForRole: Record<Role, View> = { learner: 'learn', instructor: 'teach', admin: 'manage' };

function App() {
  const [view, setView] = useState<View>('home');
  const [role, setRole] = useState<Role>('learner');
  const [interestOffering, setInterestOffering] = useState<OfferingKind>('cupping');
  const [interestMessage, setInterestMessage] = useState('');
  const [challenge, setChallenge] = useState<Challenge>(demoChallenge);

  const openRole = (nextRole: Role) => { setRole(nextRole); setView(viewForRole[nextRole]); };
  const course = offerings.find((item) => item.id === interestOffering)!;

  async function onInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitInterest({
      offeringId: interestOffering,
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      whatsapp: String(form.get('whatsapp') || ''),
      marketingConsent: form.get('marketingConsent') === 'on',
    });
    setInterestMessage(`You’re on the ${course.title} interest list. We’ll only ask you to create an account after your place is confirmed.`);
    event.currentTarget.reset();
  }

  return <div className="app-shell">
    <header className="site-header">
      <button className="wordmark" onClick={() => setView('home')} aria-label="Werks Sessions home"><span>GREY MATTER</span>WERKS SESSIONS</button>
      <nav aria-label="Primary navigation">
        <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Sessions</button>
        <button onClick={() => openRole('learner')}>My practice</button>
        <button onClick={() => openRole('instructor')}>Teach</button>
        <button onClick={() => openRole('admin')}>Manage</button>
      </nav>
    </header>

    {view === 'home' && <Home onInterest={(offering) => { setInterestOffering(offering); document.getElementById('interest')?.scrollIntoView({ behavior: 'smooth' }); }} />}
    {view === 'learn' && <Learner challenge={challenge} setChallenge={setChallenge} />}
    {view === 'teach' && <Instructor />}
    {view === 'manage' && <Admin />}

    {view === 'home' && <section id="interest" className="interest-section" aria-labelledby="interest-heading">
      <div><p className="eyebrow">Start here</p><h2 id="interest-heading">Register your interest.</h2><p>We announce a date only when the right group is ready. No cancelled public calendar; no unnecessary account wall.</p></div>
      <form className="interest-form" onSubmit={onInterest}>
        <label>Session<select value={interestOffering} onChange={(event) => setInterestOffering(event.target.value as OfferingKind)}><option value="cupping">Public Cupping</option><option value="brew101">Brew 101</option></select></label>
        <label>Name<input required name="name" autoComplete="name" /></label>
        <label>Email<input required type="email" name="email" autoComplete="email" /></label>
        <label>WhatsApp number <span className="optional">optional</span><input name="whatsapp" inputMode="tel" autoComplete="tel" /></label>
        <label className="check"><input type="checkbox" name="marketingConsent" /> Send me occasional Werks Sessions news and future course updates.</label>
        <button className="button primary" type="submit">Join the interest list</button>
        {interestMessage && <p className="form-success" role="status">{interestMessage}</p>}
      </form>
    </section>}

    <footer><span>Grey Matter Coffee Werks</span><span>Built for practice, not performance.</span></footer>
  </div>;
}

function Home({ onInterest }: { onInterest: (offering: OfferingKind) => void }) {
  return <main>
    <section className="hero"><div><p className="eyebrow">Hands-on coffee learning · Brunei</p><h1>Taste first.<br /><em>Learn by doing.</em></h1><p className="hero-copy">Small tables, real tools, and enough room to notice what changes. Werks Sessions begins with Public Cupping and Brew 101.</p><button className="button primary" onClick={() => onInterest('cupping')}>Find your next session <span>→</span></button></div><aside className="hero-note"><p>“Preference is real and it’s yours.”</p><span>— the starting point for every table</span></aside></section>
    <section className="principles"><p className="eyebrow">The method</p><div><article><b>01</b><h2>Taste a difference</h2><p>Before theory, before the right answer, there is a cup in front of you.</p></article><article><b>02</b><h2>Name what happened</h2><p>Use useful language, including the words already familiar in the room.</p></article><article><b>03</b><h2>Change one thing</h2><p>Practice a deliberate adjustment, then taste the result.</p></article></div></section>
    <section className="offerings" aria-labelledby="sessions-heading"><div className="section-heading"><p className="eyebrow">Current sessions</p><h2 id="sessions-heading">Built around the table.</h2></div><div className="offering-grid">{offerings.map((offering) => <article className="offering-card" key={offering.id}><p className="eyebrow">{offering.eyebrow}</p><h3>{offering.title}</h3><p>{offering.description}</p><dl><div><dt>Format</dt><dd>{offering.format}</dd></div><div><dt>Investment</dt><dd>{offering.price}</dd></div><div><dt>Table</dt><dd>{offering.capacity}</dd></div></dl><ul>{offering.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul><button className="text-button" onClick={() => onInterest(offering.id)}>Join the interest list →</button></article>)}</div></section>
  </main>;
}

function Learner({ challenge, setChallenge }: { challenge: Challenge; setChallenge: (challenge: Challenge) => void }) {
  const completed = challenge.weeks.filter((week) => week.complete).length;
  const canSubmit = completed === 4;
  const updateWeek = (weekNumber: number, field: 'coffee' | 'recipe' | 'tastingNote' | 'changeMade', value: string) => setChallenge({ ...challenge, weeks: challenge.weeks.map((week) => week.week === weekNumber ? { ...week, [field]: value } : week) });
  const finishWeek = (weekNumber: number) => setChallenge({ ...challenge, weeks: challenge.weeks.map((week) => week.week === weekNumber ? { ...week, complete: true } : week) });
  return <main className="dashboard"><DashboardHeader title="Welcome back, Maya." subtitle="Your next good cup is a small experiment." /><div className="dashboard-grid"><section className="panel span-2"><p className="eyebrow">Your next session</p><h2>Manual Brew Foundations</h2><p className="status confirmed">Confirmed · payment received</p><p>We’ll send your exact session time after the second group seat is confirmed. Your account is now ready for the practice that follows.</p><button className="button secondary">View booking details</button></section><section className="panel"><p className="eyebrow">Your record</p>{demoRecords.map((record) => <div className="record" key={record.id}><strong>{record.title}</strong><span>{record.type.replace('_', ' ')} · {record.issuedAt}</span></div>)}<p className="muted">Attendance is a record of taking part, not a competency certificate.</p></section></div><section className="practice"><div className="section-heading"><div><p className="eyebrow">30-day practice</p><h2>Build your own baseline.</h2></div><span className="progress-label">{completed} / 4 weeks recorded</span></div><p>Keep one thing steady, make one change, then write down what you noticed. This completed practice card is the entry point for Brew 102.</p><div className="week-grid">{challenge.weeks.map((week) => <article className={week.complete ? 'week-card done' : 'week-card'} key={week.week}><div className="week-title"><span>Week {week.week}</span><strong>{week.focus}</strong></div><label>Coffee<input value={week.coffee} onChange={(event) => updateWeek(week.week, 'coffee', event.target.value)} placeholder="What did you brew?" /></label><label>Recipe<input value={week.recipe} onChange={(event) => updateWeek(week.week, 'recipe', event.target.value)} placeholder="Dose, water, grind" /></label><label>What changed?<textarea value={week.changeMade} onChange={(event) => updateWeek(week.week, 'changeMade', event.target.value)} /></label><label>What did you taste?<textarea value={week.tastingNote} onChange={(event) => updateWeek(week.week, 'tastingNote', event.target.value)} /></label>{!week.complete ? <button className="text-button" onClick={() => finishWeek(week.week)}>Mark this week recorded →</button> : <span className="status complete">Recorded</span>}</article>)}</div><button className="button primary" disabled={!canSubmit || challenge.status === 'submitted'} onClick={() => setChallenge({ ...challenge, status: 'submitted' })}>{challenge.status === 'submitted' ? 'Submitted for review' : 'Submit practice card for review'}</button>{!canSubmit && <p className="muted">Complete all four weeks before submitting your practice card.</p>}</section></main>;
}

function Instructor() {
  return <main className="dashboard"><DashboardHeader title="Teaching table" subtitle="Prepare the next comparison before anyone notices it is coming." /><div className="dashboard-grid"><section className="panel span-2"><p className="eyebrow">Assigned session</p><h2>Manual Brew Foundations</h2><p className="status proposed">1 paid seat · minimum 2 before date confirmation</p><dl className="facts"><div><dt>Venue</dt><dd>Noice, after hours</dd></div><div><dt>Format</dt><dd>3.5 hours · cap 3</dd></div><div><dt>Next action</dt><dd>Follow up with interest list</dd></div></dl><button className="button secondary">Open session checklist</button></section><section className="panel"><p className="eyebrow">Practice review</p><h2>1 waiting</h2><p>Maya Lau submitted all four weeks. Review before opening the Brew 102 interest route.</p><button className="text-button">Review practice card →</button></section></div><section className="panel"><p className="eyebrow">Roster</p><table><thead><tr><th>Learner</th><th>Payment</th><th>Invite</th><th>Attendance</th></tr></thead><tbody><tr><td>Maya Lau</td><td><span className="status confirmed">Paid</span></td><td>Sent</td><td><button className="table-action">Mark when live</button></td></tr><tr><td>Seat 2</td><td>Awaiting confirmation</td><td>—</td><td>—</td></tr></tbody></table></section></main>;
}

function Admin() {
  const proposed = useMemo(() => sessions.filter((session) => session.status === 'proposed'), []);
  return <main className="dashboard"><DashboardHeader title="Operations" subtitle="Keep the calendar honest. Confirm a table only when it is ready." /><div className="metrics"><article><span>Interest leads</span><strong>18</strong><small>7 this month</small></article><article><span>Confirmed learners</span><strong>8</strong><small>Across two sessions</small></article><article><span>Practice completion</span><strong>62%</strong><small>of eligible learners</small></article><article><span>Repeat interest</span><strong>38%</strong><small>101 → next step</small></article></div><section className="panel"><p className="eyebrow">Session readiness</p><table><thead><tr><th>Session</th><th>Status</th><th>Seats</th><th>Decision</th></tr></thead><tbody>{proposed.map((session) => <tr key={session.id}><td>{session.title}</td><td><span className="status proposed">Proposed</span></td><td>{session.confirmedSeats} of {session.minimum} minimum · {session.capacity} cap</td><td><button className="table-action">Open enrolments</button></td></tr>)}</tbody></table></section><section className="dashboard-grid"><section className="panel"><p className="eyebrow">Record integrity</p><h2>Originals are not credentials.</h2><p>Issue attendance after a completed session. Issue challenge completion only after instructor approval. Keep the credential type locked until an assessed, licensed pathway exists.</p></section><section className="panel"><p className="eyebrow">90-day follow-up</p><h2>Measure the real return.</h2><p>Export confirmed cohorts and redemption codes for manual bean-reorder and CafePartners reconciliation. Do not manufacture sales data in the portal.</p></section></section></main>;
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) { return <header className="dashboard-header"><p className="eyebrow">Werks Sessions</p><h1>{title}</h1><p>{subtitle}</p></header>; }

export default App;
