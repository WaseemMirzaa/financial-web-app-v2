'use client';

import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  text?: string;
}

const sizeMap = {
  small: { wrapper: 'w-10 h-10', ring: 'w-8 h-8 border-2' },
  medium: { wrapper: 'w-16 h-16', ring: 'w-14 h-14 border-[3px]' },
  large: { wrapper: 'w-24 h-24', ring: 'w-20 h-20 border-[3px]' },
};

export function Loader({ size = 'medium', fullScreen = false, text }: LoaderProps) {
  const { wrapper, ring } = sizeMap[size];

  const spinner = (
    <div className={`relative ${wrapper} flex items-center justify-center`}>
      {/* Track ring */}
      <div className={`absolute ${ring} rounded-full border-primary-100`} />
      {/* Spinning gradient arc */}
      <div
        className={`absolute ${ring} rounded-full border-transparent border-t-primary-500 border-r-primary-400 animate-spin`}
        style={{ animationDuration: '0.85s' }}
      />
      {/* Inner glow dot */}
      <div className="absolute w-2 h-2 rounded-full bg-primary-400 shadow-[0_0_12px_var(--primary-400)] animate-pulse" style={{ animationDuration: '1.4s' }} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-neutral-50/98 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-8">
          {spinner}
          {text && (
            <p className="text-sm font-medium text-neutral-500 max-w-[220px] text-center animate-pulse" style={{ animationDuration: '1.6s' }}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {spinner}
      {text && <p className="text-sm text-neutral-500 font-medium">{text}</p>}
    </div>
  );
}
