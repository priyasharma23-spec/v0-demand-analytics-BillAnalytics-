'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'danger' | 'warn' | 'info' | 'good';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[#1a56fe] text-white hover:bg-[#1b5af4] active:bg-[#154ac8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed',
      secondary: 'bg-[#e5e7eb] text-[#111827] hover:bg-[#d1d5db] active:bg-[#9ca3af] disabled:bg-[#f3f4f6]',
      danger: 'bg-[#dc2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] disabled:bg-[#d1d5db]',
      warn: 'bg-[#f59e0b] text-white hover:bg-[#d97706] active:bg-[#b45309] disabled:bg-[#d1d5db]',
      info: 'bg-[#3b82f6] text-white hover:bg-[#2563eb] active:bg-[#1d4ed8] disabled:bg-[#d1d5db]',
      good: 'bg-[#10b981] text-white hover:bg-[#059669] active:bg-[#047857] disabled:bg-[#d1d5db]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150',
          variantStyles[variant],
          sizeStyles[size],
          loading && 'opacity-75 cursor-wait',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';
