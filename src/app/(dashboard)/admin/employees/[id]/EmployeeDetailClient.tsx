'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Mail, UserCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useLocale } from '@/contexts/LocaleContext';
import { Customer, Employee } from '@/types';
import { formatDateOnly, formatNumber } from '@/lib/utils';

export function EmployeeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const employeeId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    fetchEmployee();
    fetchAssignedCustomers();
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const data = await response.json();
      if (data.success) {
        setEmployee(data.data);
        setFormData({
          name: data.data.name,
          email: data.data.email,
        });
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedCustomers = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/customers`);
      const data = await response.json();
      if (data.success) {
        setAssignedCustomers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assigned customers:', error);
    }
  };

  React.useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
      });
    }
  }, [employee]);

  const handleEdit = () => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
      });
      setFormErrors({});
      setSubmitError('');
      setIsEditModalOpen(true);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = t('validation.nameRequired');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('validation.emailInvalid');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!employee) return;
    setSubmitError('');
    setFormErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchEmployee();
        setIsEditModalOpen(false);
        setFormErrors({});
        setSubmitError('');
      } else {
        setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      setSubmitError(t('error.internalServerError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {t('common.back')}
        </Button>
        <Card variant="elevated" padding="large">
          <p className="text-neutral-500">{t('detail.employeeNotFound')}</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">{employee.name}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-neutral-600">
              <Mail className="w-4 h-4" />
              <span>{employee.email}</span>
            </div>
            <Badge variant={employee.isActive ? 'success' : 'default'}>
              {employee.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          </div>
        </div>
        <Button variant="primary" onClick={handleEdit}>
          <Edit className="w-4 h-4 me-2" />
          {t('page.editEmployee')}
        </Button>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('page.editEmployee')}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {t('common.save')}
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
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('detail.employeeInformation')}</h2>
          </div>
          <div className="space-y-4">
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('common.name')}</p>
              <p className="text-base font-semibold text-neutral-900">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('common.email')}</p>
              <p className="text-base font-semibold text-neutral-900">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('common.status')}</p>
              <Badge variant={employee.isActive ? 'success' : 'default'}>
                {employee.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('form.memberSince')}</p>
              <p className="text-base font-semibold text-neutral-900">{formatDateOnly(employee.createdAt, locale)}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-info-light rounded-xl">
              <Users className="w-6 h-6 text-info" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('detail.assignedCustomers')}</h2>
          </div>
          <div className="space-y-3">
            {assignedCustomers.length === 0 ? (
              <p className="text-neutral-500 text-sm">{t('detail.noCustomersAssigned')}</p>
            ) : (
              assignedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200 text-left rtl:text-right"
                >
                  <p className="font-semibold text-neutral-900">{customer.name}</p>
                  <p className="text-sm text-neutral-600 mt-1">{customer.email}</p>
                </div>
              ))
            )}
            <div className="pt-2">
              <p className="text-sm font-semibold text-neutral-900">
                {t('detail.totalCustomers', { count: formatNumber(assignedCustomers.length, locale), plural: assignedCustomers.length !== 1 ? 's' : '' })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
