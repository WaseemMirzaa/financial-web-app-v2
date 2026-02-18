'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Mail, UserCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';
import { mockEmployees, mockCustomers } from '@/lib/mockData';
import { Customer, Employee } from '@/types';
import { formatDateOnly, formatNumber } from '@/lib/utils';

export function EmployeeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const employeeId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  // Load employees from localStorage and merge with mock data
  const [allEmployees, setAllEmployees] = React.useState<Employee[]>(mockEmployees);
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('employees');
      if (stored) {
        const parsed: Employee[] = JSON.parse(stored);
        const merged = [...mockEmployees, ...parsed.filter((e: Employee) => !mockEmployees.find(m => m.id === e.id))];
        setAllEmployees(merged);
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);
  
  // Load customers from localStorage for assigned customers list
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
  
  const employee = allEmployees.find(e => e.id === employeeId);
  const assignedCustomers = allCustomers.filter(c => employee?.assignedCustomerIds.includes(c.id));

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
      setIsEditModalOpen(true);
    }
  };

  const handleSave = () => {
    if (employee) {
      const updated = allEmployees.map(e =>
        e.id === employee.id
          ? { ...e, ...formData }
          : e
      );
      setAllEmployees(updated);
      
      // Update localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('employees') || '[]');
        const updatedStored = stored.map((e: Employee) =>
          e.id === employee.id ? { ...e, ...formData } : e
        );
        localStorage.setItem('employees', JSON.stringify(updatedStored));
      } catch (e) {
        // Ignore
      }
      
      setIsEditModalOpen(false);
      router.refresh();
    }
  };

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
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">{employee.nameKey ? t(employee.nameKey) : employee.name}</h1>
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
          <Input
            label={t('common.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('common.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              <p className="text-base font-semibold text-neutral-900">{employee.nameKey ? t(employee.nameKey) : employee.name}</p>
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
                  <p className="font-semibold text-neutral-900">{customer.nameKey ? t(customer.nameKey) : customer.name}</p>
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
