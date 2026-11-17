import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { offerings } from './data/demo';
import { sessionsEmail } from './lib/contact';
import { loadPublicSchedule } from './lib/schedule';
import { formatScheduleDate, scheduleDateParts, scheduleStatusLabels, upcomingItems, type ScheduleItem } from './lib/schedule-model';
import type { OfferingKind } from './types';

const LearnerAccess = lazy(() => import('./access/LearnerAccess'));

type View = 'home' | 'access';

function interestEmailHref(offering: OfferingKind): string {
  const course = offerings.find((item) => item.id === offering)!;
  const subject = `Ask about ${course.title}`;
  const body = `Hello Werks Sessions,\n\nI would like to ask about ${course.title}.\n\nName:\nPreferred contact:\nWhat I would like to know:\n\nThank you.`;
  return `mailto:${sessionsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function scheduleEnquiryHref(item: ScheduleItem): string {
  const when = formatScheduleDate(item.date);
  const subject = `Ask about ${item.title}${when ? ` on ${when}` : ''}`;
  const body = `Hello Werks Sessions,

I would like to ask about ${item.title}${when ? ` on ${when}` : ''}.

Name:
Preferred contact:
What I would like to know:

Thank you.`;
  return `mailto:${sessionsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function App() {
  const [view, setView] = useState<View>('home');
  const [schedule, setSchedule] = useState<ScheduleItem[] | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    loadPublicSchedule().then((items) => { if (!cancelled) setSchedule(items); });
    return () => { cancelled = true; };
  }, []);
  const [interestOffering, setInterestOffering] = useState<OfferingKind>('cupping');
  const course = offerings.find((item) => item.id === interestOffering)!;
  const scrollToHomeSection = (sectionId: string) => {
    setView('home');
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="wordmark" onClick={() => setView('home')} aria-label="Werks Sessions home">
          <img src="/grey-matter-design-system/assets/logo-lockup.png" alt="" />
        </button>
        <nav aria-label="Primary navigation">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Sessions</button>
          <button onClick={() => scrollToHomeSection('about')}>About</button>
          <button className={view === 'access' ? 'active' : ''} onClick={() => setView('access')}>Learner access</button>
        </nav>
      </header>

      {view === 'home' && <Home onAbout={() => scrollToHomeSection('about')} onInterest={(offering) => { setInterestOffering(offering); document.getElementById('interest')?.scrollIntoView({ behavior: 'smooth' }); }} />}
      {view === 'access' && (
        <AccessBoundary>
          <Suspense fallback={<AccessLoading />}>
            <LearnerAccess />
          </Suspense>
        </AccessBoundary>
      )}

      {view === 'home' && <UpcomingDates items={schedule} />}

      {view === 'home' && (
        <section id="interest" className="interest-section" aria-labelledby="interest-heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="interest-heading">Ask about the next table.</h2>
            <p>Choose a session and send us a short email. We will reply personally to discuss the right table, a possible date, and the next step.</p>
          </div>
          <div className="interest-form">
            <label>Choose a session<select value={interestOffering} onChange={(event) => setInterestOffering(event.target.value as OfferingKind)}>{offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.title}</option>)}</select></label>
            <p>Tell us what you would like to know, and we will help you find the right table.</p>
            <a className="button primary" href={interestEmailHref(interestOffering)}>Ask about {course.title}</a>
            <p className="form-success">This opens your email app. It does not create an account or reserve a place.</p>
          </div>
        </section>
      )}

      <footer><span>Grey Matter Coffee Werks</span><span>Built for practice, not performance.</span></footer>
    </div>
  );
}

function UpcomingDates({ items }: { items: ScheduleItem[] | undefined }) {
  if (items === undefined) {
    return null;
  }
  const upcoming = upcomingItems(items);
  return (
    <section id="dates" className="dates-section" aria-labelledby="dates-heading">
      <div className="section-heading"><div><p className="section-marker">Coming up</p><h2 id="dates-heading">Next tables.</h2></div><p>Dates are a guide until we confirm by email. Ask and we will tell you first.</p></div>
      {upcoming.length === 0
        ? <p className="dates-empty">No dates announced yet. Ask about a session and we will tell you when the next table is set.</p>
        : (
          <ol className="dates-list">
            {upcoming.map((item) => {
              const parts = scheduleDateParts(item.date);
              const offering = offerings.find((entry) => entry.id === item.offeringId);
              const details = [item.time, item.venue].filter(Boolean).join(' · ');
              return (
                <li className="date-card" key={item.id}>
                  <div className="date-card-when" aria-label={parts ? formatScheduleDate(item.date) : 'Date to be confirmed'}>
                    {parts ? <><span>{parts.weekday}</span><strong>{parts.day}</strong><span>{parts.month}</span></> : <strong className="date-card-tbc">TBC</strong>}
                  </div>
                  <div className="date-card-main">
                    <p className="eyebrow">{offering?.title ?? 'Werks Sessions'}</p>
                    <h3>{item.title}</h3>
                    {details && <p className="date-card-details">{details}</p>}
                    {item.note && <p className="date-card-note">{item.note}</p>}
                  </div>
                  <div className="date-card-side">
                    <span className={`date-status date-status-${item.status}`}>{scheduleStatusLabels[item.status]}</span>
                    <a className="text-button" href={scheduleEnquiryHref(item)}>Ask about this date →</a>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
    </section>
  );
}

function Home({ onInterest, onAbout }: { onInterest: (offering: OfferingKind) => void; onAbout: () => void }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Werks Sessions <span>Brunei</span></p>
          <h1>Make room<br />for the <em>cup.</em></h1>
          <p className="hero-copy">Hands-on coffee sessions for people who want to taste more closely, make one useful change, and understand what the cup is telling them.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => onInterest('cupping')}>Explore the sessions</button>
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
        <div className="about-statement"><p className="section-marker">About Werks Sessions</p><h2 id="about-heading">Small coffee sessions that make the next cup easier to understand.</h2></div>
        <div className="about-detail"><img src="/grey-matter-design-system/assets/logo-mark.png" alt="" /><p>Werks Sessions is Grey Matter Coffee Werks’ hands-on learning table. In small groups, you taste coffees side by side, compare what changed, and make one deliberate adjustment at a time.</p><p>Start with what you like. From there, we make the cup easier to read—and the next cup easier to make.</p></div>
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
        <div className="section-heading"><div><p className="section-marker">Current sessions</p><h2 id="sessions-heading">Choose a place to begin.</h2></div><p>Start with a tasting table, or go deeper with a practical manual-brew session.</p></div>
        <div className="offering-grid">
          {offerings.map((offering) => (
            <article className="offering-card" key={offering.id}>
              <p className="eyebrow">{offering.eyebrow}</p><h3>{offering.title}</h3><p>{offering.description}</p>
              <dl><div><dt>Format</dt><dd>{offering.format}</dd></div><div><dt>Investment</dt><dd>{offering.price}</dd></div><div><dt>Table</dt><dd>{offering.capacity}</dd></div></dl>
              <ul>{offering.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
              {offering.teaser && (
                <details className="offering-teaser">
                  <summary>{offering.teaser.summary}</summary>
                  <p>{offering.teaser.lead}</p>
                  <ol>{offering.teaser.beats.map((beat) => <li key={beat}>{beat}</li>)}</ol>
                  <p className="offering-teaser-note">{offering.teaser.note}</p>
                </details>
              )}
              <button className="text-button" onClick={() => onInterest(offering.id)}>Ask about {offering.title} →</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

/**
 * Shown while the signed-in app is fetched. It is the only part of that experience in the public bundle.
 */
function AccessLoading() {
  return (
    <main className="dashboard auth-page" role="status">
      <header className="dashboard-header">
        <p className="eyebrow">Werks Sessions</p>
        <h1>Opening learner access.</h1>
        <p>Checking whether this browser is already signed in.</p>
      </header>
    </main>
  );
}

/**
 * Keeps a failed chunk download from unmounting the whole page. The public shell is
 * already rendered and must survive an offline or stale-asset failure.
 */
class AccessBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="dashboard auth-page" role="alert">
          <header className="dashboard-header">
            <p className="eyebrow">Werks Sessions</p>
            <h1>We could not open learner access.</h1>
            <p>Check your connection, then reload the page.</p>
          </header>
          <button className="button secondary" type="button" onClick={() => window.location.reload()}>Reload</button>
        </main>
      );
    }
    return this.props.children;
  }
}

export default App;
