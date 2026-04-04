import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthButton({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseStyle = "relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 transform outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group";
  
  const variants = {
    primary: "bg-primary-700 text-white hover:bg-primary-800 hover:-translate-y-0.5 shadow-md hover:shadow-glow focus:ring-primary-500",
    outline: "bg-white text-text-primary border border-border hover:border-text-tertiary hover:bg-surface-hover hover:-translate-y-0.5 shadow-xs focus:ring-border",
    ghost: "bg-transparent text-primary-700 hover:bg-primary-50 focus:ring-primary-200"
  };

  return (
    <button
      type={type}
      disabled={loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Optional ripple/shine effect on primary */}
      {variant === 'primary' && !loading && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
      )}
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
}
