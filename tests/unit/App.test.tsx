import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const portal = vi.hoisted(() => ({
  submitInterest: vi.fn().mockResolvedValue(undefined),
  listMyLearningResources: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/lib/portal', () => ({
  submitInterest: portal.submitInterest,
  listMyLearningResources: portal.listMyLearningResources,
}));

describe('portal navigation and interest registration', () => {
  it('switches to the learner view', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'My practice' }));
    expect(screen.getByRole('heading', { name: 'Welcome back, Maya.' })).toBeInTheDocument();
  });

  it('submits a selected interest offering', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Maya Lau' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maya@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join the interest list' }));

    await waitFor(() => expect(portal.submitInterest).toHaveBeenCalledWith(expect.objectContaining({
      offeringId: 'cupping',
      name: 'Maya Lau',
      email: 'maya@example.com',
      marketingConsent: false,
    })));
    expect(await screen.findByRole('status')).toHaveTextContent('interest list');
  });
});
