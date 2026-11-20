import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { NightRecordWorkspace } from '../NightRecordWorkspace';
import { ScheduleEditor } from '../ScheduleEditor';
import {
  reviewPracticeWeek,
  type InstructorAccess,
  type InstructorSession,
  type InstructorReview,
  type ReviewDecision,
} from '../lib/instructor-access';
import { practiceWeekIds, type PracticeWeek, type PracticeWeekId } from '../lib/practice';
import { navigate, usePathname } from '../lib/router';
import { DashboardHeader, InstructorFeedback, RouteLink, weekNames } from './dashboard';

type AssignedAccess = Extract<InstructorAccess, { state: 'assigned' }>;

export type ReviewOutcome = {
  sessionId: string;
  learnerUid: string;
  weekId: PracticeWeekId;
  week: PracticeWeek;
  decision: ReviewDecision;
  note: string;
};

const routes = [
  { path: '/instructor', label: 'Overview' },
  { path: '/instructor/review', label: 'Review' },
  { path: '/instructor/nights', label: 'Nights' },
  { path: '/instructor/dates', label: 'Dates' },
] as const;

type Section = 'overview' | 'review' | 'nights' | 'dates';

function sectionFor(path: string): Section {
  if (path.startsWith('/instructor/review')) return 'review';
  if (path.startsWith('/instructor/nights')) return 'nights';
  if (path.startsWith('/instructor/dates')) return 'dates';
  return 'overview';
}

const headings: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: 'What needs you now.', subtitle: 'The work waiting on you, and one click to everything else.' },
  review: {
    title: 'Review.',
    subtitle: 'One submitted week at a time. Each decision keeps its feedback on the learner’s record.',
  },
  nights: { title: 'Nights.', subtitle: 'Record a Public Cupping night, then look across the nights you have hosted.' },
  dates: { title: 'Dates.', subtitle: 'These dates are the next tables shown on the front page.' },
};

export function InstructorShell({
  access,
  account,
  error,
  onReviewed,
  onSignOut,
}: {
  access: AssignedAccess;
  account: User;
  error: string;
  onReviewed: (outcome: ReviewOutcome) => void;
  onSignOut: () => void;
}) {
  const path = usePathname();
  const section = sectionFor(path);
  const cuppingSessions = access.sessions.filter((session) => session.offeringId === 'cupping');
  const waiting = access.sessions.reduce((total, session) => total + session.reviews.length, 0);
  // A page is mounted the first time it is opened and then kept alive but hidden, so
  // switching tabs does not throw away a half-typed review or an unsaved night record.
  const [opened, setOpened] = useState<Set<Section>>(() => new Set(['overview']));

  useEffect(() => {
    setOpened((current) => (current.has(section) ? current : new Set(current).add(section)));
  }, [section]);

  useEffect(() => {
    document.getElementById('instructor-page-heading')?.focus();
  }, [path]);

  return (
    <main className="dashboard instructor-page">
      <DashboardHeader
        headingId="instructor-page-heading"
        title={headings[section].title}
        subtitle={
          section === 'overview'
            ? `Signed in as ${account.email ?? 'your Google account'}.`
            : headings[section].subtitle
        }
      />
      <nav className="instructor-tabs" aria-label="Instructor sections">
        {routes.map((route) => (
          <RouteLink
            key={route.path}
            to={route.path}
            label={route.path === '/instructor/review' && waiting > 0 ? `${route.label} (${waiting})` : route.label}
            current={route.path === (section === 'overview' ? '/instructor' : `/instructor/${section}`)}
            onNavigate={(target) => navigate(target)}
          />
        ))}
      </nav>

      {section === 'overview' && <Overview waiting={waiting} cuppingSessions={cuppingSessions.length} />}
      <div hidden={section !== 'review'}>
        {opened.has('review') && <ReviewPanel access={access} onReviewed={onReviewed} />}
      </div>
      <div hidden={section !== 'nights'}>
        {opened.has('nights') &&
          (cuppingSessions.length > 0 ? (
            <NightRecordWorkspace sessions={cuppingSessions} uid={account.uid} hostName={account.displayName ?? ''} />
          ) : (
            <p className="panel review-empty">No Public Cupping sessions are assigned to you.</p>
          ))}
      </div>
      <div hidden={section !== 'dates'}>{opened.has('dates') && <ScheduleEditor />}</div>

      <button className="button secondary learner-sign-out" onClick={onSignOut}>
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

function Overview({ waiting, cuppingSessions }: { waiting: number; cuppingSessions: number }) {
  return (
    <section className="inbox" aria-labelledby="inbox-heading">
      <h2 id="inbox-heading" className="visually-hidden">
        Waiting for you
      </h2>
      <div className="inbox-grid">
        <article className="panel inbox-card">
          <p className="eyebrow">Review</p>
          <h3>
            {waiting === 0 ? 'No weeks are waiting.' : `${waiting} ${waiting === 1 ? 'week is' : 'weeks are'} waiting.`}
          </h3>
          <p>
            {waiting === 0
              ? 'A learner’s submitted week appears here for feedback.'
              : 'Approve or return each one with a note the learner keeps.'}
          </p>
          <RouteLink
            to="/instructor/review"
            label="Open review"
            current={false}
            onNavigate={navigate}
            className="button secondary"
          />
        </article>
        <article className="panel inbox-card">
          <p className="eyebrow">Nights</p>
          <h3>
            {cuppingSessions === 0
              ? 'No Public Cupping sessions.'
              : `${cuppingSessions} ${cuppingSessions === 1 ? 'session' : 'sessions'} assigned.`}
          </h3>
          <p>Record seats, picks, and what the room said after a Public Cupping night.</p>
          <RouteLink
            to="/instructor/nights"
            label="Open nights"
            current={false}
            onNavigate={navigate}
            className="button secondary"
          />
        </article>
        <article className="panel inbox-card">
          <p className="eyebrow">Dates</p>
          <h3>Keep the next tables current.</h3>
          <p>Publish dates, times, and status labels for the front page.</p>
          <RouteLink
            to="/instructor/dates"
            label="Manage dates"
            current={false}
            onNavigate={navigate}
            className="button secondary"
          />
        </article>
      </div>
    </section>
  );
}

function reviewKey(sessionId: string, review: InstructorReview): string {
  return `${sessionId}:${review.learnerUid}:${review.weekId}`;
}

function ReviewPanel({ access, onReviewed }: { access: AssignedAccess; onReviewed: (outcome: ReviewOutcome) => void }) {
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const waitingSessions = access.sessions.filter((session) => session.reviews.length > 0);
  const reviewed = access.sessions.flatMap((session) => (session.history ?? []).map((entry) => ({ session, entry })));
  const waiting = waitingSessions.reduce((total, session) => total + session.reviews.length, 0);

  const completeReview = async (session: InstructorSession, review: InstructorReview, decision: ReviewDecision) => {
    const key = reviewKey(session.id, review);
    const note = (feedback[key] ?? '').trim();
    if (!note) {
      setError('Add feedback before approving or returning a week.');
      return;
    }
    setBusyKey(key);
    setError('');
    try {
      await reviewPracticeWeek(session.id, review.learnerUid, review.weekId, review.weeks, decision, note);
      onReviewed({
        sessionId: session.id,
        learnerUid: review.learnerUid,
        weekId: review.weekId,
        week: review.week,
        decision,
        note,
      });
    } catch {
      setError('We could not save this review. Please try again.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="review-panel">
      {waiting === 0 ? (
        <section className="panel review-empty" aria-live="polite">
          <h2>No submitted weeks are waiting.</h2>
          <p>New Brew 101 practice submissions will appear here only for sessions assigned to you.</p>
        </section>
      ) : (
        waitingSessions.map((session) => (
          <section className="review-group" key={session.id} aria-labelledby={`review-group-${session.id}`}>
            <div className="review-group-heading">
              <h2 id={`review-group-${session.id}`}>{session.title}</h2>
              <p>
                {session.reviews.length} {session.reviews.length === 1 ? 'week is' : 'weeks are'} ready for your
                response.
              </p>
            </div>
            <div className="review-list">
              {session.reviews.map((review) => {
                const key = reviewKey(session.id, review);
                const isBusy = busyKey === key;
                const weekNumber = practiceWeekIds.indexOf(review.weekId) + 1;
                return (
                  <article className="panel review-card" key={key}>
                    <header>
                      <p>{session.title}</p>
                      <h3>
                        Week {weekNumber}: {weekNames[review.weekId]}
                      </h3>
                    </header>
                    <dl className="review-observation">
                      <div>
                        <dt>Focus</dt>
                        <dd>{review.week.focus}</dd>
                      </div>
                      <div>
                        <dt>Coffee</dt>
                        <dd>{review.week.coffee}</dd>
                      </div>
                      <div>
                        <dt>Recipe</dt>
                        <dd>{review.week.recipe}</dd>
                      </div>
                      <div>
                        <dt>What they tasted</dt>
                        <dd>{review.week.tastingNote}</dd>
                      </div>
                      <div>
                        <dt>Next change</dt>
                        <dd>{review.week.changeMade}</dd>
                      </div>
                    </dl>
                    <label htmlFor={`${key}-feedback`}>
                      Feedback for the learner
                      <textarea
                        id={`${key}-feedback`}
                        value={feedback[key] ?? ''}
                        onChange={(event) => setFeedback((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder="Name what you noticed and a useful next step."
                      />
                    </label>
                    <div className="review-actions">
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => completeReview(session, review, 'returned')}
                        disabled={isBusy}
                      >
                        {isBusy ? 'Saving…' : `Return week ${weekNumber}`}
                      </button>
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => completeReview(session, review, 'approved')}
                        disabled={isBusy}
                      >
                        {isBusy ? 'Saving…' : `Approve week ${weekNumber}`}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
      {error && (
        <p className="auth-message" role="alert">
          {error}
        </p>
      )}

      <section className="panel review-history" aria-labelledby="review-history-heading">
        <div className="review-group-heading">
          <h2 id="review-history-heading">Reviewed</h2>
          <p>Decisions you have already made, newest first.</p>
        </div>
        {reviewed.length === 0 ? (
          <p className="review-empty">Nothing has been reviewed yet.</p>
        ) : (
          <ul className="review-history-list">
            {reviewed.map(({ session, entry }) => (
              <li key={`${session.id}:${entry.learnerUid}:${entry.weekId}`}>
                <p>
                  <strong>
                    Week {practiceWeekIds.indexOf(entry.weekId) + 1}: {weekNames[entry.weekId]}
                  </strong>{' '}
                  · {session.title} ·{' '}
                  <span className={`review-decision ${entry.decision}`}>
                    {entry.decision === 'approved' ? 'Approved' : 'Returned'}
                  </span>
                </p>
                {entry.reviewerNote && <InstructorFeedback note={entry.reviewerNote} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
