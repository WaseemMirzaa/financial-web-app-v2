'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  UserCheck,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { clsx } from 'clsx';

interface SidebarItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: ('admin' | 'employee' | 'customer')[];
}

interface SidebarProps {
  /** When true, sidebar is visible (e.g. in mobile drawer). When false, hidden on mobile, visible lg+. */
  inDrawer?: boolean;
  /** Callback to close the drawer when a menu item is clicked (for mobile/tablet) */
  onItemClick?: () => void;
}

export function Sidebar({ inDrawer = false, onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLocale();

  const sidebarItems: SidebarItem[] = [
    {
      href: '/admin',
      icon: LayoutDashboard,
      label: t('common.dashboard'),
      roles: ['admin'],
    },
    {
      href: '/admin/employees',
      icon: UserCheck,
      label: t('common.employees'),
      roles: ['admin'],
    },
    {
      href: '/admin/customers',
      icon: Users,
      label: t('common.customers'),
      roles: ['admin'],
    },
    {
      href: '/admin/loans',
      icon: FileText,
      label: t('common.loans'),
      roles: ['admin'],
    },
    {
      href: '/admin/chat',
      icon: MessageSquare,
      label: t('common.chat'),
      roles: ['admin'],
    },
    {
      href: '/admin/broadcast',
      icon: Megaphone,
      label: t('common.announcements'),
      roles: ['admin'],
    },
    {
      href: '/employee',
      icon: LayoutDashboard,
      label: t('common.dashboard'),
      roles: ['employee'],
    },
    {
      href: '/employee/customers',
      icon: Users,
      label: t('common.customers'),
      roles: ['employee'],
    },
    {
      href: '/employee/loans',
      icon: FileText,
      label: t('common.loans'),
      roles: ['employee'],
    },
    {
      href: '/employee/chat',
      icon: MessageSquare,
      label: t('common.chat'),
      roles: ['employee'],
    },
    {
      href: '/customer',
      icon: LayoutDashboard,
      label: t('common.dashboard'),
      roles: ['customer'],
    },
    {
      href: '/customer/loan',
      icon: FileText,
      label: t('common.loans'),
      roles: ['customer'],
    },
    {
      href: '/customer/chat',
      icon: MessageSquare,
      label: t('common.chat'),
      roles: ['customer'],
    },
  ];

  const filteredItems = sidebarItems.filter(item => item.roles.includes(user?.role || 'customer'));

  return (
    <aside
      className={`flex flex-col w-64 sm:w-72 bg-white border-r border-neutral-100 min-h-0 ${
        inDrawer ? 'h-full flex-1 w-[min(280px,85vw)]' : 'hidden lg:flex lg:w-64 xl:w-72 h-[calc(100vh-4rem)] sticky top-16'
      }`}
    >
      <div className="p-3 sm:p-4 border-b border-neutral-100 shrink-0">
        <img src="/logo.png" alt="" className="h-10 w-full object-contain object-left" />
      </div>
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          // Dashboard (base route) only active on exact match; other items active on exact or sub-routes
          const isBaseRoute = item.href === '/admin' || item.href === '/employee' || item.href === '/customer';
          const isActive = isBaseRoute
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                // Close drawer on mobile/tablet when item is clicked
                if (inDrawer && onItemClick) {
                  onItemClick();
                }
              }}
              className={clsx(
                'flex items-center gap-3 px-4 py-3.5 min-h-[44px] rounded-xl transition-all duration-200 touch-manipulation',
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
