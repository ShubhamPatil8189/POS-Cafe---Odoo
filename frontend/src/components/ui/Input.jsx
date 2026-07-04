import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Search } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconRight: IconRight,
      type = 'text',
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full px-4 py-2.5 text-sm bg-surface border rounded-2xl transition-all duration-200
              placeholder:text-text-tertiary text-text-primary
              ${Icon ? 'pl-11' : ''}
              ${isPassword || IconRight ? 'pr-11' : ''}
              ${
                error
                  ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                  : 'border-border hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
              }
              focus:outline-none disabled:opacity-50 disabled:bg-background-alt disabled:cursor-not-allowed
              ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4.5 h-4.5" />
              ) : (
                <Eye className="w-4.5 h-4.5" />
              )}
            </button>
          )}
          {IconRight && !isPassword && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              <IconRight className="w-4.5 h-4.5" />
            </div>
          )}
        </div>
        {(error || helperText) && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              error ? 'text-danger-500' : 'text-text-secondary'
            }`}
          >
            {error && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export function SearchInput({ className = '', ...props }) {
  return (
    <Input
      icon={Search}
      placeholder="Search..."
      className={className}
      {...props}
    />
  );
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 text-sm bg-surface border rounded-2xl transition-all duration-200
          placeholder:text-text-tertiary text-text-primary resize-none min-h-[100px]
          ${
            error
              ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
              : 'border-border hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
          }
          focus:outline-none disabled:opacity-50 disabled:bg-background-alt disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
      {(error || helperText) && (
        <div
          className={`flex items-center gap-1.5 text-xs ${
            error ? 'text-danger-500' : 'text-text-secondary'
          }`}
        >
          {error && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
}

export default Input;
