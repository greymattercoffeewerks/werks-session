import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  observeAccount: vi.fn((callback: (user: null) => void) => {
    callback(null);
    return () => undefined;
  }),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  authErrorMessage: vi.fn(() => 'We could not complete sign-in. Please try again or contact Werks Sessions.'),
}));

const learnerAccessMock = vi.hoisted(() => ({
  loadLearnerAccess: vi.fn(),
}));

const instructorAccessMock = vi.hoisted(() => ({
  loadInstructorAccess: vi.fn(() => Promise.resolve({ state: 'not_instructor' })),
  reviewPracticeWeek: vi.fn(),
}));

const practiceMock = vi.hoisted(() => ({
  loadPracticeChallenge: vi.fn(() => Promise.resolve(null)),
  startPracticeChallenge: vi.fn(),
  savePracticeChallenge: vi.fn(),
  submitPracticeWeek: vi.fn(),
  practiceWeekIds: ['week1', 'week2', 'week3', 'week4'],
}));

const sessionGuideMock = vi.hoisted(() => ({
  loadSessionGuide: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../../src/lib/google-auth', () => authMock);
vi.mock('../../src/lib/session-guide', () => sessionGuideMock);
vi.mock('../../src/lib/instructor-access', () => instructorAccessMock);
vi.mock('../../src/lib/learner-access', () => learnerAccessMock);
vi.mock('../../src/lib/practice', () => practiceMock);
import App from '../../src/App';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('portal navigation and interest registration', () => {
  it('does not expose a learner workspace or demo role switching on the public page', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Learner access' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'My practice' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Teach' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument();
  });

  it('shows a public evening teaser on Public Cupping only, without the learner-only guide detail', () => {
    const app = render(<App />);
    const teasers = app.container.querySelectorAll('details.offering-teaser');
    expect(teasers).toHaveLength(1);
    const cuppingCard = app.getByRole('heading', { name: 'Public Cupping' }).closest('article')!;
    const teaser = within(cuppingCard).getByText('How the evening runs').closest('details')!;
    expect(teaser).toBeInTheDocument();
    expect(within(teaser).getAllByRole('listitem')).toHaveLength(4);
    const brewCard = app.getByRole('heading', { name: 'Brew 101' }).closest('article')!;
    expect(within(brewCard).queryByText('How the evening runs')).not.toBeInTheDocument();
    const text = app.container.textContent ?? '';
    // Structural markers only: never put the gated vocabulary itself in this public repository.
    ['triangle', 'tasting card', 'words for what you taste', '0:30', '1:15'].forEach((guideOnly) => {
      expect(text.toLowerCase()).not.toContain(guideOnly);
    });
  });

  it('creates a staff-operated email enquiry for the selected offering', () => {
    const app = render(<App />);
    fireEvent.change(app.getByLabelText('Choose a session'), { target: { value: 'brew101' } });
    const enquiryLink = app.getByRole('link', { name: 'Ask about Brew 101' });
    expect(enquiryLink).toHaveAttribute('href', expect.stringContaining('mailto:greymatter.cw@outlook.com'));
    expect(enquiryLink).toHaveAttribute(
      'href',
      expect.stringContaining('Ask%20about%20Brew%20101'),
    );
  });

  it('offers Google sign-in without promising self-service learner access', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));

    const button = await screen.findByRole('button', { name: 'Continue with Google' });
    expect(screen.getByRole('heading', { name: 'Learner access follows a confirmed booking.' })).toBeInTheDocument();
    expect(screen.getByText(/Signing in does not create a place or learner access\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Werks Sessions' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:greymatter.cw@outlook.com'),
    );

    fireEvent.click(button);
    expect(authMock.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('shows only staff-confirmed sessions and lets a granted learner start a practice draft', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'learner-uid', email: 'maya@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({
      state: 'confirmed',
      sessions: [{ id: 'brew101-01', title: 'Manual Brew Foundations' }],
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));

    expect(await screen.findByRole('heading', { name: 'Your Brew 101 table.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manual Brew Foundations' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Keep the next four cups useful.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start my practice' })).toBeInTheDocument();
    expect(learnerAccessMock.loadLearnerAccess).toHaveBeenCalledWith('learner-uid');
  });

  it('starts an owned draft and reveals the four editable week records', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'learner-uid', email: 'maya@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({
      state: 'confirmed',
      sessions: [{ id: 'brew101-01', title: 'Manual Brew Foundations' }],
    });
    practiceMock.loadPracticeChallenge.mockResolvedValueOnce(null);
    practiceMock.startPracticeChallenge.mockResolvedValueOnce({
      status: 'in_progress',
      weeks: {
        week1: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
        week2: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
        week3: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
        week4: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
      },
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Start my practice' }));

    expect((await screen.findAllByLabelText('Focus'))).toHaveLength(4);
    expect(screen.getAllByLabelText('This week is complete')).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Save week' })).toHaveLength(4);
    const weekOne = screen.getByRole('group', { name: 'Week 1 Notice the cup' });
    expect(within(weekOne).getByRole('button', { name: 'Submit week 1' })).toBeDisabled();
    fireEvent.change(within(weekOne).getByLabelText('Focus'), { target: { value: 'Ratio' } });
    fireEvent.change(within(weekOne).getByLabelText('Coffee'), { target: { value: 'Konga' } });
    fireEvent.change(within(weekOne).getByLabelText('Recipe'), { target: { value: '15 g : 250 g' } });
    fireEvent.change(within(weekOne).getByLabelText('What you tasted'), { target: { value: 'Sweet and clear.' } });
    fireEvent.change(within(weekOne).getByLabelText('One change'), { target: { value: 'Grind finer' } });
    fireEvent.click(within(weekOne).getByLabelText('This week is complete'));
    expect(within(weekOne).getByRole('button', { name: 'Submit week 1' })).toBeEnabled();
    fireEvent.click(within(weekOne).getByRole('button', { name: 'Save week' }));
    expect(await screen.findByText('Week 1 draft saved.')).toBeInTheDocument();
    expect(practiceMock.savePracticeChallenge).toHaveBeenCalledWith('brew101-01', 'learner-uid', expect.objectContaining({
      week1: expect.objectContaining({ focus: 'Ratio' }),
    }));
    fireEvent.click(within(weekOne).getByRole('button', { name: 'Submit week 1' }));
    expect(await screen.findByText('Week 1 submitted. It is now locked while your instructor responds.')).toBeInTheDocument();
    expect(practiceMock.submitPracticeWeek).toHaveBeenCalledWith('brew101-01', 'learner-uid', 'week1', expect.objectContaining({
      week1: expect.objectContaining({ status: 'draft' }),
    }));
    expect(practiceMock.startPracticeChallenge).toHaveBeenCalledWith('brew101-01', 'learner-uid');
  });

  it('lets an assigned instructor review one submitted week with feedback', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'instructor-uid', email: 'teacher@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({ state: 'pending' });
    instructorAccessMock.loadInstructorAccess.mockResolvedValueOnce({
      state: 'assigned',
      sessions: [{
        id: 'brew101-01',
        title: 'Manual Brew Foundations',
        reviews: [{
          learnerUid: 'learner-uid',
          weekId: 'week1',
          week: { focus: 'Ratio', coffee: 'Konga', recipe: '15 g : 250 g', tastingNote: 'Sweet and clear.', changeMade: 'Grind finer', complete: true, status: 'submitted' },
          weeks: {
            week1: { focus: 'Ratio', coffee: 'Konga', recipe: '15 g : 250 g', tastingNote: 'Sweet and clear.', changeMade: 'Grind finer', complete: true, status: 'submitted' },
            week2: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
            week3: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
            week4: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
          },
        }],
      }],
    });
    instructorAccessMock.reviewPracticeWeek.mockResolvedValueOnce(undefined);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));

    expect(await screen.findByRole('heading', { name: 'Instructor review.' })).toBeInTheDocument();
    expect(screen.getByText('Sweet and clear.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Feedback for the learner'), { target: { value: 'Clear observation. Keep this ratio for one more brew.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve week 1' }));

    expect(await screen.findByRole('heading', { name: 'No submitted weeks are waiting.' })).toBeInTheDocument();
    expect(instructorAccessMock.reviewPracticeWeek).toHaveBeenCalledWith(
      'brew101-01',
      'learner-uid',
      'week1',
      expect.objectContaining({ week1: expect.objectContaining({ status: 'submitted' }) }),
      'approved',
      'Clear observation. Keep this ratio for one more brew.',
    );
  });

  it('keeps instructor feedback metadata when a returned week becomes a learner draft', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'learner-uid', email: 'maya@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({
      state: 'confirmed',
      sessions: [{ id: 'brew101-01', title: 'Manual Brew Foundations' }],
    });
    practiceMock.loadPracticeChallenge.mockResolvedValueOnce({
      status: 'in_progress',
      weeks: {
        week1: { focus: 'Ratio', coffee: 'Konga', recipe: '15 g : 250 g', tastingNote: 'Sweet and clear.', changeMade: 'Grind finer', complete: true, status: 'returned', reviewerNote: 'Compare this ratio one more time.', reviewedAt: 'reviewed-at' },
        week2: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
        week3: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
        week4: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
      },
    });
    practiceMock.savePracticeChallenge.mockResolvedValueOnce(undefined);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));

    const weekOne = await screen.findByRole('group', { name: 'Week 1 Notice the cup' });
    expect(within(weekOne).getByText('Your instructor has sent this back for one more try. Update the entry, save it, and submit it again when ready. Compare this ratio one more time.')).toBeInTheDocument();
    fireEvent.click(within(weekOne).getByRole('button', { name: 'Save week' }));

    expect(practiceMock.savePracticeChallenge).toHaveBeenCalledWith('brew101-01', 'learner-uid', expect.objectContaining({
      week1: expect.objectContaining({ status: 'draft', reviewerNote: 'Compare this ratio one more time.', reviewedAt: 'reviewed-at' }),
    }));
  });

  it('shows the learner-only guide for a confirmed cupping session and no Brew 101 practice record', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'guest-uid', email: 'guest@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({
      state: 'confirmed',
      sessions: [{ id: 'cupping-01', title: 'Range Night', offeringId: 'cupping' }],
    });
    sessionGuideMock.loadSessionGuide.mockResolvedValueOnce({
      offeringId: 'cupping',
      version: 1,
      title: 'Your table guide',
      intro: 'Plain text only. <b>not bold</b>',
      facts: [{ label: 'Duration', value: '90 min' }],
      schedule: [{ when: 'Start', what: 'Arrive and settle in.' }],
      tastingCard: { title: 'Your card', prompts: [{ name: 'Rank it', help: 'One is your favourite.' }], note: '' },
      basics: [{ step: 'Smell', text: 'Lean in.' }],
      vocabulary: [{ group: 'Group', words: ['one', 'two'] }],
      vocabularyNote: 'Use your own words too.',
      beforeYouCome: ['Arrive on time.'],
      footer: 'Footer line',
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));

    expect(await screen.findByRole('heading', { name: 'Your Public Cupping table.' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Your table guide' })).toBeInTheDocument();
    expect(sessionGuideMock.loadSessionGuide).toHaveBeenCalledWith('cupping-01');
    expect(screen.getByText('Plain text only. <b>not bold</b>')).toBeInTheDocument();
    expect(document.querySelector('.session-guide b')).toBeNull();
    expect(screen.getByRole('button', { name: 'Print this guide' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('Arrive and settle in.');
    expect(screen.queryByRole('button', { name: 'Start my practice' })).not.toBeInTheDocument();
    expect(practiceMock.loadPracticeChallenge).not.toHaveBeenCalled();
  });

  it('keeps the Brew 101 practice experience for Brew 101 and not-yet-labelled sessions, with no guide panel when none exists', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'learner-uid', email: 'maya@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({
      state: 'confirmed',
      sessions: [
        { id: 'brew101-01', title: 'Manual Brew Foundations', offeringId: null },
        { id: 'brew101-02', title: 'Manual Brew Foundations', offeringId: 'brew101' },
      ],
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Learner access' }));

    expect(await screen.findByRole('heading', { name: 'Your Brew 101 table.' })).toBeInTheDocument();
    expect(await screen.findAllByRole('button', { name: 'Start my practice' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Print this guide' })).not.toBeInTheDocument();
    expect(sessionGuideMock.loadSessionGuide).toHaveBeenCalledTimes(2);
  });

  it('uses a combined heading for mixed sessions and never requests a guide for a pending account', async () => {
    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'learner-uid', email: 'maya@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({
      state: 'confirmed',
      sessions: [
        { id: 'cupping-01', title: 'Range Night', offeringId: 'cupping' },
        { id: 'brew101-01', title: 'Manual Brew Foundations', offeringId: 'brew101' },
      ],
    });
    const mixed = render(<App />);
    fireEvent.click(mixed.getByRole('button', { name: 'Learner access' }));
    expect(await mixed.findByRole('heading', { name: 'Your tables.' })).toBeInTheDocument();
    expect(await mixed.findAllByRole('button', { name: 'Start my practice' })).toHaveLength(1);
    mixed.unmount();
    sessionGuideMock.loadSessionGuide.mockClear();

    authMock.observeAccount.mockImplementationOnce((callback: (user: { uid: string; email: string }) => void) => {
      callback({ uid: 'pending-uid', email: 'pending@example.com' });
      return () => undefined;
    });
    learnerAccessMock.loadLearnerAccess.mockResolvedValueOnce({ state: 'pending' });
    const pending = render(<App />);
    fireEvent.click(pending.getByRole('button', { name: 'Learner access' }));
    expect(await pending.findByRole('heading', { name: 'Signing in does not create learner access.' })).toBeInTheDocument();
    expect(sessionGuideMock.loadSessionGuide).not.toHaveBeenCalled();
  });
});
