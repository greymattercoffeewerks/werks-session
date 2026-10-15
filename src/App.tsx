import { FormEvent, useMemo, useState } from 'react';
import { demoChallenge, demoEnrolment, demoRecords, offerings, sessions } from './data/demo';
import { listMyLearningResources, submitInterest } from './lib/portal';
import type { Challenge, LearningResource, OfferingKind, Role } from './types';

type View = 'home' | 'learn' | 'teach' | 'manage';
type ResourceState = 'idle' | 'loading' | 'loaded' | 'error';

const viewForRole: Record<Role, View> = {
  learner: 'learn',
  instructor: 'teach',
  admin: 'manage',
};

function App() {
  const [view, setView] = useState<View>('home');
  const [interestOffering, setInterestOffering] = useState<OfferingKind>('cupping');
  const [interestMessage, setInterestMessage] = useState('');
  const [challenge, setChallenge] = useState<Challenge>(demoChallenge);

  const openRole = (role: Role) => setView(viewForRole[role]);
  const course = offerings.find((item) => item.id === interestOffering)!;
  const scrollToHomeSection = (sectionId: string) => {
    setView('home');
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  async function onInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await submitInterest({
      offeringId: interestOffering,
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      whatsapp: String(form.get('whatsapp') || ''),
      marketingConsent: form.get('marketingConsent') === 'on',
    });
    setInterestMessage(`You’re on the ${course.title} interest list. We’ll only ask you to create an account after your place is confirmed.`);
    formElement.reset();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="wordmark" onClick={() => setView('home')} aria-label="Werks Sessions home">
          <img src="/grey-matter-design-system/assets/logo-lockup.png" alt="" />
        </button>
        <nav aria-label="Primary navigation">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Sessions</button>
          <button onClick={() => scrollToHomeSection('about')}>About</button>
          <button className={view === 'learn' ? 'active' : ''} onClick={() => openRole('learner')}>My practice</button>
          <button className={view === 'teach' ? 'active' : ''} onClick={() => openRole('instructor')}>Teach</button>
          <button className={view === 'manage' ? 'active' : ''} onClick={() => openRole('admin')}>Manage</button>
        </nav>
      </header>

      {view === 'home' && <Home onAbout={() => scrollToHomeSection('about')} onInterest={(offering) => { setInterestOffering(offering); document.getElementById('interest')?.scrollIntoView({ behavior: 'smooth' }); }} />}
      {view === 'learn' && <Learner challenge={challenge} setChallenge={setChallenge} />}
      {view === 'teach' && <Instructor />}
      {view === 'manage' && <Admin />}

      {view === 'home' && (
        <section id="interest" className="interest-section" aria-labelledby="interest-heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="interest-heading">Register your interest.</h2>
            <p>We announce a date only when the right group is ready. No cancelled public calendar; no unnecessary account wall.</p>
          </div>
          <form className="interest-form" onSubmit={onInterest}>
            <label>Session<select value={interestOffering} onChange={(event) => setInterestOffering(event.target.value as OfferingKind)}><option value="cupping">Public Cupping</option><option value="brew101">Brew 101</option></select></label>
            <label>Name<input required name="name" autoComplete="name" /></label>
            <label>Email<input required type="email" name="email" autoComplete="email" /></label>
            <label>WhatsApp number <span className="optional">optional</span><input name="whatsapp" inputMode="tel" autoComplete="tel" /></label>
            <label className="check"><input type="checkbox" name="marketingConsent" /> Send me occasional Werks Sessions news and future course updates.</label>
            <button className="button primary" type="submit">Join the interest list</button>
            {interestMessage && <p className="form-success" role="status">{interestMessage}</p>}
          </form>
        </section>
      )}

      <footer><span>Grey Matter Coffee Werks</span><span>Built for practice, not performance.</span></footer>
    </div>
  );
}

function Home({ onInterest, onAbout }: { onInterest: (offering: OfferingKind) => void; onAbout: () => void }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Werks Sessions <span>Brunei</span></p>
          <h1>Make room<br />for the <em>cup.</em></h1>
          <p className="hero-copy">Hands-on coffee sessions for people who want to taste more closely, change one thing, and learn what the cup tells them.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => onInterest('cupping')}>Find your next session</button>
            <button className="hero-link" onClick={onAbout}>How Werks Sessions works</button>
          </div>
        </div>
        <figure className="hero-visual" aria-label="Grey Matter Coffee Werks learning table">
          <img className="hero-botanical" src="/grey-matter-design-system/assets/botanical-linework-cream.png" alt="" />
          <div className="hero-visual-copy"><img src="/grey-matter-design-system/assets/logo-mark-white.png" alt="" /><p>Small tables.<br />Real tools.<br />Room to notice.</p></div>
          <figcaption>“Preference is real and it’s yours.”</figcaption>
        </figure>
      </section>
      <section id="about" className="about" aria-labelledby="about-heading">
        <p className="section-marker">About Werks Sessions</p>
        <div className="about-statement"><h2 id="about-heading">Coffee makes more sense when you can compare it, talk about it, and make the next cup yourself.</h2></div>
        <div className="about-detail"><img src="/grey-matter-design-system/assets/logo-mark.png" alt="" /><p>Werks Sessions is Grey Matter Coffee Werks’ hands-on learning table. We work in small groups, with real tools and enough time to notice what changes.</p><p>Start with what you like. The vocabulary can come later. There is no performance to get right—just a clearer next pour.</p></div>
      </section>
      <section className="principles">
        <p className="section-marker">The method</p>
        <div>
          <article><b>01</b><h2>Taste a difference</h2><p>Before theory, before the right answer, there is a cup in front of you.</p></article>
          <article><b>02</b><h2>Name what happened</h2><p>Use useful language, including the words already familiar in the room.</p></article>
          <article><b>03</b><h2>Change one thing</h2><p>Practice a deliberate adjustment, then taste the result.</p></article>
        </div>
      </section>
      <section className="offerings" aria-labelledby="sessions-heading">
        <div className="section-heading"><div><p className="section-marker">Current sessions</p><h2 id="sessions-heading">Built around the table.</h2></div><p>Two places to begin. One shared purpose: more attentive cups at home and together.</p></div>
        <div className="offering-grid">
          {offerings.map((offering) => (
            <article className="offering-card" key={offering.id}>
              <p className="eyebrow">{offering.eyebrow}</p><h3>{offering.title}</h3><p>{offering.description}</p>
              <dl><div><dt>Format</dt><dd>{offering.format}</dd></div><div><dt>Investment</dt><dd>{offering.price}</dd></div><div><dt>Table</dt><dd>{offering.capacity}</dd></div></dl>
              <ul>{offering.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
              <button className="text-button" onClick={() => onInterest(offering.id)}>Join the interest list →</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Learner({ challenge, setChallenge }: { challenge: Challenge; setChallenge: (challenge: Challenge) => void }) {
  const completed = challenge.weeks.filter((week) => week.complete).length;
  const canSubmit = completed === 4;
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [resourceState, setResourceState] = useState<ResourceState>('idle');

  const updateWeek = (weekNumber: number, field: 'coffee' | 'recipe' | 'tastingNote' | 'changeMade', value: string) => {
    setChallenge({ ...challenge, weeks: challenge.weeks.map((week) => week.week === weekNumber ? { ...week, [field]: value } : week) });
  };
  const finishWeek = (weekNumber: number) => {
    setChallenge({ ...challenge, weeks: challenge.weeks.map((week) => week.week === weekNumber ? { ...week, complete: true } : week) });
  };
  async function loadResources() {
    setResourceState('loading');
    try { setResources(await listMyLearningResources()); setResourceState('loaded'); }
    catch { setResourceState('error'); }
  }

  return (
    <main className="dashboard">
      <DashboardHeader title="Welcome back, Maya." subtitle="Your next good cup is a small experiment." />
      <div className="dashboard-grid">
        <section className="panel span-2"><p className="eyebrow">Your next session</p><h2>Manual Brew Foundations</h2><p className="status confirmed">Confirmed · payment received</p><p>We’ll send your exact session time after the second group seat is confirmed. Your account is now ready for the practice that follows.</p><button className="button secondary">View booking details</button></section>
        <section className="panel"><p className="eyebrow">Your record</p>{demoRecords.map((record) => <div className="record" key={record.id}><strong>{record.title}</strong><span>{record.type.replace('_', ' ')} · {record.issuedAt}</span></div>)}<p className="muted">Attendance is a record of taking part, not a competency certificate.</p></section>
      </div>
      <ResourcePanel resources={resources} state={resourceState} eligible={demoEnrolment.status === 'confirmed' || demoEnrolment.status === 'attended' || ['deposit_paid', 'paid'].includes(demoEnrolment.paymentStatus)} onCheck={loadResources} />
      <section className="practice">
        <div className="section-heading"><div><p className="eyebrow">30-day practice</p><h2>Build your own baseline.</h2></div><span className="progress-label">{completed} / 4 weeks recorded</span></div>
        <p>Keep one thing steady, make one change, then write down what you noticed. This completed practice card is the entry point for Brew 102.</p>
        <div className="week-grid">
          {challenge.weeks.map((week) => (
            <article className={week.complete ? 'week-card done' : 'week-card'} key={week.week}>
              <div className="week-title"><span>Week {week.week}</span><strong>{week.focus}</strong></div>
              <label>Coffee<input value={week.coffee} onChange={(event) => updateWeek(week.week, 'coffee', event.target.value)} placeholder="What did you brew?" /></label>
              <label>Recipe<input value={week.recipe} onChange={(event) => updateWeek(week.week, 'recipe', event.target.value)} placeholder="Dose, water, grind" /></label>
              <label>What changed?<textarea value={week.changeMade} onChange={(event) => updateWeek(week.week, 'changeMade', event.target.value)} /></label>
              <label>What did you taste?<textarea value={week.tastingNote} onChange={(event) => updateWeek(week.week, 'tastingNote', event.target.value)} /></label>
              {!week.complete ? <button className="text-button" onClick={() => finishWeek(week.week)}>Mark this week recorded →</button> : <span className="status complete">Recorded</span>}
            </article>
          ))}
        </div>
        <button className="button primary" disabled={!canSubmit || challenge.status === 'submitted'} onClick={() => setChallenge({ ...challenge, status: 'submitted' })}>{challenge.status === 'submitted' ? 'Submitted for review' : 'Submit practice card for review'}</button>
        {!canSubmit && <p className="muted">Complete all four weeks before submitting your practice card.</p>}
      </section>
    </main>
  );
}

function ResourcePanel({ resources, state, eligible, onCheck }: { resources: LearningResource[]; state: ResourceState; eligible: boolean; onCheck: () => void }) {
  return (
    <section className="panel resource-panel">
      <div><p className="eyebrow">Session materials</p><h2>Made available after acceptance.</h2><p>Guides and worksheets are visible only to learners with a paid or confirmed place. Nothing is published here yet.</p></div>
      <div className="resource-actions"><span className={eligible ? 'status confirmed' : 'status proposed'}>{eligible ? 'Accepted learner' : 'Access pending'}</span><button className="button secondary" onClick={onCheck} disabled={state === 'loading'}>{state === 'loading' ? 'Checking materials…' : 'Check my materials'}</button></div>
      {state === 'loaded' && (resources.length ? <ul className="resource-list">{resources.map((resource) => <li key={resource.id}><div><strong>{resource.title}</strong><span>{resource.description} · {resource.format.replace('_', ' ')}</span></div><a className="text-button" href={resource.downloadUrl} target="_blank" rel="noreferrer">Open guide ↗</a></li>)}</ul> : <p className="muted resource-empty">No session material has been published to your account yet.</p>)}
      {state === 'error' && <p className="form-success">We could not confirm resource access. Please sign in with the account used for your booking and try again.</p>}
    </section>
  );
}

function Instructor() {
  return <main className="dashboard"><DashboardHeader title="Teaching table" subtitle="Prepare the next comparison before anyone notices it is coming." /><div className="dashboard-grid"><section className="panel span-2"><p className="eyebrow">Assigned session</p><h2>Manual Brew Foundations</h2><p className="status proposed">1 paid seat · minimum 2 before date confirmation</p><dl className="facts"><div><dt>Venue</dt><dd>Noice, after hours</dd></div><div><dt>Format</dt><dd>3.5 hours · cap 3</dd></div><div><dt>Next action</dt><dd>Follow up with interest list</dd></div></dl><button className="button secondary">Open session checklist</button></section><section className="panel"><p className="eyebrow">Practice review</p><h2>1 waiting</h2><p>Maya Lau submitted all four weeks. Review before opening the Brew 102 interest route.</p><button className="text-button">Review practice card →</button></section></div><section className="panel"><p className="eyebrow">Roster</p><table><thead><tr><th>Learner</th><th>Payment</th><th>Invite</th><th>Attendance</th></tr></thead><tbody><tr><td>Maya Lau</td><td><span className="status confirmed">Paid</span></td><td>Sent</td><td><button className="table-action">Mark when live</button></td></tr><tr><td>Seat 2</td><td>Awaiting confirmation</td><td>—</td><td>—</td></tr></tbody></table></section></main>;
}

function Admin() {
  const proposed = useMemo(() => sessions.filter((session) => session.status === 'proposed'), []);
  return <main className="dashboard"><DashboardHeader title="Operations" subtitle="Keep the calendar honest. Confirm a table only when it is ready." /><div className="metrics"><article><span>Interest leads</span><strong>18</strong><small>7 this month</small></article><article><span>Confirmed learners</span><strong>8</strong><small>Across two sessions</small></article><article><span>Practice completion</span><strong>62%</strong><small>of eligible learners</small></article><article><span>Repeat interest</span><strong>38%</strong><small>101 → next step</small></article></div><section className="panel"><p className="eyebrow">Session readiness</p><table><thead><tr><th>Session</th><th>Status</th><th>Seats</th><th>Decision</th></tr></thead><tbody>{proposed.map((session) => <tr key={session.id}><td>{session.title}</td><td><span className="status proposed">Proposed</span></td><td>{session.confirmedSeats} of {session.minimum} minimum · {session.capacity} cap</td><td><button className="table-action">Open enrolments</button></td></tr>)}</tbody></table></section><section className="dashboard-grid"><section className="panel"><p className="eyebrow">Record integrity</p><h2>Originals are not credentials.</h2><p>Issue attendance after a completed session. Issue challenge completion only after instructor approval. Keep the credential type locked until an assessed, licensed pathway exists.</p></section><section className="panel"><p className="eyebrow">90-day follow-up</p><h2>Measure the real return.</h2><p>Export confirmed cohorts and redemption codes for manual bean-reorder and CafePartners reconciliation. Do not manufacture sales data in the portal.</p></section></section></main>;
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="dashboard-header"><p className="eyebrow">Werks Sessions</p><h1>{title}</h1><p>{subtitle}</p></header>;
}

export default App;
