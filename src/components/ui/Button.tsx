import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-primary-500 active:scale-[0.98]';
  
  const variants = {
    primary:
      'bg-gradient-to-b from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 focus:ring-primary-500',
    secondary:
      'bg-white text-primary-600 border-2 border-primary-200 hover:bg-primary-50 hover:border-primary-300 shadow-sm hover:shadow-soft focus:ring-primary-500',
    outline:
      'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-sm focus:ring-neutral-400',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-400',
    destructive: 'bg-error text-white hover:bg-error-dark shadow-sm hover:shadow-md focus:ring-error',
  };

  // Design system: Small 36px, Medium 44px, Large 52px
  const sizes = {
    small: 'min-h-[36px] h-9 px-4 text-sm',
    medium: 'min-h-[44px] h-[44px] px-6 text-base',
    large: 'min-h-[52px] h-[52px] px-8 text-base',
  };

  const disabledStyles = disabled
    ? 'bg-neutral-400 cursor-not-allowed opacity-60'
    : '';

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        disabledStyles,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
