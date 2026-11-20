/** Shared pieces of the signed-in experience: headings, feedback, week labels, and links. */
import type { PracticeWeekId } from '../lib/practice';

export const weekNames: Record<PracticeWeekId, string> = {
  week1: 'Notice the cup',
  week2: 'Change one thing',
  week3: 'Compare the result',
  week4: 'Keep the next step',
};

export function DashboardHeader({
  title,
  subtitle,
  headingId,
}: {
  title: string;
  subtitle: string;
  headingId?: string;
}) {
  return (
    <header className="dashboard-header">
      <p className="eyebrow">Werks Sessions</p>
      <h1 id={headingId} tabIndex={headingId ? -1 : undefined}>
        {title}
      </h1>
      <p>{subtitle}</p>
    </header>
  );
}

export function InstructorFeedback({ note }: { note: string }) {
  return (
    <blockquote className="reviewer-note">
      <strong>Instructor feedback</strong>
      <span>{note}</span>
    </blockquote>
  );
}

/**
 * A route link. It is a real anchor, so it can be copied, opened in a new tab, and read by
 * assistive tech; the click is intercepted only to avoid a full page load.
 */
export function RouteLink({
  to,
  label,
  current,
  onNavigate,
  className,
}: {
  to: string;
  label: string;
  current: boolean;
  onNavigate: (path: string) => void;
  className?: string;
}) {
  return (
    <a
      className={['route-link', className, current ? 'current' : ''].filter(Boolean).join(' ')}
      href={to}
      aria-current={current ? 'page' : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        onNavigate(to);
      }}
    >
      {label}
    </a>
  );
}
