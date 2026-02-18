'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, User, Calendar, DollarSign, Percent, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockLoans, mockCustomers } from '@/lib/mockData';
import { Loan, LoanStatus, Customer } from '@/types';
import { getLoanStatusColor, formatDate, formatDateOnly, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export function EmployeeLoanDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const loanId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Load customers from localStorage
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>(mockCustomers);
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('customers');
      if (stored) {
        const parsed: Customer[] = JSON.parse(stored);
        const merged = [...mockCustomers, ...parsed.filter((c: Customer) => !mockCustomers.find(m => m.id === c.id))];
        setAllCustomers(merged);
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);
  
  const loan = mockLoans.find(l => l.id === loanId && l.employeeId === user?.id);
  const customer = allCustomers.find(c => c.id === loan?.customerId);
  const [formData, setFormData] = useState({
    amount: loan?.amount.toString() || '',
    interestRate: loan?.interestRate.toString() || '',
    numberOfInstallments: loan?.numberOfInstallments.toString() || '',
    installmentTotal: loan?.installmentTotal.toString() || '',
    startDate: loan?.startDate || '',
    status: loan?.status || 'under_review' as LoanStatus,
    notes: loan?.notes || '',
  });

  if (!loan) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {t('common.back')}
        </Button>
        <Card variant="elevated" padding="large">
          <p className="text-neutral-500">{t('loan.notFoundOrNotAssigned')}</p>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    setIsEditModalOpen(false);
  };

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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">{t('loan.loanNumber', { number: loan.id.slice(-6) })}</h1>
            <Badge variant={getLoanStatusColor(loan.status)}>
              {t(`loan.status.${loan.status}`)}
            </Badge>
          </div>
          <p className="text-neutral-600 text-left rtl:text-right">{t('form.created')} {formatDate(loan.createdAt, locale)}</p>
        </div>
        <Button variant="primary" onClick={() => setIsEditModalOpen(true)}>
          <Edit className="w-4 h-4 me-2" />
          {t('page.editLoan')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('detail.loanDetails')}</h2>
          </div>
          <div className="space-y-4">
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('detail.loanAmount')}</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(loan.amount, locale)}</p>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('detail.interestRate')}</p>
              <p className="text-xl font-semibold text-neutral-900">{formatPercent(loan.interestRate, locale)}</p>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('detail.numberOfInstallments')}</p>
              <p className="text-xl font-semibold text-neutral-900">{formatNumber(loan.numberOfInstallments, locale)}</p>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('detail.installmentAmount')}</p>
              <p className="text-xl font-semibold text-neutral-900">{formatCurrency(loan.installmentTotal, locale)}</p>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('detail.startDate')}</p>
              <p className="text-base font-semibold text-neutral-900">{formatDateOnly(loan.startDate, locale)}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-info-light rounded-xl">
              <User className="w-6 h-6 text-info" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('detail.customer')}</h2>
          </div>
          <div
            onClick={() => router.push(`/employee/customers/${loan.customerId}`)}
            className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200 text-left rtl:text-right"
          >
            <p className="font-semibold text-neutral-900">{customer?.nameKey ? t(customer.nameKey) : (customer?.name || t('detail.unknown'))}</p>
            <p className="text-sm text-neutral-600 mt-1">{customer?.email}</p>
            {customer?.phone && (
              <p className="text-sm text-neutral-600 mt-1">{customer.phone}</p>
            )}
          </div>
        </Card>
      </div>

      {loan.notes && (
        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-neutral-600" />
            <h2 className="text-xl font-semibold text-neutral-900">{t('loan.notes')}</h2>
          </div>
          <p className="text-neutral-700 leading-relaxed text-left rtl:text-right">{loan.notesKey ? t(loan.notesKey) : loan.notes}</p>
        </Card>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('page.editLoan')}
        size="large"
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
          <Input
            label={t('form.amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <Input
            label={`${t('form.interestRate')} (%)`}
            type="number"
            step="0.1"
            value={formData.interestRate}
            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
            required
          />
          <Input
            label={t('form.numberOfInstallments')}
            type="number"
            value={formData.numberOfInstallments}
            onChange={(e) => setFormData({ ...formData, numberOfInstallments: e.target.value })}
            required
          />
          <Input
            label={t('form.installmentTotal')}
            type="number"
            value={formData.installmentTotal}
            onChange={(e) => setFormData({ ...formData, installmentTotal: e.target.value })}
            required
          />
          <Input
            label={t('form.startDate')}
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('common.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LoanStatus })}
              className="w-full h-12 px-4 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full h-24 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
