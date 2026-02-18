'use client';

import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';

type TargetType = 'all' | 'all_employees' | 'all_customers';

export default function AdminBroadcastPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all' as TargetType,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sending, setSending] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = t('validation.required');
    }
    if (!formData.message.trim()) {
      errors.message = t('validation.required');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');
    setFormErrors({});

    if (!validateForm() || !user?.id) return;

    setSending(true);
    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          targetType: formData.targetType,
          createdBy: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.messageKey ? t(data.messageKey) : (data.message || t('broadcast.sentSuccessfully')));
        setFormData({
          title: '',
          message: '',
          targetType: 'all',
        });
      } else {
        setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      setSubmitError(t('error.internalServerError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left rtl:text-right">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
          {t('broadcast.pageTitle')}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600">
          {t('broadcast.pageDescription')}
        </p>
      </div>

      <Card variant="elevated" padding="large">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="p-3 rounded-lg bg-error-light border border-error text-error text-sm">
              {submitError}
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-lg bg-success-light border border-success text-success text-sm">
              {successMessage}
            </div>
          )}

          <Input
            label={t('broadcast.titleLabel')}
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
            }}
            error={formErrors.title}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              {t('broadcast.messageLabel')}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (formErrors.message) setFormErrors({ ...formErrors, message: '' });
              }}
              rows={4}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              required
            />
            {formErrors.message && (
              <p className="mt-2 text-sm text-error">{formErrors.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              {t('broadcast.targetAudience')}
            </label>
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value as TargetType })}
              className="w-full min-h-[48px] px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="all">{t('broadcast.targetAll')}</option>
              <option value="all_employees">{t('broadcast.targetAllEmployees')}</option>
              <option value="all_customers">{t('broadcast.targetAllCustomers')}</option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={sending}
              className="w-full sm:w-auto sm:min-w-[160px]"
            >
              <Megaphone className="w-4 h-4 me-2" />
              {sending ? t('broadcast.sending') : t('broadcast.send')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
