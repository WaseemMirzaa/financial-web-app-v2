'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Shield, BarChart3, Users, Eye, EyeOff } from 'lucide-react';
import { getSafeNextPath } from '@/lib/safeNextPath';
import { isAppRole, isPathAllowedForRole } from '@/lib/roleRoutes';
// import { ChevronDown } from 'lucide-react'; // Demo credentials hidden

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Demo credentials hidden
  // const [showDemo, setShowDemo] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const { t, isInitialized } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      const raw = getSafeNextPath(
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null,
      );
      const next =
        raw && isAppRole(user.role) && isPathAllowedForRole(raw, user.role) ? raw : null;
      if (next) {
        router.replace(next);
        return;
      }
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'employee') router.push('/employee');
      else if (user.role === 'customer') router.push('/customer');
    }
  }, [isAuthenticated, user, router]);

  // Show loader while locale is being initialized
  if (!isInitialized) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || (result.errorKey ? t(result.errorKey) : t('auth.errorOccurred')));
      }
    } catch {
      setError(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-page">
      {/* Left: Hero — hidden on mobile/tablet, visible lg+ */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden min-h-[700px]">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,179,0.4),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(51,151,214,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(0,94,184,0.2),transparent)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
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

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:px-12 xl:px-20 min-h-[100dvh] lg:min-h-0 safe-area-pb">
        <div className="mx-auto w-full max-w-[440px] bg-white rounded-2xl shadow-soft-lg border border-neutral-100 p-6 sm:p-8 md:p-10">
          {/* Logo for mobile/tablet (no branded title) */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="" className="mx-auto h-14 w-auto object-contain mb-4" />
            <p className="text-neutral-500 text-sm">{t('auth.professionalPlatform')}</p>
          </div>

          <div className="lg:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-[1.25] tracking-tight">{t('common.welcomeBack')}</h2>
            <p className="mt-3 text-sm text-neutral-500">{t('auth.signIn')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1">
              <Input
                label={t('auth.emailOrCustomerId')}
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('form.placeholder.emailOrCustomerId')}
                size="medium"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-neutral-800">
                  {t('common.password')}
                </label>
                {/* Password reset disabled */}
                {/* <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  {t('auth.forgotPassword')}
                </Link> */}
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('form.placeholder.password')}
                  size="medium"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-error bg-error-light border border-error/20 animate-fade-in"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('common.error')}:</span>
                  <span>{error}</span>
                </div>
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
                  {t('auth.signingIn')}
                </span>
              ) : (
                t('common.login')
              )}
            </Button>
          </form>

          {/* Demo credentials - Hidden */}
          {/* <div className="mt-4 pt-6 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm text-neutral-500 hover:text-neutral-700 transition-colors duration-200 rounded-xl hover:bg-neutral-50"
            >
              <span className="font-medium">{t('auth.demoCredentials')}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
              />
            </button>
            {showDemo && (
              <div className="mt-4 p-5 rounded-2xl bg-neutral-50/80 border border-neutral-100 animate-fade-in">
                <p className="text-xs text-neutral-500 mb-4 font-medium">{t('auth.useAnyPassword')}</p>
                <div className="space-y-3">
                  {[
                    { role: t('common.admin'), email: 'admin@demo.com', color: 'text-primary-600' },
                    { role: t('common.employee'), email: 'employee@demo.com', color: 'text-info' },
                    { role: t('common.customer'), email: 'customer@demo.com', color: 'text-success' },
                  ].map(({ role, email, color }) => (
                    <div key={role} className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-100 hover:border-primary-200 hover:shadow-soft transition-all">
                      <span className="text-sm font-medium text-neutral-600">{role}</span>
                      <code className={`text-sm font-semibold ${color}`}>{email}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
}
