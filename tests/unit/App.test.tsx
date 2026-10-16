import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../src/App';

afterEach(() => cleanup());

describe('portal navigation and interest registration', () => {
  it('does not expose an unactionable sign-in or demo role switching', () => {
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
});
