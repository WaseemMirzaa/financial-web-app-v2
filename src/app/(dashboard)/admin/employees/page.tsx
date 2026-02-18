'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, UserX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';
import { mockEmployees } from '@/lib/mockData';
import { Employee } from '@/types';
import { formatNumber } from '@/lib/utils';

export default function EmployeesPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [employees, setEmployees] = React.useState<Employee[]>(mockEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Persist employees to localStorage and merge with mock on load
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('employees');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = [...mockEmployees, ...parsed.filter((p: Employee) => !mockEmployees.some(m => m.id === p.id))];
        setEmployees(merged);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    const fromMock = employees.filter(e => mockEmployees.some(m => m.id === e.id));
    const created = employees.filter(e => !mockEmployees.some(m => m.id === e.id));
    if (created.length > 0) {
      localStorage.setItem('employees', JSON.stringify(created));
    } else {
      localStorage.removeItem('employees');
    }
  }, [employees]);

  const handleCreate = () => {
    setEditingEmployee(null);
    setFormData({ name: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({ name: employee.name, email: employee.email, password: '' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingEmployee) {
      setEmployees(employees.map(e => 
        e.id === editingEmployee.id 
          ? { ...e, name: formData.name, email: formData.email }
          : e
      ));
    } else {
      if (!formData.password || formData.password.length < 6) {
        return; // validation handled by required + minLength in UI
      }
      const newEmployee: Employee = {
        id: `employee-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: 'employee',
        isActive: true,
        assignedCustomerIds: [],
        createdAt: new Date().toISOString(),
      };
      setEmployees([...employees, newEmployee]);
      try {
        const creds = JSON.parse(localStorage.getItem('userCredentials') || '{}');
        creds[formData.email] = formData.password;
        localStorage.setItem('userCredentials', JSON.stringify(creds));
      } catch {
        localStorage.setItem('userCredentials', JSON.stringify({ [formData.email]: formData.password }));
      }
    }
    setIsModalOpen(false);
  };

  const handleDeactivate = (id: string) => {
    setEmployees(employees.map(e => 
      e.id === id ? { ...e, isActive: false } : e
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{t('common.employees')}</h1>
          <p className="text-sm text-neutral-600">{t('page.manageEmployees')}</p>
        </div>
        <Button onClick={handleCreate} variant="primary" size="medium" className="w-full sm:w-auto whitespace-nowrap">
          <Plus className="w-4 h-4 me-2" />
          {t('page.createEmployee')}
        </Button>
      </div>

      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.name')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.email')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('form.assigned')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-sm font-semibold text-neutral-900">{t('table.status')}</th>
                <th className="px-6 py-4 text-right rtl:text-left text-sm font-semibold text-neutral-900">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => router.push(`/admin/employees/${employee.id}`)}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-900 font-medium">{employee.name}</td>
                  <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">{employee.email}</td>
                  <td className="px-6 py-4 text-left rtl:text-right text-sm text-neutral-600">
                    {formatNumber(employee.assignedCustomerIds.length, locale)}
                  </td>
                  <td className="px-6 py-4 text-left rtl:text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      employee.isActive 
                        ? 'bg-success-light text-success' 
                        : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {employee.isActive ? t('status.active') : t('status.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end rtl:flex-row-reverse gap-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 hover:bg-neutral-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(employee.id)}
                        className="p-2 hover:bg-error-light rounded-xl transition-colors"
                      >
                        <UserX className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? t('page.editEmployee') : t('page.createEmployee')}
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
          {!editingEmployee && (
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
    </div>
  );
}
