import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

vi.mock('../../src/lib/google-auth', () => authMock);
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

  it('creates a staff-operated email enquiry for the selected offering', () => {
    const app = render(<App />);
    fireEvent.change(app.getByLabelText('Session'), { target: { value: 'brew101' } });
    const enquiryLink = app.getByRole('link', { name: 'Email us about Brew 101' });
    expect(enquiryLink).toHaveAttribute('href', expect.stringContaining('mailto:greymatter.cw@outlook.com'));
    expect(enquiryLink).toHaveAttribute(
      'href',
      expect.stringContaining('Werks%20Sessions%20interest%20-%20Brew%20101'),
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
});
