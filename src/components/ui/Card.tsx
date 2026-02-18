import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'subtle' | 'glass';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'medium',
  className,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const variants = {
    default: 'bg-white border border-neutral-200 shadow-sm',
    elevated: 'bg-white border border-neutral-100 shadow-md hover:shadow-soft-lg hover:border-primary-100/50',
    outlined: 'bg-white border-2 border-neutral-200 hover:border-neutral-300',
    subtle: 'bg-neutral-50 border border-neutral-100 shadow-sm',
    glass: 'bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl',
  };

  // §5 Card padding: None 0, Small 16px, Medium 24px, Large 32px
  const paddings = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <div
      className={clsx(baseStyles, variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
