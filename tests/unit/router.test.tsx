import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { navigate, usePathname } from '../../src/lib/router';

function PathProbe() {
  return <p>{usePathname()}</p>;
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('router', () => {
  it('updates the pathname and re-renders on navigation', () => {
    window.history.replaceState({}, '', '/');
    render(<PathProbe />);
    expect(screen.getByText('/')).toBeInTheDocument();

    act(() => navigate('/instructor/review'));
    expect(screen.getByText('/instructor/review')).toBeInTheDocument();
  });

  it('does not push a duplicate history entry for the same path', () => {
    window.history.replaceState({}, '', '/instructor');
    const length = window.history.length;
    act(() => navigate('/instructor'));
    expect(window.history.length).toBe(length);
  });

  it('replaces instead of pushing when asked', () => {
    window.history.replaceState({}, '', '/');
    const length = window.history.length;
    act(() => navigate('/instructor', { replace: true }));
    expect(window.history.length).toBe(length);
    expect(window.location.pathname).toBe('/instructor');
  });

  it('follows the browser back button', async () => {
    window.history.replaceState({}, '', '/');
    render(<PathProbe />);
    act(() => navigate('/instructor/nights'));
    expect(screen.getByText('/instructor/nights')).toBeInTheDocument();

    act(() => window.history.back());
    expect(await screen.findByText('/')).toBeInTheDocument();
  });
});
