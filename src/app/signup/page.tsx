'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { Loader } from '@/components/ui/Loader';

export default function SignupPage() {
  const { t, isInitialized } = useLocale();
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  if (!isInitialized) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  return null;
}
