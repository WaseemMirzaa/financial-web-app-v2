'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Mail, Phone, MapPin, UserCheck, FileText, UserPlus, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';
import { Customer } from '@/types';
import { getLoanStatusColor, formatDate, formatDateOnly, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export function CustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const customerId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assignedEmployee, setAssignedEmployee] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customerLoans, setCustomerLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    fetchCustomer();
    fetchEmployees();
    fetchLoans();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      const data = await response.json();
      if (data.success) {
        setCustomer(data.data);
        setFormData({
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone || '',
          address: data.data.address || '',
        });
        if (data.data.assignedEmployeeId) {
          fetchAssignedEmployee(data.data.assignedEmployeeId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedEmployee = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const data = await response.json();
      if (data.success) {
        setAssignedEmployee(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await fetch(`/api/loans?customerId=${customerId}`);
      const data = await response.json();
      if (data.success) {
        setCustomerLoans(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    }
  };

  React.useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const handleEdit = () => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
      });
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
    if (!customer) return;
    setSubmitError('');
    setFormErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomer();
        setIsEditModalOpen(false);
        setFormErrors({});
        setSubmitError('');
      } else {
        setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      setSubmitError(t('error.internalServerError'));
    }
  };

  const handleAssignEmployee = async (employeeId: string) => {
    if (!customer) return;
    try {
      const response = await fetch(`/api/customers/${customer.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomer();
        setIsAssignModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to assign employee:', error);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!customer) return;
    try {
      const response = await fetch(`/api/customers/${customer.id}/assign`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        await fetchCustomer();
      }
    } catch (error) {
      console.error('Failed to remove employee:', error);
    }
  };

  if (loading) {
    return <div className="p-6">{t('common.loading')}...</div>;
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {t('common.back')}
        </Button>
        <Card variant="elevated" padding="large">
          <p className="text-neutral-500">{t('detail.customerNotFound')}</p>
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
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">{customer.name}</h1>
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
        <Button variant="primary" onClick={handleEdit}>
          <Edit className="w-4 h-4 me-2" />
          {t('page.editCustomer')}
        </Button>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('page.editCustomer')}
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
          <Input
            label={t('common.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
          />
          <Input
            label={t('common.address')}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={formErrors.address}
          />
        </div>
      </Modal>

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
          </div>
        </Card>

        <Card variant="elevated" padding="large">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-info-light rounded-xl">
                <UserCheck className="w-6 h-6 text-info" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">{t('detail.assignedEmployee')}</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {assignedEmployee ? (
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleRemoveEmployee}
                  className="whitespace-nowrap w-full sm:w-auto"
                >
                  <X className="w-4 h-4 me-2" />
                  {t('page.removeEmployee')}
                </Button>
              ) : null}
              <Button
                variant="primary"
                size="small"
                onClick={() => setIsAssignModalOpen(true)}
                className="whitespace-nowrap w-full sm:w-auto"
              >
                <UserPlus className="w-4 h-4 me-2" />
                {assignedEmployee ? t('page.changeEmployee') : t('page.assignEmployee')}
              </Button>
            </div>
          </div>
          {assignedEmployee ? (
            <div
              onClick={() => router.push(`/admin/employees/${assignedEmployee.id}`)}
              className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200 text-left rtl:text-right"
            >
              <p className="font-semibold text-neutral-900">{assignedEmployee.name}</p>
              <p className="text-sm text-neutral-600 mt-1">{assignedEmployee.email}</p>
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">{t('detail.noEmployeeAssigned')}</p>
          )}
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
                onClick={() => router.push(`/admin/loans/${loan.id}`)}
                className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left rtl:text-right">
                    <p className="font-semibold text-neutral-900">{formatCurrency(loan.amount, locale)}</p>
                    <p className="text-sm text-neutral-600 mt-1">
                      {formatPercent(loan.interestRate, locale)} {t('loan.interest')} • {formatNumber(loan.numberOfInstallments, locale)} {t('loan.installments')}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {t('loan.started')}: {formatDateOnly(loan.startDate, locale)}
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
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={t('page.assignEmployee')}
        footer={
          <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
            {t('common.cancel')}
          </Button>
        }
      >
        <div className="space-y-2">
          {employees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleAssignEmployee(employee.id)}
              className="w-full p-4 text-left rtl:text-right hover:bg-neutral-50 rounded-lg border border-neutral-200 transition-colors"
            >
              <p className="font-semibold text-neutral-900">{employee.name}</p>
              <p className="text-sm text-neutral-600">{employee.email}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
