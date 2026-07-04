import React from 'react';
import { Loader2 } from 'lucide-react';

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out rounded-2xl cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-600 active:bg-primary-800 shadow-md hover:shadow-lg hover:shadow-primary-700/20 focus-visible:ring-primary-500',
  secondary:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 focus-visible:ring-primary-500',
  accent:
    'bg-accent-500 text-white hover:bg-accent-400 active:bg-accent-600 shadow-md hover:shadow-lg hover:shadow-accent-500/20 focus-visible:ring-accent-400',
  outline:
    'border-2 border-primary-700 text-primary-700 bg-transparent hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500',
  ghost:
    'text-primary-700 bg-transparent hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-md hover:shadow-lg hover:shadow-danger-500/20 focus-visible:ring-danger-400',
  success:
    'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-md hover:shadow-lg hover:shadow-success-500/20 focus-visible:ring-success-400',
  'outline-danger':
    'border-2 border-danger-500 text-danger-600 bg-transparent hover:bg-danger-50 active:bg-danger-100 focus-visible:ring-danger-400',
  'ghost-danger':
    'text-danger-600 bg-transparent hover:bg-danger-50 active:bg-danger-100 focus-visible:ring-danger-400',
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-3.5 text-base',
  icon: 'p-2.5',
  'icon-sm': 'p-2',
  'icon-lg': 'p-3',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4" />}
    </button>
  );
}
