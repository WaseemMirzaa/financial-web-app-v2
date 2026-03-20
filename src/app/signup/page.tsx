'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Shield, BarChart3, Users, Eye, EyeOff } from 'lucide-react';
import { fetchApi } from '@/lib/fetchApi';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [signupEnabled, setSignupEnabled] = useState(false);

  const { signup, isAuthenticated, user } = useAuth();
  const { t, isInitialized } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'employee') router.push('/employee');
      else if (user.role === 'customer') router.push('/customer');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi('/api/mobile/settings');
        const data = await res.json();
        if (!cancelled && data?.success && data?.data) {
          setSignupEnabled(!!data.data.signupEnabled);
        }
      } catch {
        if (!cancelled) setSignupEnabled(false);
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

  if (!signupEnabled) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-page">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-soft-lg border border-neutral-100 p-8 text-center">
          <p className="text-neutral-700">{t('error.customerSignupDisabled')}</p>
          <Link href="/login" className="mt-6 inline-block text-primary-600 font-semibold hover:text-primary-700">
            {t('auth.signInLink')}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      const result = await signup(name, email, password, phone || undefined, address || undefined);
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
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden min-h-[700px]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,179,0.4),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(51,151,214,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(0,94,184,0.2),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-800/90 to-primary-900/85" />
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 2xl:p-20">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <span className="text-primary-100 font-semibold tracking-wide text-xs uppercase">{t('auth.enterprisePlatform')}</span>
            </div>
            <h1 className="mt-6 text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white leading-[1.15] tracking-[-0.03em] max-w-2xl">
              {t('auth.signupHeroTitle')}
            </h1>
            <p className="mt-6 text-lg xl:text-xl text-white/85 leading-[1.7] max-w-xl font-normal">{t('auth.signupHeroDescription')}</p>
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
            <img src="/logo.png" alt="" className="mx-auto h-14 w-auto object-contain mb-4" />
            <p className="text-neutral-500 text-sm">{t('auth.professionalPlatform')}</p>
          </div>

          <div className="lg:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-[1.25] tracking-tight">{t('auth.customerRegistration')}</h2>
            <p className="mt-3 text-sm text-neutral-500">{t('auth.signUp')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label={t('auth.fullName')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              size="medium"
            />
            <Input
              label={t('common.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="medium"
            />
            <div className="space-y-1">
              <label htmlFor="signup-password" className="block text-sm font-semibold text-neutral-800">
                {t('common.password')}
              </label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              size="medium"
            />
            <Input
              label={t('auth.phoneOptional')}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              size="medium"
            />
            <Input
              label={t('auth.addressOptional')}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              size="medium"
            />

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
                  {t('auth.creatingAccount')}
                </span>
              ) : (
                t('auth.createAccount')
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              {t('auth.signInLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
