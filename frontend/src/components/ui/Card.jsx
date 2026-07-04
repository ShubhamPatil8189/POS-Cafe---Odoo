import React from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-surface rounded-2xl border border-border shadow-sm transition-all duration-200
        ${hover ? 'hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5' : ''}
        ${paddings[padding]}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div
      className={`flex items-center justify-between pb-4 mb-4 border-b border-border-light ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-text-secondary mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border-light ${className}`}
    >
      {children}
    </div>
  );
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  className = '',
}) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                  changeType === 'positive'
                    ? 'text-success-700 bg-success-50'
                    : 'text-danger-700 bg-danger-50'
                }`}
              >
                {changeType === 'positive' ? '↑' : '↓'} {change}
              </span>
              <span className="text-xs text-text-tertiary">vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {/* Decorative gradient */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-100/40 to-accent-100/30 rounded-full blur-2xl" />
    </Card>
  );
}
