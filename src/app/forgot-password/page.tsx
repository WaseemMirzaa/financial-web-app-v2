'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/ui/Loader';
import { useLocale } from '@/contexts/LocaleContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isInitialized, t } = useLocale();
  
  // Redirect to login - password reset is disabled
  useEffect(() => {
    if (isInitialized) {
      router.replace('/login');
    }
  }, [isInitialized, router]);

  return <Loader fullScreen text={t('common.loading')} />;
}
