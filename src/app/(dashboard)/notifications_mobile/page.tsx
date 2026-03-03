'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

function getNotificationRoute(
  notif: { title?: string },
  role: string | undefined,
): string {
  const title = (notif.title || '').toLowerCase();
  if (role === 'employee' && (title.includes('customer assigned') || title.includes('عميل'))) {
    return '/employee/customers';
  }
  if (role === 'customer' && (title.includes('employee assigned') || title.includes('موظف'))) {
    return '/customer';
  }
  if (title.includes('loan') || title.includes('قرض')) {
    if (role === 'customer') return '/customer/loan';
    if (role === 'employee') return '/employee/loans';
    if (role === 'admin') return '/admin/loans';
  }
  if (title.includes('message') || title.includes('رسالة')) {
    if (role === 'admin') return '/admin/chat';
    if (role === 'employee') return '/employee/chat';
    return '/customer/chat';
  }
  if (role === 'admin') return '/admin';
  if (role === 'employee') return '/employee';
  return '/customer';
}

export default function NotificationsMobilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const role = user?.role;

  return (
    <div className="min-h-[100dvh] bg-page flex flex-col">
      <header className="bg-white border-b border-neutral-100 px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            {t('common.back')}
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-neutral-900">
            {t('common.notifications')}
          </h1>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs sm:text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              {t('notification.markAllRead')}
            </button>
          ) : (
            <span className="w-10" />
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center text-neutral-500">
            <Bell className="w-10 h-10 mb-3 text-neutral-300" />
            <p className="text-sm">{t('notification.noNotifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 bg-white mt-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                className={`w-full text-left px-4 py-4 flex items-start gap-3 ${
                  !notif.isRead ? 'bg-primary-50/40' : 'bg-white'
                } hover:bg-neutral-50 transition-colors`}
                onClick={() => {
                  markAsRead(notif.id);
                  const target = getNotificationRoute(notif, role);
                  router.push(target);
                }}
              >
                <div className="mt-1">
                  {!notif.isRead ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary-500" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-neutral-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-2 break-words">
                      {notif.message}
                    </p>
                  )}
                  {notif.createdAt && (
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatDate(notif.createdAt, locale ?? 'en')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

