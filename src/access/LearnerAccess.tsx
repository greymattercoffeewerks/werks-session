import { Fragment, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { sessionsEmail } from '../lib/contact';
import { authErrorMessage, observeAccount, signInWithGoogle, signOut } from '../lib/google-auth';
import { loadInstructorAccess, type InstructorAccess } from '../lib/instructor-access';
import {
  loadLearnerAccess,
  type ConfirmedSession as LearnerAccessSession,
  type LearnerAccess as LearnerAccessState,
} from '../lib/learner-access';
import { hasPracticeRecord } from '../lib/offering';
import {
  loadPracticeChallenge,
  practiceWeekIds,
  savePracticeChallenge,
  startPracticeChallenge,
  submitPracticeWeek,
  type PracticeChallenge,
  type PracticeWeek,
  type PracticeWeekId,
} from '../lib/practice';
import { navigate, usePathname } from '../lib/router';
import { loadSessionGuide, type SessionGuide } from '../lib/session-guide';
import { InstructorShell, type ReviewOutcome } from './InstructorPages';
import { DashboardHeader, InstructorFeedback, weekNames } from './dashboard';

function LearnerAccess() {
  const [account, setAccount] = useState<User | null | undefined>(undefined);
  const [learnerAccess, setLearnerAccess] = useState<LearnerAccessState | undefined>(undefined);
  const [instructorAccess, setInstructorAccess] = useState<InstructorAccess | undefined>(undefined);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const path = usePathname();
  const wantsInstructor = path.startsWith('/instructor');

  useEffect(() => observeAccount(setAccount), []);

  // Keep the URL and the account in step: an assigned instructor belongs on the instructor
  // pages, and a learner should not sit on an instructor URL.
  useEffect(() => {
    if (instructorAccess?.state === 'assigned' && !wantsInstructor) navigate('/instructor', { replace: true });
    if (instructorAccess && instructorAccess.state !== 'assigned' && wantsInstructor)
      navigate('/access', { replace: true });
  }, [instructorAccess, wantsInstructor]);

  useEffect(() => {
    if (!account) {
      setLearnerAccess(undefined);
      setInstructorAccess(undefined);
      return undefined;
    }

    let cancelled = false;
    setLearnerAccess(undefined);
    setInstructorAccess(undefined);
    setError('');
    Promise.all([loadLearnerAccess(account.uid), loadInstructorAccess(account.uid)])
      .then(([learner, instructor]) => {
        if (!cancelled) {
          setLearnerAccess(learner);
          setInstructorAccess(instructor);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('We could not check your learner access. Please try again or contact Werks Sessions.');
          setLearnerAccess({ state: 'pending' });
          setInstructorAccess({ state: 'not_instructor' });
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
        <DashboardHeader
          title="Checking learner access."
          subtitle="We are confirming whether this browser is already signed in."
        />
      </main>
    );
  }

  if (account) {
    if (learnerAccess === undefined || instructorAccess === undefined) {
      return (
        <main className="dashboard auth-page">
          <DashboardHeader
            title="Checking confirmed sessions."
            subtitle={`Signed in as ${account.email ?? 'your Google account'}.`}
          />
          <section className="panel auth-panel" aria-live="polite">
            <p>Reading the sessions staff have confirmed for you.</p>
          </section>
        </main>
      );
    }

    if (instructorAccess.state === 'assigned') {
      if (!wantsInstructor) {
        return (
          <main className="dashboard auth-page">
            <DashboardHeader
              title="Opening your instructor pages."
              subtitle={`Signed in as ${account.email ?? 'your Google account'}.`}
            />
          </main>
        );
      }

      const applyReview = (outcome: ReviewOutcome) => {
        setInstructorAccess((current) => {
          if (current?.state !== 'assigned') return current;
          return {
            ...current,
            sessions: current.sessions.map((session) => {
              if (session.id !== outcome.sessionId) return session;
              const reviewedWeek = session.reviews.find(
                (review) => review.learnerUid === outcome.learnerUid && review.weekId === outcome.weekId,
              );
              return {
                ...session,
                reviews: session.reviews.filter(
                  (review) => review.learnerUid !== outcome.learnerUid || review.weekId !== outcome.weekId,
                ),
                history: [
                  {
                    learnerUid: outcome.learnerUid,
                    weekId: outcome.weekId,
                    week: reviewedWeek?.week ?? outcome.week,
                    decision: outcome.decision,
                    reviewerNote: outcome.note,
                  },
                  ...(session.history ?? []).filter(
                    (entry) => entry.learnerUid !== outcome.learnerUid || entry.weekId !== outcome.weekId,
                  ),
                ],
              };
            }),
          };
        });
      };

      return (
        <InstructorShell
          access={instructorAccess}
          account={account}
          error={error}
          onReviewed={applyReview}
          onSignOut={leaveAccount}
        />
      );
    }

    if (wantsInstructor) {
      return (
        <main className="dashboard auth-page">
          <DashboardHeader
            title="Checking your instructor access."
            subtitle={`Signed in as ${account.email ?? 'your Google account'}.`}
          />
        </main>
      );
    }

    if (learnerAccess.state === 'confirmed' && learnerAccess.sessions.length > 0) {
      return (
        <main className="dashboard learner-page">
          <DashboardHeader {...learnerHeading(learnerAccess.sessions)} />
          <section className="session-list" aria-labelledby="confirmed-sessions-heading">
            <div className="session-list-heading">
              <p className="eyebrow">Confirmed booking</p>
              <h2 id="confirmed-sessions-heading">Your table</h2>
            </div>
            {learnerAccess.sessions.map((session) => (
              <article className="panel session-card" key={session.id}>
                <div>
                  <p className="eyebrow">Werks Sessions</p>
                  <h3>{session.title}</h3>
                  <p>This session is confirmed for the Google account you signed in with.</p>
                </div>
                <span className="status confirmed">Confirmed</span>
              </article>
            ))}
          </section>
          {learnerAccess.sessions.map((session) => (
            <Fragment key={session.id}>
              <SessionGuidePanel sessionId={session.id} />
              {hasPracticeWorkspace(session) && (
                <PracticeWorkspace sessionId={session.id} sessionTitle={session.title} uid={account.uid} />
              )}
            </Fragment>
          ))}
          <button className="button secondary learner-sign-out" onClick={leaveAccount}>
            Sign out
          </button>
          {error && (
            <p className="auth-message" role="alert">
              {error}
            </p>
          )}
        </main>
      );
    }

    return (
      <main className="dashboard auth-page">
        <DashboardHeader
          title="Access is being arranged."
          subtitle={`Signed in as ${account.email ?? 'your Google account'}.`}
        />
        <section className="panel auth-panel" aria-labelledby="pending-access-heading">
          <p className="eyebrow">Booking confirmation required</p>
          <h2 id="pending-access-heading">Signing in does not create learner access.</h2>
          <p>
            {learnerAccess.state === 'confirmed'
              ? 'Your learner access is active, but there are no confirmed sessions to show yet. Werks Sessions will add the agreed session personally.'
              : 'Once your place is confirmed, Werks Sessions will add access to the session you have booked. Until then, there is no course material or cohort data here.'}
          </p>
          <button className="button secondary" onClick={leaveAccount}>
            Sign out
          </button>
          {error && (
            <p className="auth-message" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard auth-page">
      <DashboardHeader
        title="Learner access follows a confirmed booking."
        subtitle="Sign in with the Google account you gave Werks Sessions. Signing in does not create a place or learner access."
      />
      <section className="panel auth-panel">
        <p className="eyebrow">Learner sign-in</p>
        <h2>Use the Google account connected to your booking.</h2>
        <p>
          Access is confirmed personally after payment and a place are agreed. There is no self-service enrolment or
          public course library.
        </p>
        <button className="button primary" onClick={continueWithGoogle} disabled={isSigningIn}>
          {isSigningIn ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <p className="auth-note">
          Need to confirm your booking or the right email address?{' '}
          <a href={`mailto:${sessionsEmail}?subject=${encodeURIComponent('Werks Sessions learner access')}`}>
            Contact Werks Sessions
          </a>
          .
        </p>
        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

/** Only Brew 101 has the practice record. Sessions seeded before `offeringId` existed keep the Brew 101 experience they already had. */
function hasPracticeWorkspace(session: LearnerAccessSession): boolean {
  return hasPracticeRecord(session.offeringId);
}

function learnerHeading(sessions: LearnerAccessSession[]): { title: string; subtitle: string } {
  const kinds = new Set(sessions.map((session) => session.offeringId ?? 'brew101'));
  if (kinds.size === 1 && kinds.has('cupping')) {
    return {
      title: 'Your Public Cupping table.',
      subtitle: 'Your booking is confirmed. Read your table guide before you come, and arrive on time.',
    };
  }
  if (kinds.size === 1 && kinds.has('barista101')) {
    return {
      title: 'Your Barista 101 table.',
      subtitle:
        'Your booking is confirmed. Read your guide before you come, and arrive on time. Staff will arrange machine practice with you afterwards.',
    };
  }
  if (kinds.size === 1 && kinds.has('brew101')) {
    return {
      title: 'Your Brew 101 table.',
      subtitle:
        'Your booking is confirmed. After the table, use this space to notice one useful change each week and keep a practical record of the cups you make.',
    };
  }
  return {
    title: 'Your tables.',
    subtitle:
      'Your bookings are confirmed. Each table below has what to read before you come and what to do afterwards.',
  };
}

function SessionGuidePanel({ sessionId }: { sessionId: string }) {
  const [guide, setGuide] = useState<SessionGuide | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setGuide(undefined);
    loadSessionGuide(sessionId)
      .then((loadedGuide) => {
        if (!cancelled) setGuide(loadedGuide);
      })
      .catch(() => {
        if (!cancelled) setGuide(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!guide) {
    return null;
  }

  const headingId = `guide-${sessionId}`;
  return (
    <section className="panel session-guide" aria-labelledby={headingId}>
      <header className="session-guide-header">
        <div>
          <p className="eyebrow">Before you come</p>
          <h2 id={headingId}>{guide.title || 'Your table guide'}</h2>
        </div>
        <button className="button secondary no-print" type="button" onClick={() => window.print()}>
          Print this guide
        </button>
      </header>
      {guide.intro && <p className="guide-intro">{guide.intro}</p>}
      {guide.facts.length > 0 && (
        <dl className="facts guide-facts">
          {guide.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {guide.schedule.length > 0 && (
        <section className="guide-section" aria-label="How the evening runs">
          <h3>How the evening runs</h3>
          <table className="guide-schedule">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What happens</th>
              </tr>
            </thead>
            <tbody>
              {guide.schedule.map((row) => (
                <tr key={row.when}>
                  <th scope="row">{row.when}</th>
                  <td>{row.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {guide.tastingCard && guide.tastingCard.prompts.length > 0 && (
        <section className="guide-section" aria-label={guide.tastingCard.title || 'Your tasting card'}>
          <h3>{guide.tastingCard.title || 'Your tasting card'}</h3>
          <ul className="guide-list">
            {guide.tastingCard.prompts.map((prompt) => (
              <li key={prompt.name}>
                <strong>{prompt.name}</strong>
                {prompt.help && <span>{prompt.help}</span>}
              </li>
            ))}
          </ul>
          {guide.tastingCard.note && <p className="guide-note">{guide.tastingCard.note}</p>}
        </section>
      )}
      {guide.basics.length > 0 && (
        <section className="guide-section" aria-label="Table basics">
          <h3>Table basics</h3>
          <ol className="guide-steps">
            {guide.basics.map((item) => (
              <li key={item.step}>
                <strong>{item.step}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {guide.vocabulary.length > 0 && (
        <section className="guide-section" aria-label="Words for what you taste">
          <h3>Words for what you taste</h3>
          <dl className="guide-vocabulary">
            {guide.vocabulary.map((group) => (
              <div key={group.group}>
                <dt>{group.group}</dt>
                <dd>{group.words.join(', ')}</dd>
              </div>
            ))}
          </dl>
          {guide.vocabularyNote && <p className="guide-note">{guide.vocabularyNote}</p>}
        </section>
      )}
      {guide.sections.map((section) => (
        <section className="guide-section" key={section.title} aria-label={section.title}>
          <h3>{section.title}</h3>
          {section.intro && <p className="guide-note">{section.intro}</p>}
          <ul className="guide-list">
            {section.rows.map((row) => (
              <li key={row.label}>
                <strong>{row.label}</strong>
                <span>{row.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {guide.beforeYouCome.length > 0 && (
        <section className="guide-section" aria-label="Practical notes">
          <h3>Practical notes</h3>
          <ul className="guide-bullets">
            {guide.beforeYouCome.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {guide.footer && <p className="guide-footer">{guide.footer}</p>}
    </section>
  );
}

function weekIsReady(week: PracticeWeek): boolean {
  return (
    week.complete &&
    [week.focus, week.coffee, week.recipe, week.tastingNote, week.changeMade].every((value) => value.trim().length > 0)
  );
}

function PracticeWorkspace({ sessionId, sessionTitle, uid }: { sessionId: string; sessionTitle: string; uid: string }) {
  const [challenge, setChallenge] = useState<PracticeChallenge | null | undefined>(undefined);
  const [busy, setBusy] = useState<'start' | PracticeWeekId | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setChallenge(undefined);
    setError('');
    loadPracticeChallenge(sessionId, uid)
      .then((loadedChallenge) => {
        if (!cancelled) {
          setChallenge(loadedChallenge);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('We could not load this practice record. Please refresh or contact Werks Sessions.');
          setChallenge(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, uid]);

  const updateWeek = (weekId: PracticeWeekId, change: Partial<PracticeWeek>) => {
    setChallenge((current) =>
      current
        ? {
            ...current,
            weeks: { ...current.weeks, [weekId]: { ...current.weeks[weekId], ...change } },
          }
        : current,
    );
    setMessage('');
  };

  const startPractice = async () => {
    setBusy('start');
    setError('');
    try {
      const startedChallenge = await startPracticeChallenge(sessionId, uid);
      setChallenge(startedChallenge);
      setMessage('Your practice record is ready. Save a draft whenever you need more time.');
    } catch {
      setError('We could not start practice. Please try again or contact Werks Sessions.');
    } finally {
      setBusy(null);
    }
  };

  const saveWeek = async (weekId: PracticeWeekId) => {
    if (!challenge) return;
    const weeks = {
      ...challenge.weeks,
      [weekId]:
        challenge.weeks[weekId].status === 'returned'
          ? { ...challenge.weeks[weekId], status: 'draft' as const }
          : challenge.weeks[weekId],
    };
    setBusy(weekId);
    setError('');
    try {
      await savePracticeChallenge(sessionId, uid, weeks);
      setChallenge({ ...challenge, weeks });
      setMessage(`Week ${practiceWeekIds.indexOf(weekId) + 1} draft saved.`);
    } catch {
      setError('We could not save this draft. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const submitWeek = async (weekId: PracticeWeekId) => {
    if (!challenge || !weekIsReady(challenge.weeks[weekId])) return;
    setBusy(weekId);
    setError('');
    try {
      await submitPracticeWeek(sessionId, uid, weekId, challenge.weeks);
      setChallenge({
        ...challenge,
        weeks: { ...challenge.weeks, [weekId]: { ...challenge.weeks[weekId], status: 'submitted' } },
      });
      setMessage(
        `Week ${practiceWeekIds.indexOf(weekId) + 1} submitted. It is now locked while your instructor responds.`,
      );
    } catch {
      setError('We could not submit this practice record. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (challenge === undefined) {
    return (
      <section className="practice-workspace" aria-live="polite">
        <p>Loading practice for {sessionTitle}.</p>
      </section>
    );
  }

  if (challenge === null) {
    return (
      <section className="practice-workspace practice-start" aria-labelledby={`practice-${sessionId}`}>
        <div>
          <p className="eyebrow">After Brew 101</p>
          <h2 id={`practice-${sessionId}`}>Keep the next four cups useful.</h2>
          <p>
            Once a week, brew at home, notice one thing, and write the next adjustment you want to test. There is no
            right score, and you do not need to finish all four weeks at once.
          </p>
        </div>
        <div className="practice-start-action">
          <button className="button primary" onClick={startPractice} disabled={busy === 'start'}>
            {busy === 'start' ? 'Starting practice…' : 'Start my practice'}
          </button>
        </div>
        {error && (
          <p className="auth-message" role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  const submittedWeeks = practiceWeekIds.filter((weekId) => challenge.weeks[weekId].status === 'submitted').length;

  return (
    <section className="practice-workspace" aria-labelledby={`practice-${sessionId}`}>
      <div className="practice-intro">
        <div>
          <p className="eyebrow">Brew 101 follow-through</p>
          <h2 id={`practice-${sessionId}`}>Your four-week practice.</h2>
          <p>
            Work one week at a time. Save a draft when you need more time. Submit a week when the observation is
            complete; it locks while your instructor responds.
          </p>
        </div>
        <p className="progress-label">{submittedWeeks} of 4 weeks submitted for review</p>
      </div>
      <div className="week-grid">
        {practiceWeekIds.map((weekId, index) => (
          <PracticeWeekCard
            key={weekId}
            index={index + 1}
            weekId={weekId}
            week={challenge.weeks[weekId]}
            busy={busy === weekId}
            onSave={saveWeek}
            onSubmit={submitWeek}
            onChange={updateWeek}
          />
        ))}
      </div>
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="auth-message" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function PracticeWeekCard({
  index,
  weekId,
  week,
  busy,
  onSave,
  onSubmit,
  onChange,
}: {
  index: number;
  weekId: PracticeWeekId;
  week: PracticeWeek;
  busy: boolean;
  onSave: (weekId: PracticeWeekId) => void;
  onSubmit: (weekId: PracticeWeekId) => void;
  onChange: (weekId: PracticeWeekId, change: Partial<PracticeWeek>) => void;
}) {
  const prefix = `${weekId}-`;
  const locked = week.status === 'submitted' || week.status === 'approved';
  const ready = weekIsReady(week);
  return (
    <fieldset className={`week-card${ready ? ' done' : ''}`} disabled={locked || busy}>
      <legend className="week-title">
        <span>Week {index}</span>
        <strong>{weekNames[weekId]}</strong>
      </legend>
      <label htmlFor={`${prefix}focus`}>
        Focus
        <input
          id={`${prefix}focus`}
          value={week.focus}
          onChange={(event) => onChange(weekId, { focus: event.target.value })}
          placeholder="What were you paying attention to?"
        />
      </label>
      <label htmlFor={`${prefix}coffee`}>
        Coffee
        <input
          id={`${prefix}coffee`}
          value={week.coffee}
          onChange={(event) => onChange(weekId, { coffee: event.target.value })}
          placeholder="Coffee or roast"
        />
      </label>
      <label htmlFor={`${prefix}recipe`}>
        Recipe
        <input
          id={`${prefix}recipe`}
          value={week.recipe}
          onChange={(event) => onChange(weekId, { recipe: event.target.value })}
          placeholder="e.g. 15 g : 250 g"
        />
      </label>
      <label htmlFor={`${prefix}tasting-note`}>
        What you tasted
        <textarea
          id={`${prefix}tasting-note`}
          value={week.tastingNote}
          onChange={(event) => onChange(weekId, { tastingNote: event.target.value })}
          placeholder="Describe the cup in your own words."
        />
      </label>
      <label htmlFor={`${prefix}change`}>
        One change
        <input
          id={`${prefix}change`}
          value={week.changeMade}
          onChange={(event) => onChange(weekId, { changeMade: event.target.value })}
          placeholder="What will you change next time?"
        />
      </label>
      <label className="check" htmlFor={`${prefix}complete`}>
        <input
          id={`${prefix}complete`}
          type="checkbox"
          checked={week.complete}
          onChange={(event) => onChange(weekId, { complete: event.target.checked })}
        />
        This week is complete
      </label>
      {!locked && (
        <div className="week-actions">
          <button className="button secondary" type="button" onClick={() => onSave(weekId)}>
            {busy ? 'Saving…' : 'Save week'}
          </button>
          <button className="button primary" type="button" onClick={() => onSubmit(weekId)} disabled={!ready}>
            {busy ? 'Submitting…' : `Submit week ${index}`}
          </button>
        </div>
      )}
      {week.status === 'submitted' && (
        <p className="week-submitted" role="status">
          With your instructor. You can keep working on later weeks while this one is reviewed.
        </p>
      )}
      {week.status === 'approved' && (
        <div className="week-reviewed" role="status">
          <p>Reviewed and approved. This week is locked.</p>
          {week.reviewerNote && <InstructorFeedback note={week.reviewerNote} />}
        </div>
      )}
      {week.status === 'returned' && (
        <div className="week-returned" role="status">
          <p>
            Your instructor has sent this back for one more try. Read the feedback below, update the entry, save it, and
            submit it again when ready.
          </p>
          {week.reviewerNote && <InstructorFeedback note={week.reviewerNote} />}
        </div>
      )}
      {week.status === 'draft' && week.reviewerNote && (
        <div className="week-returned" role="status">
          <p>You are revising this week. Your instructor’s feedback is kept here until you submit again.</p>
          <InstructorFeedback note={week.reviewerNote} />
        </div>
      )}
    </fieldset>
  );
}

export default LearnerAccess;
