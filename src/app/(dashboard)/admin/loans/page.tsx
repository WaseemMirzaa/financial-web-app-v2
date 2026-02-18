'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/contexts/LocaleContext';
import { Loan, LoanStatus } from '@/types';
import { getLoanStatusColor, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export default function LoansPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    employeeId: '',
    amount: '',
    interestRate: '',
    numberOfInstallments: '',
    installmentTotal: '',
    startDate: '',
    status: 'under_review' as LoanStatus,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchLoans();
    fetchCustomers();
    fetchEmployees();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      const data = await response.json();
      if (data.success) {
        setLoans(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
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

  const handleCreate = () => {
    setEditingLoan(null);
    setFormData({
      customerId: '',
      employeeId: '',
      amount: '',
      interestRate: '',
      numberOfInstallments: '',
      installmentTotal: '',
      startDate: '',
      status: 'under_review',
      notes: '',
    });
    setFormErrors({});
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      customerId: loan.customerId,
      employeeId: loan.employeeId,
      amount: loan.amount.toString(),
      interestRate: loan.interestRate.toString(),
      numberOfInstallments: loan.numberOfInstallments.toString(),
      installmentTotal: loan.installmentTotal.toString(),
      startDate: loan.startDate,
      status: loan.status,
      notes: loan.notes || '',
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editingLoan) {
      if (!formData.customerId) {
        errors.customerId = t('validation.customerRequired');
      }
      if (!formData.employeeId) {
        errors.employeeId = t('validation.employeeRequired');
      }
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = t('validation.amountRequired');
    }
    
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      errors.interestRate = t('validation.interestRateRequired');
    }
    
    if (!formData.numberOfInstallments || parseInt(formData.numberOfInstallments) <= 0) {
      errors.numberOfInstallments = t('validation.installmentsRequired');
    }
    
    if (!formData.startDate) {
      errors.startDate = t('validation.startDateRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setSubmitError('');
    setFormErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (editingLoan) {
        const response = await fetch(`/api/loans/${editingLoan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(formData.amount),
            interestRate: parseFloat(formData.interestRate),
            numberOfInstallments: parseInt(formData.numberOfInstallments),
            installmentTotal: parseFloat(formData.installmentTotal),
            startDate: formData.startDate,
            status: formData.status,
            notes: formData.notes,
          }),
        });
        const data = await response.json();
        if (data.success) {
          await fetchLoans();
          setIsModalOpen(false);
          setFormErrors({});
          setSubmitError('');
        } else {
          setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
        }
      } else {
        const response = await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: formData.customerId,
            employeeId: formData.employeeId,
            amount: parseFloat(formData.amount),
            interestRate: parseFloat(formData.interestRate),
            numberOfInstallments: parseInt(formData.numberOfInstallments),
            installmentTotal: parseFloat(formData.installmentTotal),
            startDate: formData.startDate,
            status: formData.status,
            notes: formData.notes,
          }),
        });
        const data = await response.json();
        if (data.success) {
          await fetchLoans();
          setIsModalOpen(false);
          setFormErrors({});
          setSubmitError('');
        } else {
          setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
        }
      }
    } catch (error) {
      console.error('Failed to save loan:', error);
      setSubmitError(t('error.internalServerError'));
    }
  };

  if (loading) {
    return <div className="p-6">{t('common.loading')}...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{t('common.loans')}</h1>
          <p className="text-sm sm:text-base text-neutral-600">{t('page.manageAllLoans')}</p>
        </div>
        <Button onClick={handleCreate} variant="primary" className="w-full sm:w-auto whitespace-nowrap">
          <Plus className="w-4 h-4 me-2" />
          {t('page.createLoan')}
        </Button>
      </div>

      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.customer')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.amount')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.interestRate')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.installments')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.status')}</th>
                <th className="px-6 py-4 text-right rtl:text-left text-sm font-semibold text-neutral-900">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loans.map((loan) => {
                const customer = customers.find(c => c.id === loan.customerId);
                return (
                  <tr
                    key={loan.id}
                    onClick={() => router.push(`/admin/loans/${loan.id}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-900 font-medium">
                      {customer ? customer.name : loan.customerId}
                    </td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-900">{formatCurrency(loan.amount, locale)}</td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">{formatPercent(loan.interestRate, locale)}</td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">{formatNumber(loan.numberOfInstallments, locale)}</td>
                    <td className="px-6 py-4 text-left rtl:text-right">
                      <Badge variant={getLoanStatusColor(loan.status)}>
                        {t(`loan.status.${loan.status}`)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(loan)}
                        className="p-2 hover:bg-neutral-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLoan ? t('page.editLoan') : t('page.createLoan')}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
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
          {!editingLoan && (
            <>
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('form.customer')}</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => {
                    setFormData({ ...formData, customerId: e.target.value });
                    if (formErrors.customerId) setFormErrors({ ...formErrors, customerId: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    formErrors.customerId ? 'border-error' : 'border-neutral-200'
                  }`}
                  required
                >
                  <option value="">{t('form.selectCustomer')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {formErrors.customerId && (
                  <p className="mt-2 text-sm text-error">{formErrors.customerId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('form.employee')}</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    setFormData({ ...formData, employeeId: e.target.value });
                    if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: '' });
                  }}
                  className={`w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    formErrors.employeeId ? 'border-error' : 'border-neutral-200'
                  }`}
                  required
                >
                  <option value="">{t('form.selectEmployee')}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                {formErrors.employeeId && (
                  <p className="mt-2 text-sm text-error">{formErrors.employeeId}</p>
                )}
              </div>
            </>
          )}
          <Input
            label={t('form.amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value });
              if (formErrors.amount) setFormErrors({ ...formErrors, amount: '' });
            }}
            error={formErrors.amount}
            required
          />
          <Input
            label={t('form.interestRate')}
            type="number"
            step="0.01"
            value={formData.interestRate}
            onChange={(e) => {
              setFormData({ ...formData, interestRate: e.target.value });
              if (formErrors.interestRate) setFormErrors({ ...formErrors, interestRate: '' });
            }}
            error={formErrors.interestRate}
            required
          />
          <Input
            label={t('form.numberOfInstallments')}
            type="number"
            value={formData.numberOfInstallments}
            onChange={(e) => {
              setFormData({ ...formData, numberOfInstallments: e.target.value });
              if (formErrors.numberOfInstallments) setFormErrors({ ...formErrors, numberOfInstallments: '' });
            }}
            error={formErrors.numberOfInstallments}
            required
          />
          <Input
            label={t('form.installmentTotal')}
            type="number"
            value={formData.installmentTotal}
            onChange={(e) => {
              setFormData({ ...formData, installmentTotal: e.target.value });
              if (formErrors.installmentTotal) setFormErrors({ ...formErrors, installmentTotal: '' });
            }}
            error={formErrors.installmentTotal}
            required
          />
          <Input
            label={t('form.startDate')}
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              setFormData({ ...formData, startDate: e.target.value });
              if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: '' });
            }}
            error={formErrors.startDate}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('common.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LoanStatus })}
              className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="under_review">{t('loan.status.under_review')}</option>
              <option value="approved">{t('loan.status.approved')}</option>
              <option value="active">{t('loan.status.active')}</option>
              <option value="rejected">{t('loan.status.rejected')}</option>
              <option value="closed">{t('loan.status.closed')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('loan.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-24 px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
