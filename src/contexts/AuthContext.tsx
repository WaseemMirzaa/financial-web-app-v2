'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; errorKey?: string; error?: string }>;
  signup: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<{ success: boolean; errorKey?: string; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage for persisted session and verify with API
    const verifySession = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Verify session with API using stored user ID
          try {
            const response = await fetch(`/api/auth/me?userId=${parsedUser.id}`, {
              method: 'GET',
              credentials: 'include',
            });
            
            const data = await response.json();
            if (data.success && data.data) {
              // Session is valid, update user
              setUser(data.data);
              localStorage.setItem('user', JSON.stringify(data.data));
            } else {
              // Session invalid, clear storage
              setUser(null);
              localStorage.removeItem('user');
            }
          } catch (error) {
            // If API call fails, use stored user but mark as potentially stale
            console.warn('Failed to verify session, using cached user:', error);
            setUser(parsedUser);
          }
        } catch (e) {
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; errorKey?: string; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true };
      }

      return { success: false, errorKey: data.errorKey, error: data.error };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, errorKey: 'error.internalServerError', error: 'Internal server error' };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    address?: string
  ): Promise<{ success: boolean; errorKey?: string; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone, address }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true };
      }

      return { success: false, errorKey: data.errorKey, error: data.error };
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Signup error:', error);
      if (error && error.name === 'AbortError') {
        return { success: false, errorKey: 'error.requestTimeout', error: 'Request timed out' };
      }
      return { success: false, errorKey: 'error.internalServerError', error: 'Internal server error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
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
