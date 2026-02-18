'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage for persisted session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - accept any password for demo users (mockUsers)
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }

    // localStorage users (customers from signup, employees created by admin) require password
    let credentials: Record<string, string> = {};
    try {
      credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    } catch {
      // ignore
    }

    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customer = customers.find((c: User) => c.email === email);
      if (customer && credentials[email] === password) {
        setUser(customer);
        localStorage.setItem('user', JSON.stringify(customer));
        return true;
      }
    } catch (e) {
      // Ignore parse errors
    }

    try {
      const storedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
      const allEmployees = [...mockUsers.filter(u => u.role === 'employee'), ...storedEmployees];
      const employee = allEmployees.find((e: User) => e.email === email);
      if (employee) {
        const isDemoEmployee = mockUsers.some(u => u.id === employee.id);
        if (isDemoEmployee || credentials[email] === password) {
          setUser(employee);
          localStorage.setItem('user', JSON.stringify(employee));
          return true;
        }
      }
    } catch (e) {
      // Ignore
    }

    return false;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: string
  ): Promise<boolean> => {
    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return false; // Email already exists
    }

    // Create new customer user
    const newCustomer: User = {
      id: `customer-${Date.now()}`,
      email,
      name,
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // In real app, this would be an API call
    // For now, add to localStorage and store credentials for login
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customerData = {
      ...newCustomer,
      phone,
      address,
      assignedEmployeeId: '',
    };
    customers.push(customerData);
    localStorage.setItem('customers', JSON.stringify(customers));

    const creds = JSON.parse(localStorage.getItem('userCredentials') || '{}');
    creds[email] = password;
    localStorage.setItem('userCredentials', JSON.stringify(creds));

    // Auto-login after signup
    setUser(newCustomer);
    localStorage.setItem('user', JSON.stringify(newCustomer));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
