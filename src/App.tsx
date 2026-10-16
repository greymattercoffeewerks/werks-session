import { FormEvent, useEffect, useState } from 'react';
import { offerings } from './data/demo';
import { firebaseConfigured } from './lib/firebase';
import {
  completeEmailLink,
  firebaseIdentity,
  isEmailLink,
  pendingSignInEmail,
  requestEmailLink,
} from './lib/identity';
import { submitInterest } from './lib/portal';
import type { Actor, OfferingKind } from './types';

type View = 'home' | 'auth' | 'account';
type AuthState = 'idle' | 'sending' | 'sent' | 'completing' | 'error';

function App() {
  const [view, setView] = useState<View>('home');
  const [actor, setActor] = useState<Actor | null>(null);
  const [authError, setAuthError] = useState('');
  const [interestOffering, setInterestOffering] = useState<OfferingKind>('cupping');
  const [interestMessage, setInterestMessage] = useState('');

  useEffect(() => firebaseIdentity.observe((nextActor, error) => {
    setActor(nextActor);
    if (nextActor) {
      setAuthError('');
      setView('account');
    } else if (error) {
      setAuthError(error);
      setView('auth');
    }
  }), []);

  useEffect(() => {
    if (isEmailLink()) setView('auth');
  }, []);

  const course = offerings.find((item) => item.id === interestOffering)!;
  const scrollToHomeSection = (sectionId: string) => {
    setView('home');
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  async function onInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitInterest({
        offeringId: interestOffering,
        name: String(form.get('name') || ''),
        email: String(form.get('email') || ''),
        whatsapp: String(form.get('whatsapp') || ''),
        marketingConsent: form.get('marketingConsent') === 'on',
      });
      setInterestMessage(`You’re on the ${course.title} interest list. We’ll only ask you to create an account after your place is confirmed.`);
      formElement.reset();
    } catch {
      setInterestMessage('We could not save your interest right now. Please try again shortly.');
    }
  }

  async function onSignOut() {
    await firebaseIdentity.signOut();
    setActor(null);
    setView('home');
  }

  const privateLabel = actor?.role === 'admin' ? 'Manage' : actor?.role === 'instructor' ? 'Teach' : 'My practice';

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="wordmark" onClick={() => setView('home')} aria-label="Werks Sessions home">
          <img src="/grey-matter-design-system/assets/logo-lockup.png" alt="" />
        </button>
        <nav aria-label="Primary navigation">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Sessions</button>
          <button onClick={() => scrollToHomeSection('about')}>About</button>
          {actor ? (
            <>
              <button className={view === 'account' ? 'active' : ''} onClick={() => setView('account')}>{privateLabel}</button>
              <button onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <button className={view === 'auth' ? 'active' : ''} onClick={() => setView('auth')}>Sign in</button>
          )}
        </nav>
      </header>

      {view === 'home' && <Home onAbout={() => scrollToHomeSection('about')} onInterest={(offering) => { setInterestOffering(offering); document.getElementById('interest')?.scrollIntoView({ behavior: 'smooth' }); }} />}
      {view === 'auth' && <SignIn error={authError} />}
      {view === 'account' && actor && <Account actor={actor} />}

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

function SignIn({ error }: { error: string }) {
  const [completing, setCompleting] = useState(() => isEmailLink());
  const [email, setEmail] = useState(() => pendingSignInEmail());
  const [state, setState] = useState<AuthState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (error) {
      setState('error');
      setMessage(error);
    }
  }, [error]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(completing ? 'completing' : 'sending');
    setMessage('');
    try {
      if (completing) {
        await completeEmailLink(email);
      } else {
        await requestEmailLink(email);
        setState('sent');
        setMessage('Check your email for a secure sign-in link. It may take a few minutes to arrive.');
      }
    } catch (submissionError) {
      setState('error');
      setMessage(submissionError instanceof Error ? submissionError.message : 'We could not complete sign-in. Please try again.');
      if (completing) setCompleting(false);
    }
  }

  return (
    <main className="dashboard auth-page">
      <DashboardHeader title={completing ? 'Complete your sign-in.' : 'Your account, when your place is ready.'} subtitle="Werks Sessions uses a password-free sign-in link sent to the email used for your booking." />
      <section className="panel auth-panel">
        {!firebaseConfigured ? <p className="form-success" role="status">Account access is not configured in this preview. The public sessions experience remains available.</p> : (
          <form className="interest-form" onSubmit={onSubmit}>
            <label>Email used for your booking<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
            <button className="button primary" type="submit" disabled={state === 'sending' || state === 'completing'}>
              {state === 'sending' ? 'Sending secure link…' : state === 'completing' ? 'Completing sign-in…' : completing ? 'Complete sign-in' : 'Email me a sign-in link'}
            </button>
            {message && <p className="form-success" role="status">{message}</p>}
          </form>
        )}
      </section>
    </main>
  );
}

function Account({ actor }: { actor: Actor }) {
  const isLearner = actor.role === 'learner';
  const roleTitle = actor.role === 'admin' ? 'Operations access' : actor.role === 'instructor' ? 'Teaching access' : 'Learner access';
  return (
    <main className="dashboard">
      <DashboardHeader title={`Welcome, ${actor.displayName}.`} subtitle="Your access is linked to the email you used for Werks Sessions." />
      <section className="panel">
        <p className="eyebrow">{roleTitle}</p>
        <h2>Your account is active.</h2>
        <p>{isLearner
          ? 'Your confirmed booking, session materials, and practice card will appear here once staff have prepared your place.'
          : 'Your private workspace will appear here as the cohort operations tools are introduced.'}</p>
        <p className="muted">Signed in as {actor.email}.</p>
      </section>
    </main>
  );
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="dashboard-header"><p className="eyebrow">Werks Sessions</p><h1>{title}</h1><p>{subtitle}</p></header>;
}

export default App;
