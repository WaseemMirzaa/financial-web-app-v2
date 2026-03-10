'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Edit, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Loader } from '@/components/ui/Loader';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';
import { getLoanStatusColor, formatDateOnly, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { reloadIfStaleDeploy } from '@/lib/client-utils';
import { fetchApi } from '@/lib/fetchApi';

export function EmployeeCustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoans, setCustomerLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '', confirmPassword: '', customerIdNumber: '', nationality: '', systemEntryDate: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id && customerId) {
      fetchCustomer();
      fetchLoans();
    }
  }, [user?.id, customerId, locale, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && user?.id && customerId) {
        fetchCustomer();
        fetchLoans();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, customerId, locale, pathname]);

  const fetchCustomer = async () => {
    try {
      const response = await fetchApi(`/api/customers/${customerId}${user?.id ? `?userId=${encodeURIComponent(user.id)}` : ''}`);
      const data = await response.json();
      if (!data.success || !data.data) {
        setLoading(false);
        return;
      }
      const d = data.data;
      const isAssigned =
        d.assignedEmployeeId === user?.id ||
        (Array.isArray(d.assignedEmployeeIds) && d.assignedEmployeeIds.includes(user?.id));
      if (isAssigned) {
        setCustomer(d);
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await fetchApi(`/api/loans?customerId=${customerId}&locale=${locale}`);
      const data = await response.json();
      if (data.success) {
        setCustomerLoans(data.data);
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to fetch loans:', error);
    }
  };

  const handleEdit = () => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        password: '',
        confirmPassword: '',
        customerIdNumber: customer.customerIdNumber ?? '',
        nationality: customer.nationality ?? '',
        systemEntryDate: customer.systemEntryDate ? String(customer.systemEntryDate).slice(0, 10) : '',
      });
      setFormErrors({});
      setSubmitError('');
      setIsEditModalOpen(true);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t('validation.nameRequired');
    if (!formData.email.trim()) errors.email = t('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = t('validation.emailInvalid');
    if (formData.password) {
      if (formData.password.length < 6) errors.password = t('validation.passwordMinLength');
      else if (formData.password !== formData.confirmPassword) errors.confirmPassword = t('validation.passwordMismatch');
    } else if (formData.confirmPassword) {
      errors.confirmPassword = t('validation.passwordMismatch');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!customer) return;
    setSubmitError('');
    setFormErrors({});
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: { name: string; email: string; phone?: string; address?: string; password?: string; customerIdNumber?: string; nationality?: string; systemEntryDate?: string } = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        customerIdNumber: formData.customerIdNumber || undefined,
        nationality: formData.nationality || undefined,
        systemEntryDate: formData.systemEntryDate || undefined,
      };
      if (formData.password) payload.password = formData.password;
      const response = await fetchApi(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomer();
        setIsEditModalOpen(false);
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        setFormErrors({});
        setSubmitError('');
      } else {
        setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to update customer:', error);
      setSubmitError(t('error.internalServerError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {t('common.back')}
        </Button>
        <Card variant="elevated" padding="large">
          <p className="text-neutral-500">{t('loan.customerNotFoundOrNotAssigned')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} size="small">
          <ArrowLeft className="w-4 h-4 me-2" />
          {t('common.back')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">
            {customer.name}
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-neutral-600">
              <Mail className="w-4 h-4" />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            <Badge variant="success">{t('status.active')}</Badge>
          </div>
        </div>
        <Button variant="primary" size="small" onClick={handleEdit}>
          <Edit className="w-4 h-4 me-2" />
          {t('common.edit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 rounded-xl">
              <Mail className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('detail.contactInformation')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('common.name')}</p>
              <p className="text-base font-semibold text-neutral-900">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('common.email')}</p>
              <p className="text-base font-semibold text-neutral-900">{customer.email}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-sm text-neutral-600 mb-1">{t('common.phone')}</p>
                <p className="text-base font-semibold text-neutral-900">{customer.phone}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <p className="text-sm text-neutral-600 mb-1">{t('common.address')}</p>
                <p className="text-base font-semibold text-neutral-900">{customer.address}</p>
              </div>
            )}
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('form.memberSince')}</p>
              <p className="text-base font-semibold text-neutral-900">{formatDateOnly(customer.createdAt, locale)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('form.customerIdNumber')}</p>
              <p className="text-base font-semibold text-neutral-900">{customer.customerIdNumber || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('form.nationality')}</p>
              <p className="text-base font-semibold text-neutral-900">{customer.nationality || '—'}</p>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('form.systemEntryDate')}</p>
              <p className="text-base font-semibold text-neutral-900">
                {customer.systemEntryDate ? formatDateOnly(customer.systemEntryDate, locale) : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="elevated" padding="large">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-success-light rounded-xl">
            <FileText className="w-6 h-6 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">{t('detail.loanHistory')}</h2>
        </div>
        {customerLoans.length === 0 ? (
          <p className="text-neutral-500 text-sm">{t('detail.noLoansFound')}</p>
        ) : (
          <div className="space-y-4">
            {customerLoans.map((loan) => (
              <div
                key={loan.id}
                onClick={() => router.push(`/employee/loans/${loan.id}`)}
                className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left rtl:text-right">
                    <p className="font-semibold text-neutral-900">{formatCurrency(loan.amount, locale)}</p>
                    <p className="text-sm text-neutral-600 mt-1">
                      {formatPercent(loan.interestRate, locale)} {t('loan.interest')} • {formatNumber(loan.numberOfInstallments, locale)} {t('loan.installments')}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {t('detail.startDate')}: {formatDateOnly(loan.startDate, locale)}
                    </p>
                  </div>
                  <Badge variant={getLoanStatusColor(loan.status)}>
                    {t(`loan.status.${loan.status}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('page.editCustomer')}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={submitting}>
              {submitting ? t('common.loading') + '...' : t('common.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-error-light border border-error text-error text-sm">
              {submitError}
            </div>
          )}
          <Input
            label={t('common.name')}
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
            }}
            error={formErrors.name}
            required
          />
          <Input
            label={t('common.email')}
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
            }}
            error={formErrors.email}
            required
          />
          <Input
            label={t('common.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label={t('common.address')}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label={t('form.customerIdNumber')}
            value={formData.customerIdNumber}
            onChange={(e) => setFormData({ ...formData, customerIdNumber: e.target.value })}
          />
          <Input
            label={t('form.nationality')}
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          />
          <Input
            label={t('form.systemEntryDate')}
            type="date"
            value={formData.systemEntryDate}
            onChange={(e) => setFormData({ ...formData, systemEntryDate: e.target.value })}
          />
          <PasswordInput
            label={t('auth.newPassword')}
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
            }}
            error={formErrors.password}
            placeholder={t('form.placeholder.password')}
          />
          <PasswordInput
            label={t('auth.confirmPassword')}
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
            }}
            error={formErrors.confirmPassword}
          />
        </div>
      </Modal>
    </div>
  );
}
