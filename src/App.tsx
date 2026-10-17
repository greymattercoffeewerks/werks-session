import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { offerings } from './data/demo';
import { authErrorMessage, observeAccount, signInWithGoogle, signOut } from './lib/google-auth';
import { loadLearnerAccess, type LearnerAccess as LearnerAccessState } from './lib/learner-access';
import type { OfferingKind } from './types';

type View = 'home' | 'access';

const sessionsEmail = 'greymatter.cw@outlook.com';

function interestEmailHref(offering: OfferingKind): string {
  const course = offerings.find((item) => item.id === offering)!;
  const subject = `Werks Sessions interest - ${course.title}`;
  const body = `Hello Werks Sessions,\n\nI would like to hear about ${course.title}.\n\nName:\nPreferred contact:\n\nThank you.`;
  return `mailto:${sessionsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function App() {
  const [view, setView] = useState<View>('home');
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
      {view === 'access' && <LearnerAccess />}

      {view === 'home' && (
        <section id="interest" className="interest-section" aria-labelledby="interest-heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="interest-heading">Register your interest.</h2>
            <p>We announce a date only when the right group is ready. No cancelled public calendar; no unnecessary account wall.</p>
          </div>
          <div className="interest-form">
            <label>Session<select value={interestOffering} onChange={(event) => setInterestOffering(event.target.value as OfferingKind)}><option value="cupping">Public Cupping</option><option value="brew101">Brew 101</option></select></label>
            <p>Tell us which session you are considering. We will confirm the right table, date, and next step personally.</p>
            <a className="button primary" href={interestEmailHref(interestOffering)}>Email us about {course.title}</a>
            <p className="form-success">This opens your email app. It does not create an account or reserve a place.</p>
          </div>
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

function LearnerAccess() {
  const [account, setAccount] = useState<User | null | undefined>(undefined);
  const [learnerAccess, setLearnerAccess] = useState<LearnerAccessState | undefined>(undefined);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => observeAccount(setAccount), []);

  useEffect(() => {
    if (!account) {
      setLearnerAccess(undefined);
      return undefined;
    }

    let cancelled = false;
    setLearnerAccess(undefined);
    setError('');
    loadLearnerAccess(account.uid)
      .then((access) => {
        if (!cancelled) {
          setLearnerAccess(access);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('We could not check your learner access. Please try again or contact Werks Sessions.');
          setLearnerAccess({ state: 'pending' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [account]);

  const continueWithGoogle = async () => {
    setError('');
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setIsSigningIn(false);
    }
  };

  const leaveAccount = async () => {
    setError('');
    try {
      await signOut();
    } catch (signOutError) {
      setError(authErrorMessage(signOutError));
    }
  };

  if (account === undefined) {
    return (
      <main className="dashboard auth-page">
        <DashboardHeader title="Checking learner access." subtitle="We are confirming whether this browser is already signed in." />
      </main>
    );
  }

  if (account) {
    if (learnerAccess === undefined) {
      return (
        <main className="dashboard auth-page">
          <DashboardHeader title="Checking confirmed sessions." subtitle={`Signed in as ${account.email ?? 'your Google account'}.`} />
          <section className="panel auth-panel" aria-live="polite"><p>Reading the sessions staff have confirmed for you.</p></section>
        </main>
      );
    }

    if (learnerAccess.state === 'confirmed' && learnerAccess.sessions.length > 0) {
      return (
        <main className="dashboard learner-page">
          <DashboardHeader title="Your confirmed sessions." subtitle="Your table details are ready. Practice will open here after Brew 101." />
          <section className="session-list" aria-labelledby="confirmed-sessions-heading">
            <div className="session-list-heading"><p className="eyebrow">Confirmed booking</p><h2 id="confirmed-sessions-heading">Your table</h2></div>
            {learnerAccess.sessions.map((session) => (
              <article className="panel session-card" key={session.id}>
                <div><p className="eyebrow">Werks Sessions</p><h3>{session.title}</h3><p>This session is confirmed for the Google account you signed in with.</p></div>
                <span className="status confirmed">Confirmed</span>
              </article>
            ))}
          </section>
          <section className="practice-preview" aria-labelledby="practice-preview-heading">
            <div><p className="eyebrow">Brew 101 follow-through</p><h2 id="practice-preview-heading">Four weeks of closer cups.</h2><p>After your table, this is where you will record one useful observation and one deliberate change each week. There is nothing to submit yet.</p></div>
            <ol className="practice-weeks">
              {['Notice the cup', 'Change one thing', 'Compare the result', 'Keep the next step'].map((label, index) => (
                <li key={label}><span>Week {index + 1}</span><strong>{label}</strong><small>Opens after Brew 101</small></li>
              ))}
            </ol>
          </section>
          <button className="button secondary learner-sign-out" onClick={leaveAccount}>Sign out</button>
          {error && <p className="auth-message" role="alert">{error}</p>}
        </main>
      );
    }

    return (
      <main className="dashboard auth-page">
        <DashboardHeader title="Access is being arranged." subtitle={`Signed in as ${account.email ?? 'your Google account'}.`} />
        <section className="panel auth-panel" aria-labelledby="pending-access-heading">
          <p className="eyebrow">Booking confirmation required</p>
          <h2 id="pending-access-heading">Signing in does not create learner access.</h2>
          <p>{learnerAccess.state === 'confirmed' ? 'Your learner access is active, but there are no confirmed sessions to show yet. Werks Sessions will add the agreed session personally.' : 'Once your place is confirmed, Werks Sessions will add access to the session you have booked. Until then, there is no course material or cohort data here.'}</p>
          <button className="button secondary" onClick={leaveAccount}>Sign out</button>
          {error && <p className="auth-message" role="alert">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard auth-page">
      <DashboardHeader title="Learner access follows a confirmed booking." subtitle="Sign in with the Google account you gave Werks Sessions. Signing in does not create a place or learner access." />
      <section className="panel auth-panel">
        <p className="eyebrow">Learner sign-in</p>
        <h2>Use the Google account connected to your booking.</h2>
        <p>Access is confirmed personally after payment and a place are agreed. There is no self-service enrolment or public course library.</p>
        <button className="button primary" onClick={continueWithGoogle} disabled={isSigningIn}>
          {isSigningIn ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <p className="auth-note">Need to confirm your booking or the right email address? <a href={`mailto:${sessionsEmail}?subject=${encodeURIComponent('Werks Sessions learner access')}`}>Contact Werks Sessions</a>.</p>
        {error && <p className="auth-message" role="alert">{error}</p>}
      </section>
    </main>
  );
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="dashboard-header"><p className="eyebrow">Werks Sessions</p><h1>{title}</h1><p>{subtitle}</p></header>;
}

export default App;
