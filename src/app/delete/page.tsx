'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/PublicPageShell';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { fetchApi } from '@/lib/fetchApi';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [deleteEnabled, setDeleteEnabled] = useState(true);

  const { logout } = useAuth();
  const { t, isInitialized } = useLocale();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi('/api/mobile/settings');
        const data = await res.json();
        if (!cancelled && data?.success && data?.data) {
          setDeleteEnabled(!!data.data.deleteAccountEnabled);
        }
      } catch {
        if (!cancelled) setDeleteEnabled(true);
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isInitialized || settingsLoading) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  if (!deleteEnabled) {
    return (
      <PublicPageShell title={t('deleteAccount.title')}>
        <p className="text-sm text-neutral-700">{t('deleteAccount.disabled')}</p>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
            {t('common.login')}
          </Link>
        </p>
      </PublicPageShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!confirm) {
      setError(t('validation.required'));
      return;
    }
    setLoading(true);
    try {
      const response = await fetchApi('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!data.success) {
        if (data.errorKey) {
          setError(t(data.errorKey));
        } else {
          setError(data.error || t('auth.errorOccurred'));
        }
        return;
      }
      void logout();
    } catch {
      setError(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageShell title={t('deleteAccount.title')}>
      <p className="text-sm text-neutral-600 mb-4">{t('deleteAccount.description')}</p>
      <p className="text-sm text-error mb-6">{t('deleteAccount.warning')}</p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <Input
          label={t('common.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          size="medium"
        />
        <Input
          label={t('common.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          size="medium"
        />
        <label className="flex items-start gap-3 cursor-pointer text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="mt-1 rounded border-neutral-300"
          />
          <span>{t('deleteAccount.confirm')}</span>
        </label>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm text-error bg-error-light border border-error/20"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full min-h-[48px]" disabled={loading}>
          {loading ? t('deleteAccount.deleting') : t('deleteAccount.submit')}
        </Button>
      </form>

      <p className="mt-10 text-center text-sm text-neutral-500">
        <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
          {t('legal.privacyTitle')}
        </Link>
        {' · '}
        <Link href="/terms" className="text-primary-600 hover:text-primary-700">
          {t('legal.termsTitle')}
        </Link>
      </p>
    </PublicPageShell>
  );
}
