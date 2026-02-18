'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, FileText, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/contexts/LocaleContext';
import { mockUsers, mockLoans, mockChats, mockCustomers, mockEmployees } from '@/lib/mockData';
import { getLoanStatusColor, formatCurrency, formatNumber } from '@/lib/utils';

export default function AdminDashboard() {
  const router = useRouter();
  const { t, locale } = useLocale();
  // Merge customers from localStorage so signup users appear in recent list
  const [recentCustomers, setRecentCustomers] = React.useState(mockCustomers);
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('customers');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = [...mockCustomers, ...parsed.filter((c: { id: string }) => !mockCustomers.some(m => m.id === c.id))];
        setRecentCustomers(merged);
      }
    } catch {
      // ignore
    }
  }, []);

  const stats = [
    {
      label: t('dashboard.totalCustomers'),
      value: mockUsers.filter(u => u.role === 'customer').length,
      icon: Users,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
      href: '/admin/customers',
    },
    {
      label: t('dashboard.totalEmployees'),
      value: mockUsers.filter(u => u.role === 'employee').length,
      icon: UserCheck,
      color: 'text-info',
      bgColor: 'bg-info-light',
      href: '/admin/employees',
    },
    {
      label: t('dashboard.totalLoans'),
      value: mockLoans.length,
      icon: FileText,
      color: 'text-success',
      bgColor: 'bg-success-light',
      href: '/admin/loans',
    },
    {
      label: t('dashboard.activeChats'),
      value: mockChats.length,
      icon: MessageSquare,
      color: 'text-warning',
      bgColor: 'bg-warning-light',
      href: '/admin/chat',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-left rtl:text-right">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{t('common.dashboard')}</h1>
        <p className="text-sm sm:text-base text-neutral-600">{t('dashboard.welcomeAdmin')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              variant="elevated"
              padding="medium"
              className="cursor-pointer transition-all duration-300"
              onClick={() => router.push(stat.href)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-neutral-600 mb-1 truncate">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-neutral-900">{formatNumber(stat.value, locale)}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" padding="medium">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">{t('dashboard.recentLoans')}</h3>
          <div className="space-y-4">
            {mockLoans.slice(0, 5).map((loan) => (
              <div
                key={loan.id}
                onClick={() => router.push(`/admin/loans/${loan.id}`)}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
              >
                <div className="text-left rtl:text-right">
                  <p className="font-semibold text-neutral-900">
                    {formatCurrency(loan.amount, locale)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {t('common.status')}: {t(`loan.status.${loan.status}`)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  loan.status === 'active' ? 'bg-success-light text-success' :
                  loan.status === 'approved' ? 'bg-info-light text-info' :
                  'bg-neutral-200 text-neutral-600'
                }`}>
                  {t(`loan.status.${loan.status}`)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="elevated" padding="medium">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">{t('dashboard.systemOverview')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">{t('dashboard.activeLoans')}</span>
              <span className="font-semibold text-neutral-900">
                {formatNumber(mockLoans.filter(l => l.status === 'active').length, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">{t('dashboard.pendingReviews')}</span>
              <span className="font-semibold text-neutral-900">
                {formatNumber(mockLoans.filter(l => l.status === 'under_review').length, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">{t('dashboard.totalLoanAmount')}</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(mockLoans.reduce((sum, l) => sum + l.amount, 0), locale)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Customers & Recent Employees - clickable to detail pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" padding="medium">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">{t('dashboard.recentCustomers')}</h3>
          <div className="space-y-3">
            {recentCustomers.slice(0, 5).map((customer) => (
              <div
                key={customer.id}
                onClick={() => router.push(`/admin/customers/${customer.id}`)}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
              >
                <div className="text-left rtl:text-right">
                  <p className="font-semibold text-neutral-900">{customer.nameKey ? t(customer.nameKey) : customer.name}</p>
                  <p className="text-sm text-neutral-600">{customer.email}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="elevated" padding="medium">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">{t('dashboard.recentEmployees')}</h3>
          <div className="space-y-3">
            {mockEmployees.slice(0, 5).map((employee) => (
              <div
                key={employee.id}
                onClick={() => router.push(`/admin/employees/${employee.id}`)}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
              >
                <div className="text-left rtl:text-right">
                  <p className="font-semibold text-neutral-900">{employee.nameKey ? t(employee.nameKey) : employee.name}</p>
                  <p className="text-sm text-neutral-600">{employee.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  employee.isActive ? 'bg-success-light text-success' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {employee.isActive ? t('status.active') : t('status.inactive')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
