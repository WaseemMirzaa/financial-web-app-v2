'use client';

import React, { ReactNode } from 'react';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppInitializer } from '@/components/AppInitializer';

/**
 * Single client root so the Router always receives one stable child.
 * Avoids "Rendered more hooks than during the previous render" from Router.
 */
export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AppInitializer>{children}</AppInitializer>
      </AuthProvider>
    </LocaleProvider>
  );
}
