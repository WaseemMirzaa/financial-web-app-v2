'use client';

import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocale } from '@/contexts/LocaleContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  footer,
}: ModalProps) {
  const { t } = useLocale();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    small: 'max-w-[480px]',
    medium: 'max-w-[640px]',
    large: 'max-w-[800px]',
  };

  return (
    <div
      className="fixed inset-0 z-[1040] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop: full-bleed, no gap from viewport edges */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative z-[1050] bg-white shadow-soft-lg border border-neutral-100 w-full flex flex-col animate-scale-in max-h-[90vh] sm:max-h-[90vh]',
          'rounded-t-2xl sm:rounded-xl',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-neutral-100 flex items-center justify-between gap-3 shrink-0 text-left rtl:text-right">
            <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-neutral-900 flex-1 min-w-0">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-neutral-50 rounded-xl transition-colors flex-shrink-0 text-neutral-600"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 text-left rtl:text-right">
          {children}
        </div>
        {footer && (
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-neutral-100 flex flex-wrap items-center gap-4 sm:gap-6 shrink-0 justify-end rtl:flex-row-reverse">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
