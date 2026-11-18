import { useEffect, useState } from 'react';

/**
 * A deliberately small history-based router. The site has a handful of routes, so a
 * dependency would cost more than it saves; this keeps deep links and the back button
 * working inside the signed-in app.
 */
export function navigate(path: string, options: { replace?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === path && !options.replace) return;
  if (options.replace) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePathname(): string {
  const [path, setPath] = useState(() => (typeof window === 'undefined' ? '/' : window.location.pathname));
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return path;
}
