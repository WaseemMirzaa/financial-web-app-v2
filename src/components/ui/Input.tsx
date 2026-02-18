import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, size = 'medium', className, ...props }, ref) => {
    const baseStyles =
      'w-full rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

    const sizes = {
      small: 'min-h-[40px] text-sm',
      medium: 'min-h-[48px] text-base',
      large: 'min-h-[56px] text-base',
    };

    const stateStyles = error
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20';

    const disabledStyles = props.disabled
      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
      : 'bg-white text-neutral-900';

    const placeholderStyles = 'placeholder:text-neutral-400';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-neutral-800 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            baseStyles,
            sizes[size],
            stateStyles,
            disabledStyles,
            placeholderStyles,
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
