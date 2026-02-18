'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Customer } from '@/types';

export default function EmployeeCustomersPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCustomers();
    }
  }, [user?.id]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/employees/${user?.id}/customers`);
      const data = await response.json();
      if (data.success) {
        setAssignedCustomers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">{t('dashboard.assignedCustomers')}</h1>
        <p className="text-neutral-600 text-left rtl:text-right">{t('page.viewAssignedCustomers')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedCustomers.length === 0 ? (
          <Card variant="elevated" padding="large" className="col-span-full">
            <p className="text-center text-neutral-500">{t('dashboard.noAssignedCustomers')}</p>
          </Card>
        ) : (
          assignedCustomers.map((customer) => (
            <Link key={customer.id} href={`/employee/customers/${customer.id}`}>
              <Card variant="elevated" padding="medium" className="hover:shadow-xl transition-shadow cursor-pointer text-left rtl:text-right">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{customer.name}</h3>
                  <p className="text-sm text-neutral-600 mb-1">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-sm text-neutral-600">{customer.phone}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
