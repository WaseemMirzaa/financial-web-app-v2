'use client';

import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  text?: string;
}

export function Loader({ size = 'medium', fullScreen = false, text }: LoaderProps) {
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };

  const spinner = (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div className={`absolute ${size === 'small' ? 'w-8 h-8' : size === 'medium' ? 'w-16 h-16' : 'w-24 h-24'} rounded-full bg-primary-500/20 blur-md animate-pulse`} />
      
      {/* Main spinner ring */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`${sizes[size]} border-[3px] border-primary-100 border-t-primary-500 border-r-primary-400 rounded-full animate-spin`}
          style={{ animationDuration: '1s' }}
        />
        {/* Middle ring */}
        <div
          className={`${sizes[size]} border-[3px] border-primary-200/50 border-b-primary-600 border-l-primary-300 rounded-full absolute top-0 left-0 animate-spin`}
          style={{
            animationDirection: 'reverse',
            animationDuration: '0.7s',
          }}
        />
        {/* Inner ring */}
        <div
          className={`${size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-6 h-6' : 'w-8 h-8'} border-2 border-primary-300 border-t-primary-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin`}
          style={{ animationDuration: '0.5s' }}
        />
        {/* Center dot with glow */}
        <div className={`${size === 'small' ? 'w-1.5 h-1.5' : size === 'medium' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} bg-primary-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-primary-500/50`} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-page flex flex-col items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-100/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,102,179,0.08),transparent)]" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,102,179,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,179,0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        
        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
          {/* Logo with animation */}
          <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              {/* Logo glow */}
              <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary-500/30 blur-xl animate-pulse" />
              {/* Logo */}
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-soft-lg flex items-center justify-center transform transition-transform hover:scale-105">
                <span className="text-2xl font-bold text-white tracking-tight">LM</span>
              </div>
            </div>
            
            {/* App name */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent tracking-tight">
                LoanManager
              </h1>
              <p className="text-xs text-neutral-400 mt-1 font-medium tracking-wider uppercase">
                Financial Platform
              </p>
            </div>
          </div>
          
          {/* Spinner */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {spinner}
          </div>
          
          {/* Loading text with shimmer effect */}
          {text && (
            <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-sm text-neutral-500 font-medium flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                {text}
                <span className="inline-block w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              </p>
            </div>
          )}
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-200/40 animate-pulse"
              style={{
                width: `${4 + i * 2}px`,
                height: `${4 + i * 2}px`,
                top: `${15 + i * 12}%`,
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="absolute rounded-full bg-primary-300/30 animate-pulse"
              style={{
                width: `${3 + i * 2}px`,
                height: `${3 + i * 2}px`,
                top: `${20 + i * 18}%`,
                right: `${12 + i * 18}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2.5 + i * 0.4}s`,
              }}
            />
          ))}
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-page to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {spinner}
      {text && (
        <p className="text-sm text-neutral-500 font-medium flex items-center gap-2">
          <span className="inline-block w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
          {text}
        </p>
      )}
    </div>
  );
}
