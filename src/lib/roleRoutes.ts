/** Canonical dashboard paths per role (matches Sidebar & app routes). */

import { normalizePathname } from '@/lib/safeNextPath';

export type AppRole = 'admin' | 'employee' | 'customer';

/**
 * Whether this pathname may be shown for the given role (dashboard area + shared routes).
 * Wrong role on /admin|/employee|/customer → should show 404, not another role’s UI.
 */
export function isPathAllowedForRole(pathname: string | null | undefined, role: AppRole): boolean {
  const p = normalizePathname(pathname);
  if (p === '/chat' || p === '/loans' || p === '/notifications') return true;
  if (p === '/notifications_mobile' || p.startsWith('/notifications_mobile/')) return true;
  if (p.startsWith('/admin')) return role === 'admin';
  if (p.startsWith('/employee')) return role === 'employee';
  if (p.startsWith('/customer')) return role === 'customer';
  return false;
}

export function getDashboardPathForRole(role: AppRole): string {
  return `/${role}`;
}

/** Role home + query so Header opens the notifications popover. */
export function getDashboardWithNotificationsOpenPath(role: AppRole): string {
  return `${getDashboardPathForRole(role)}?openNotifications=1`;
}

export function getChatPathForRole(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin/chat';
    case 'employee':
      return '/employee/chat';
    default:
      return '/customer/chat';
  }
}

/** Customer uses singular `/customer/loan`; admin/employee use `/…/loans`. */
export function getLoansPathForRole(role: AppRole): string {
  switch (role) {
    case 'admin':
      return '/admin/loans';
    case 'employee':
      return '/employee/loans';
    default:
      return '/customer/loan';
  }
}

export function isAppRole(r: string | undefined): r is AppRole {
  return r === 'admin' || r === 'employee' || r === 'customer';
}
