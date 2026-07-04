import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthInput({
  label,
  id,
  type = 'text',
  icon: Icon,
  error,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div
        className={`relative flex items-center transition-all duration-200 border rounded-xl overflow-hidden bg-surface
        ${isFocused ? 'border-primary-500 shadow-glow' : error ? 'border-danger-500' : 'border-border hover:border-primary-400'}
        `}
      >
        {Icon && (
          <div className={`pl-3.5 pr-2 flex items-center justify-center transition-colors ${isFocused ? 'text-primary-500' : 'text-text-tertiary'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          id={id}
          type={inputType}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus && props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur && props.onBlur(e);
          }}
          className={`w-full py-3 text-sm bg-transparent outline-none text-text-primary placeholder:text-text-tertiary transition-all
          ${!Icon ? 'pl-4' : 'pl-1'}
          ${isPassword ? 'pr-10' : 'pr-4'}
          `}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-text-tertiary hover:text-primary-600 transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-danger-500 font-medium animate-slide-up">
          {error}
        </p>
      )}
    </div>
  );
}
