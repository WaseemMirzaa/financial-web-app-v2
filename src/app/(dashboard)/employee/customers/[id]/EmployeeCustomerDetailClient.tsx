'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockCustomers, mockLoans } from '@/lib/mockData';
import { Customer } from '@/types';
import { getLoanStatusColor, formatDate, formatDateOnly, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export function EmployeeCustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const customerId = params.id as string;
  
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
  
  const customer = allCustomers.find(c => c.id === customerId && c.assignedEmployeeId === user?.id);
  const customerLoans = mockLoans.filter(l => l.customerId === customerId && l.employeeId === user?.id);

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

      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">{customer.nameKey ? t(customer.nameKey) : customer.name}</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 rounded-xl">
              <Mail className="w-6 h-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('detail.contactInformation')}</h2>
          </div>
          <div className="space-y-4">
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('common.name')}</p>
              <p className="text-base font-semibold text-neutral-900">{customer.nameKey ? t(customer.nameKey) : customer.name}</p>
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
          </div>
        </Card>

        <Card variant="elevated" padding="large">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-success-light rounded-xl">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">{t('loan.summary')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('loan.totalLoans')}</p>
              <p className="text-2xl font-bold text-neutral-900">{formatNumber(customerLoans.length, locale)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">{t('dashboard.activeLoans')}</p>
              <p className="text-xl font-semibold text-neutral-900">
                {formatNumber(customerLoans.filter(l => l.status === 'active').length, locale)}
              </p>
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-sm text-neutral-600 mb-1">{t('loan.totalLoanAmount')}</p>
              <p className="text-xl font-semibold text-neutral-900">{formatCurrency(customerLoans.reduce((sum, l) => sum + l.amount, 0), locale)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="elevated" padding="large">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-info-light rounded-xl">
            <FileText className="w-6 h-6 text-info" />
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
    </div>
  );
}
