import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export default function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-border ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`bg-background-alt border-b border-border ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-border-light ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = '', clickable = false, ...props }) {
  return (
    <tr
      className={`transition-colors duration-150
        ${clickable ? 'cursor-pointer hover:bg-primary-50/50 active:bg-primary-50' : 'hover:bg-surface-hover'}
        ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  sortable = false,
  sortDir,
  onSort,
  className = '',
}) {
  return (
    <th
      className={`px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider
        ${sortable ? 'cursor-pointer select-none hover:text-text-primary group' : ''}
        ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="text-text-tertiary group-hover:text-text-secondary transition-colors">
            {sortDir === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : sortDir === 'desc' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-5 py-4 text-text-primary whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

export function TableEmpty({ message = 'No data found', colSpan = 1 }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-12 text-center text-text-tertiary"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-background-alt flex items-center justify-center">
            <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}
