import { normalizePathname } from '@/lib/safeNextPath';

/** Routes that stay public (no login) for web + mobile deep links. */
const PUBLIC_NO_AUTH_PATHS = new Set([
  '/privacy',
  '/terms',
  '/delete',
  '/privacy-policy',
  '/terms-of-service',
]);

export function isPublicNoAuthPath(pathname: string | null | undefined): boolean {
  return PUBLIC_NO_AUTH_PATHS.has(normalizePathname(pathname));
}
