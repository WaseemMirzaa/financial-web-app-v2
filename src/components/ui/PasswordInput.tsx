'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocale } from '@/contexts/LocaleContext';

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  size?: 'small' | 'medium' | 'large';
};

export function PasswordInput({ label, error, size = 'medium', className = '', ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const { t } = useLocale();

  const baseStyles =
    'w-full rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 pr-12 rtl:pr-4 rtl:pl-12';
  const sizes = {
    small: 'min-h-[44px] sm:min-h-[40px] text-sm',
    medium: 'min-h-[44px] sm:min-h-[48px] text-sm sm:text-base',
    large: 'min-h-[48px] sm:min-h-[56px] text-base',
  };
  const stateStyles = error
    ? 'border-error focus:border-error focus:ring-error'
    : 'border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20';
  const disabledStyles = props.disabled
    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
    : 'bg-white text-neutral-900';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-neutral-800 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={clsx(baseStyles, sizes[size], stateStyles, disabledStyles, 'placeholder:text-neutral-400', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          aria-label={show ? t('common.hidePassword') : t('common.showPassword')}
          title={show ? t('common.hidePassword') : t('common.showPassword')}
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
