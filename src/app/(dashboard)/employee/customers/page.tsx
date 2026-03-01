'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Plus, Edit } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Loader } from '@/components/ui/Loader';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Customer } from '@/types';
import { Search } from 'lucide-react';
import { reloadIfStaleDeploy } from '@/lib/client-utils';
import { fetchApi } from '@/lib/fetchApi';

export default function EmployeeCustomersPage() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user } = useAuth();
  const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCustomers();
    }
  }, [user?.id, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && user?.id) fetchCustomers();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id, pathname]);

  const fetchCustomers = async () => {
    try {
      const response = await fetchApi(`/api/employees/${user?.id}/customers`);
      const data = await response.json();
      if (data.success) {
        setAssignedCustomers(data.data);
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t('validation.nameRequired');
    if (!formData.email.trim()) errors.email = t('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = t('validation.emailInvalid');
    if (!editingCustomer) {
      if (!formData.password) errors.password = t('validation.passwordRequired');
      else if (formData.password.length < 6) errors.password = t('validation.passwordMinLength');
    } else if (formData.password && formData.password.length < 6) {
      errors.password = t('validation.passwordMinLength');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    setFormErrors({});
    setSubmitError('');
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    setFormErrors({});
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      password: '',
    });
    setFormErrors({});
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSubmitError('');
    setFormErrors({});
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingCustomer) {
        const response = await fetchApi(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            ...(formData.password && { password: formData.password }),
          }),
        });
        const data = await response.json();
        if (data.success) {
          await fetchCustomers();
          handleCloseModal();
        } else {
          setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
        }
      } else {
        const response = await fetchApi('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          const newId = data.data?.id;
          if (newId && user?.id) {
            try {
              const assignRes = await fetchApi(`/api/customers/${newId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeIds: [user.id], requestedByUserId: user.id }),
              });
              await assignRes.json();
            } catch (_) {}
          }
          await fetchCustomers();
          handleCloseModal();
        } else {
          setSubmitError(data.errorKey ? t(data.errorKey) : (data.error || t('error.internalServerError')));
        }
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to save customer:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2 text-left rtl:text-right">{t('dashboard.assignedCustomers')}</h1>
          <p className="text-neutral-600 text-left rtl:text-right">{t('page.viewAssignedCustomers')}</p>
        </div>
        <Button onClick={handleCreate} variant="primary" className="w-full sm:w-auto whitespace-nowrap">
          <Plus className="w-4 h-4 me-2" />
          {t('page.createCustomer')}
        </Button>
      </div>

      <Card variant="elevated" padding="large">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search') + ' ' + t('table.name') + ', ' + t('table.email') + ', ' + t('table.phone') + ', ID'}
              className="pl-10 rtl:pl-3 rtl:pr-10"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedCustomers.filter((customer) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return customer.name.toLowerCase().includes(query) ||
                 customer.email.toLowerCase().includes(query) ||
                 (customer.phone && customer.phone.toLowerCase().includes(query)) ||
                 customer.id.toLowerCase().includes(query);
        }).length === 0 ? (
          <Card variant="elevated" padding="large" className="col-span-full">
            <p className="text-center text-neutral-500">{searchQuery ? t('common.noResults') : t('dashboard.noAssignedCustomers')}</p>
          </Card>
        ) : (
          assignedCustomers.filter((customer) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return customer.name.toLowerCase().includes(query) ||
                   customer.email.toLowerCase().includes(query) ||
                   (customer.phone && customer.phone.toLowerCase().includes(query)) ||
                   customer.id.toLowerCase().includes(query);
          }).map((customer) => (
            <Card key={customer.id} variant="elevated" padding="medium" className="hover:shadow-xl transition-shadow text-left rtl:text-right">
              <Link href={`/employee/customers/${customer.id}`} className="block">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{customer.name}</h3>
                  <p className="text-sm text-neutral-600 mb-1">{customer.email}</p>
                  {customer.phone && (
                    <p className="text-sm text-neutral-600">{customer.phone}</p>
                  )}
                </div>
              </Link>
              <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end">
                <Button variant="outline" size="small" onClick={(e) => handleEdit(customer, e)}>
                  <Edit className="w-4 h-4 me-2" />
                  {t('common.edit')}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCustomer ? t('page.editCustomer') : t('page.createCustomer')}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>
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
            <div className="p-3 rounded-lg bg-error-light border border-error text-error text-sm">{submitError}</div>
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
          <PasswordInput
            label={t('common.password')}
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
            }}
            placeholder={editingCustomer ? t('form.placeholder.password') : undefined}
            error={formErrors.password}
            required={!editingCustomer}
            minLength={6}
          />
        </div>
      </Modal>
    </div>
  );
}
