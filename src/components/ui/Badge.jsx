import React from 'react';

const variants = {
  default: 'bg-background-alt text-text-secondary border-border',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  accent: 'bg-accent-50 text-accent-700 border-accent-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  warning: 'bg-accent-50 text-accent-800 border-accent-200',
  outline: 'bg-transparent text-text-secondary border-border',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const dots = {
  default: 'bg-text-tertiary',
  primary: 'bg-primary-500',
  accent: 'bg-accent-500',
  success: 'bg-success-500',
  danger: 'bg-danger-500',
  warning: 'bg-accent-600',
  outline: 'bg-text-tertiary',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon: Icon,
  removable = false,
  onRemove,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap transition-colors duration-150
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
