'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_STORAGE_KEY = 'forgotPasswordOtp';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ForgotPasswordPage() {
  const { t, isInitialized } = useLocale();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const isCustomer = customers.some((c: { email: string }) => c.email === email);
      if (isCustomer) {
        const code = generateOtp();
        const payload = { email, otp: code, expires: Date.now() + OTP_EXPIRY_MS };
        sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(payload));
        setDemoOtp(code);
      } else {
        setDemoOtp(null);
      }
      setStep('otp');
    } catch {
      setError(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
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
    const stored = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (!stored) {
      setError(t('auth.otpInvalidOrExpired'));
      return;
    }
    let payload: { email: string; otp: string; expires: number };
    try {
      payload = JSON.parse(stored);
    } catch {
      setError(t('auth.otpInvalidOrExpired'));
      return;
    }
    if (payload.email !== email || payload.otp !== otp || Date.now() > payload.expires) {
      setError(t('auth.otpInvalidOrExpired'));
      return;
    }
    setLoading(true);
    try {
      const creds = JSON.parse(localStorage.getItem('userCredentials') || '{}');
      creds[email] = newPassword;
      localStorage.setItem('userCredentials', JSON.stringify(creds));
      sessionStorage.removeItem(OTP_STORAGE_KEY);
      setDemoOtp(null);
      setSuccess(true);
    } catch {
      setError(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  // Show loader while locale is being initialized
  if (!isInitialized) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 bg-page">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-soft-lg border border-neutral-100 p-8 text-center">
          <div className="rounded-full w-14 h-14 bg-success/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">{t('auth.passwordResetSuccess')}</h1>
          <Link href="/login">
            <Button variant="primary" size="large" className="w-full mt-6">
              {t('auth.backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 bg-page">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-soft-lg border border-neutral-100 p-6 sm:p-8">
        <div className="text-center mb-2">
          <Link href="/login" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            ← {t('auth.backToLogin')}
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">
          {t('auth.forgotPasswordTitle')}
        </h1>
        <p className="text-sm text-neutral-600 mb-6 text-left rtl:text-right">
          {step === 'email' ? t('auth.forgotPasswordDescription') : t('auth.otpSent')}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label={t('common.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('form.placeholder.email')}
              required
            />
            {error && (
              <p className="text-sm text-error" role="alert">{error}</p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? t('auth.sendingOtp') : t('auth.sendOtp')}
            </Button>
          </form>
        ) : (
          <>
            {demoOtp && (
              <p className="text-sm text-neutral-500 mb-4 p-3 bg-neutral-100 rounded-xl text-left rtl:text-right">
                {t('auth.demoOtpHint')}: <strong>{demoOtp}</strong>
              </p>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label={t('auth.enterOtp')}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
            />
            <Input
              label={t('auth.newPassword')}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('form.placeholder.password')}
              required
              minLength={6}
            />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('form.placeholder.password')}
              required
              minLength={6}
            />
            {error && (
              <p className="text-sm text-error" role="alert">{error}</p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? t('auth.resettingPassword') : t('auth.resetPassword')}
            </Button>
          </form>
          </>
        )}
      </div>
    </div>
  );
}
