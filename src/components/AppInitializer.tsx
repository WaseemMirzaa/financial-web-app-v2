'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Loader } from '@/components/ui/Loader';
import { getFirebaseAnalytics } from '@/lib/firebase';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { isInitialized } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      getFirebaseAnalytics();
    } catch {
      // ignore
    }
  }, []);

  // Safeguard: stop loader after max wait so app never stays stuck
  useEffect(() => {
    const t = setTimeout(() => setIsChecking(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Defer navigation and setState to avoid "Cannot update HotReload while rendering Router"
    const schedule = (fn: () => void) => {
      if (typeof queueMicrotask !== 'undefined') {
        queueMicrotask(fn);
      } else {
        setTimeout(fn, 0);
      }
    };

    const done = () => schedule(() => setIsChecking(false));

    if (isAuthenticated && user) {
      const isOnDashboard =
        pathname?.startsWith('/admin') ||
        pathname?.startsWith('/employee') ||
        pathname?.startsWith('/customer');
      if (!isOnDashboard) {
        schedule(() => {
          if (user.role === 'admin') router.push('/admin');
          else if (user.role === 'employee') router.push('/employee');
          else if (user.role === 'customer') router.push('/customer');
        });
      }
      done();
      return;
    }

    if (
      !isAuthenticated &&
      pathname &&
      (pathname.startsWith('/admin') ||
        pathname.startsWith('/employee') ||
        pathname.startsWith('/customer'))
    ) {
      schedule(() => router.push('/login'));
      done();
      return;
    }

    if (
      !isAuthenticated &&
      (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')
    ) {
      done();
      return;
    }

    if (
      !isAuthenticated &&
      pathname !== '/login' &&
      pathname !== '/signup' &&
      pathname !== '/forgot-password'
    ) {
      schedule(() => router.push('/login'));
      done();
      return;
    }

    done();
  }, [isInitialized, isAuthenticated, user, router, pathname]);

  // Show loader while checking initialization or locale
  if (!isInitialized || isChecking) {
    return <Loader fullScreen text="Initializing application..." />;
  }

  return <>{children}</>;
}
