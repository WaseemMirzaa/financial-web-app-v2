'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';
import { mockCustomers, mockEmployees } from '@/lib/mockData';
import { Customer } from '@/types';

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useLocale();
  // Load customers from localStorage if available, otherwise use mock data
  const loadCustomers = (): Customer[] => {
    try {
      const stored = localStorage.getItem('customers');
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...mockCustomers, ...parsed.filter((c: Customer) => !mockCustomers.find(m => m.id === c.id))];
      }
    } catch (e) {
      // Ignore errors
    }
    return mockCustomers;
  };
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '' });

  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ 
      name: customer.name, 
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      password: '', // Don't show existing password for security
    });
    setIsModalOpen(true);
  };

  const handleAssign = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAssignModalOpen(true);
  };

  const handleSave = () => {
    if (editingCustomer) {
      const updated = customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...formData }
          : c
      );
      setCustomers(updated);
      localStorage.setItem('customers', JSON.stringify(updated.filter(c => !mockCustomers.find(m => m.id === c.id))));
      
      // Update password if provided
      if (formData.password) {
        try {
          const creds = JSON.parse(localStorage.getItem('userCredentials') || '{}');
          creds[formData.email] = formData.password;
          localStorage.setItem('userCredentials', JSON.stringify(creds));
        } catch (e) {
          // Ignore
        }
      }
    } else {
      if (!formData.password || formData.password.length < 6) {
        return; // validation handled by required + minLength in UI
      }
      const newCustomer: Customer = {
        id: `customer-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: 'customer',
        isActive: true,
        assignedEmployeeId: '',
        createdAt: new Date().toISOString(),
      };
      const updated = [...customers, newCustomer];
      setCustomers(updated);
      localStorage.setItem('customers', JSON.stringify(updated.filter(c => !mockCustomers.find(m => m.id === c.id))));
      
      // Save password to userCredentials
      try {
        const creds = JSON.parse(localStorage.getItem('userCredentials') || '{}');
        creds[formData.email] = formData.password;
        localStorage.setItem('userCredentials', JSON.stringify(creds));
      } catch (e) {
        localStorage.setItem('userCredentials', JSON.stringify({ [formData.email]: formData.password }));
      }
    }
    setIsModalOpen(false);
  };

  const handleAssignEmployee = (employeeId: string) => {
    if (selectedCustomer) {
      setCustomers(customers.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, assignedEmployeeId: employeeId }
          : c
      ));
      setIsAssignModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{t('common.customers')}</h1>
          <p className="text-sm sm:text-base text-neutral-600">{t('page.manageCustomers')}</p>
        </div>
        <Button onClick={handleCreate} variant="primary" className="w-full sm:w-auto whitespace-nowrap">
          <Plus className="w-4 h-4 me-2" />
          {t('page.createCustomer')}
        </Button>
      </div>

      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.name')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.email')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.phone')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('form.assignedEmployee')}</th>
                <th className="px-6 py-4 text-right rtl:text-left text-sm font-semibold text-neutral-900">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {customers.map((customer) => {
                const assignedEmployee = mockEmployees.find(e => e.id === customer.assignedEmployeeId);
                return (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-900 font-medium">{customer.nameKey ? t(customer.nameKey) : customer.name}</td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">{customer.email}</td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">
                      {assignedEmployee ? (assignedEmployee.nameKey ? t(assignedEmployee.nameKey) : assignedEmployee.name) : t('detail.unassigned')}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end rtl:flex-row-reverse gap-2">
                        <button
                          onClick={() => handleAssign(customer)}
                          className="p-2 hover:bg-neutral-50 rounded-xl transition-colors"
                          title={t('page.assignEmployee')}
                        >
                          <UserPlus className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 hover:bg-neutral-50 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4 text-neutral-600" />
                        </button>
                      </div>
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
        title={editingCustomer ? t('page.editCustomer') : t('page.createCustomer')}
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
          {!editingCustomer && (
            <Input
              label={t('common.password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('form.placeholder.password')}
              required
              minLength={6}
            />
          )}
        </div>
      </Modal>

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
          {mockEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleAssignEmployee(employee.id)}
              className="w-full p-4 text-left rtl:text-right hover:bg-neutral-50 rounded-lg border border-neutral-200 transition-colors"
            >
              <p className="font-semibold text-neutral-900">{employee.nameKey ? t(employee.nameKey) : employee.name}</p>
              <p className="text-sm text-neutral-600">{employee.email}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
