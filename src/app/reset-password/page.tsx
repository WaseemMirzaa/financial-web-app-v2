'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Shield, BarChart3, Users } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t, isInitialized } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (!token) {
      setError(t('auth.invalidOrExpiredToken'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.errorKey ? t(data.errorKey) : (data.error || t('auth.errorOccurred')));
      }
    } catch {
      setError(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  }, [token, newPassword, confirmPassword, t, router]);

  useEffect(() => {
    if (!token && isInitialized) {
      setError(t('auth.invalidOrExpiredToken'));
    }
  }, [token, isInitialized, t]);

  if (!isInitialized) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-page">
        <div className="hidden lg:flex lg:flex-1 relative overflow-hidden min-h-[700px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,179,0.4),transparent)]" />
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-800/90 to-primary-900/85" />
        </div>
        <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:px-12 xl:px-20 min-h-[100dvh] lg:min-h-0 safe-area-pb">
          <div className="mx-auto w-full max-w-[440px] bg-white rounded-2xl shadow-soft-lg border border-neutral-100 p-6 sm:p-8 md:p-10 text-center">
            <div className="rounded-full w-14 h-14 bg-success/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">{t('auth.passwordResetSuccess')}</h1>
            <p className="text-sm text-neutral-600 mb-6">{t('auth.backToLogin')}</p>
            <Link href="/login">
              <Button variant="primary" size="large" className="w-full">
                {t('common.login')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-page">
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden min-h-[700px]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,179,0.4),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(51,151,214,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(0,94,184,0.2),transparent)]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-800/90 to-primary-900/85" />
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 2xl:p-20">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <span className="text-primary-100 font-semibold tracking-wide text-xs uppercase">{t('auth.enterprisePlatform')}</span>
            </div>
            <h1 className="mt-6 text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-[1.15] tracking-[-0.03em] max-w-2xl">
              {t('auth.heroTitle')}
            </h1>
            <p className="mt-6 text-lg xl:text-xl text-white/85 leading-[1.7] max-w-xl font-normal">
              {t('auth.heroDescription')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 xl:gap-6 mt-12 xl:mt-16">
            {[
              { icon: Shield, label: t('auth.bankGradeSecurity'), desc: t('auth.enterpriseCompliance') },
              { icon: BarChart3, label: t('auth.realTimeAnalytics'), desc: t('auth.dataDrivenInsights') },
              { icon: Users, label: t('auth.roleBasedAccess'), desc: t('auth.granularPermissions') },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group">
                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                      <Icon className="h-6 w-6 text-primary-200" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-xs text-white/60 mt-0.5">{desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:px-12 xl:px-20 min-h-[100dvh] lg:min-h-0 safe-area-pb">
        <div className="mx-auto w-full max-w-[440px] bg-white rounded-2xl shadow-soft-lg border border-neutral-100 p-6 sm:p-8 md:p-10">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-soft">
              <span className="text-xl font-bold text-white">LM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 leading-[1.25] tracking-tight mb-2">{t('app.loanManager')}</h1>
            <p className="text-neutral-500 text-sm">{t('auth.professionalPlatform')}</p>
          </div>

          <div className="text-center mb-2">
            <Link href="/login" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              ← {t('auth.backToLogin')}
            </Link>
          </div>
          <div className="lg:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-[1.25] tracking-tight text-left rtl:text-right">{t('auth.resetPassword')}</h2>
            <p className="mt-3 text-sm text-neutral-500 text-left rtl:text-right">{t('auth.newPassword')}</p>
          </div>

          {!token ? (
            <div className="rounded-xl px-4 py-3 text-sm text-error bg-error-light border border-error/20 mb-4" role="alert">
              {t('auth.invalidOrExpiredToken')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label={t('auth.newPassword')}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder={t('form.placeholder.password')}
                size="medium"
              />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder={t('form.placeholder.password')}
                size="medium"
              />
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-error bg-error-light border border-error/20" role="alert">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                size="large"
                className="w-full mt-6 min-h-[52px] font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('auth.resettingPassword')}
                  </span>
                ) : (
                  t('auth.resetPassword')
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 sm:mt-8 pt-6 border-t border-neutral-100 text-center">
            <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
