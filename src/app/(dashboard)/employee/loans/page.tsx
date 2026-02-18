'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockLoans, mockCustomers } from '@/lib/mockData';
import { Loan, LoanStatus } from '@/types';
import { getLoanStatusColor, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export default function EmployeeLoansPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>(mockLoans.filter(l => l.employeeId === user?.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    interestRate: '',
    numberOfInstallments: '',
    installmentTotal: '',
    startDate: '',
    status: 'under_review' as LoanStatus,
    notes: '',
  });

  const assignedCustomers = mockCustomers.filter(c => c.assignedEmployeeId === user?.id);

  const handleCreate = () => {
    setEditingLoan(null);
    setFormData({
      customerId: '',
      amount: '',
      interestRate: '',
      numberOfInstallments: '',
      installmentTotal: '',
      startDate: '',
      status: 'under_review',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      customerId: loan.customerId,
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

  const handleSave = () => {
    if (editingLoan) {
      setLoans(loans.map(l => 
        l.id === editingLoan.id 
          ? {
              ...l,
              ...formData,
              amount: parseFloat(formData.amount),
              interestRate: parseFloat(formData.interestRate),
              numberOfInstallments: parseInt(formData.numberOfInstallments),
              installmentTotal: parseFloat(formData.installmentTotal),
              updatedAt: new Date().toISOString(),
            }
          : l
      ));
    } else {
      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        customerId: formData.customerId,
        employeeId: user?.id || '',
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        installmentTotal: parseFloat(formData.installmentTotal),
        startDate: formData.startDate,
        status: formData.status,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLoans([...loans, newLoan]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{t('common.loans')}</h1>
          <p className="text-sm sm:text-base text-neutral-600">{t('employee.manageLoans')}</p>
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
                const customer = assignedCustomers.find(c => c.id === loan.customerId);
                return (
                  <tr
                    key={loan.id}
                    onClick={() => router.push(`/employee/loans/${loan.id}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-900 font-medium">{customer?.name || '-'}</td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-900">
                      {formatCurrency(loan.amount, locale)}
                    </td>
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
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
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
        size="large"
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
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('form.customer')}</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">{t('form.selectCustomer')}</option>
              {assignedCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
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
