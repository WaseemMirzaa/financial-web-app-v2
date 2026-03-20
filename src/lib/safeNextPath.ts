/** Normalize pathname (strip trailing slash except root). */
export function normalizePathname(path: string | null | undefined): string {
  const s = (path || '').trim();
  if (!s) return '/';
  const noSlash = s.replace(/\/$/, '');
  return noSlash || '/';
}

/**
 * Safe in-app path for post-login redirect (no open redirect).
 * Allows dashboard areas and short URLs /chat, /loans.
 */
export function getSafeNextPath(next: string | null | undefined): string | null {
  if (next == null || typeof next !== 'string') return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  const path = trimmed.split('?')[0].split('#')[0];
  if (path === '/login' || path === '/signup') return null;
  return path || null;
}
