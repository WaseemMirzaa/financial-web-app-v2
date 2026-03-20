'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

export function PublicPageShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { locale, t } = useLocale();

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] bg-neutral-50 text-neutral-900"
    >
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            {t('legal.home')}
          </Link>
          {title ? (
            <h1 className="flex-1 text-center text-base font-semibold text-neutral-900">{title}</h1>
          ) : (
            <span className="flex-1" />
          )}
          <span className="w-12 shrink-0" aria-hidden />
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 pb-16">{children}</div>
    </div>
  );
}
