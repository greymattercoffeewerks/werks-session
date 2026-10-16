import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const portal = vi.hoisted(() => ({
  submitInterest: vi.fn().mockResolvedValue(undefined),
  listMyLearningResources: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/lib/portal', () => ({
  submitInterest: portal.submitInterest,
  listMyLearningResources: portal.listMyLearningResources,
}));

afterEach(() => cleanup());

describe('portal navigation and interest registration', () => {
  it('does not expose demo role switching before authentication', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'My practice' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Teach' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage' })).not.toBeInTheDocument();
  });

  it('submits a selected interest offering', async () => {
    const app = render(<App />);
    fireEvent.change(app.getByLabelText('Name'), { target: { value: 'Maya Lau' } });
    fireEvent.change(app.getByLabelText('Email'), { target: { value: 'maya@example.com' } });
    fireEvent.click(app.getByRole('button', { name: 'Join the interest list' }));

    await waitFor(() => expect(portal.submitInterest).toHaveBeenCalledWith(expect.objectContaining({
      offeringId: 'cupping',
      name: 'Maya Lau',
      email: 'maya@example.com',
      marketingConsent: false,
    })));
    expect(await app.findByRole('status')).toHaveTextContent('interest list');
  });
});
