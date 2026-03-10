'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { reloadIfStaleDeploy } from '@/lib/client-utils';
import { fetchApi } from '@/lib/fetchApi';

interface AuthContextType {
  user: User | null;
  isVerifying: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errorKey?: string; error?: string }>;
  signup: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<{ success: boolean; errorKey?: string; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const storedUser = typeof window !== 'undefined'
          ? window.localStorage.getItem('user')
          : null;

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          try {
            const response = await fetchApi(`/api/auth/me?userId=${parsedUser.id}`, {
              method: 'GET',
              credentials: 'include',
            });
            const data = await response.json();
            if (data.success && data.data) {
              setUser(data.data);
              window.localStorage.setItem('user', JSON.stringify(data.data));
              setIsVerifying(false);
              return;
            } else {
              setUser(null);
              window.localStorage.removeItem('user');
            }
          } catch (error) {
            reloadIfStaleDeploy(error);
            console.warn('Failed to verify session, using cached user:', error);
            setUser(parsedUser);
            setIsVerifying(false);
            return;
          }
        }

        // Fallback: SSO from mobile app via query params (?flutter_app=1&userId=...)
        if (typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            const isFlutterApp = url.searchParams.get('flutter_app') === '1';
            const userId = url.searchParams.get('userId');
            if (isFlutterApp && userId) {
              const response = await fetchApi(`/api/auth/me?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
              });
              const data = await response.json();
              if (data.success && data.data) {
                setUser(data.data);
                window.localStorage.setItem('user', JSON.stringify(data.data));
                setIsVerifying(false);
                return;
              }
            }
          } catch (err) {
            console.warn('Failed to bootstrap session from flutter_app query params:', err);
          }
        }

        setUser(null);
      } catch {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('user');
        }
        setUser(null);
      }
      setIsVerifying(false);
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; errorKey?: string; error?: string }> => {
    try {
      const response = await fetchApi('/api/auth/login', {
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
      reloadIfStaleDeploy(error);
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
      const response = await fetchApi('/api/auth/signup', {
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
      reloadIfStaleDeploy(error);
      console.error('Signup error:', error);
      if (error && error.name === 'AbortError') {
        return { success: false, errorKey: 'error.requestTimeout', error: 'Request timed out' };
      }
      return { success: false, errorKey: 'error.internalServerError', error: 'Internal server error' };
    }
  };

  const logout = async () => {
    try {
      await fetchApi('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      const bridge = (typeof window !== 'undefined' && (window as unknown as { FlutterAppBridge?: { logout?: () => void } }).FlutterAppBridge);
      if (bridge?.logout) bridge.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isVerifying, login, signup, logout, isAuthenticated: !!user }}>
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
