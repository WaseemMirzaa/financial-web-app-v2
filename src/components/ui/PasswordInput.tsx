'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/contexts/LocaleContext';

type PasswordInputProps = React.ComponentProps<typeof Input>;

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const { t } = useLocale();
  return (
    <div className="relative w-full">
      <Input
        type={show ? 'text' : 'password'}
        className={`pr-12 rtl:pr-4 rtl:pl-12 ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 rtl:right-auto rtl:left-3 bottom-3 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        aria-label={show ? t('common.hidePassword') : t('common.showPassword')}
        title={show ? t('common.hidePassword') : t('common.showPassword')}
      >
        {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  );
}
