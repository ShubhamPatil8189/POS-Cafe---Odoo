import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { SearchInput } from './Input';

export default function Navbar({ title, subtitle, onMenuClick, className = '' }) {
  return (
    <header
      className={`flex items-center justify-between h-16 px-6 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40 ${className}`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-background-alt transition-all lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-text-primary leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-text-tertiary">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden md:block w-full max-w-md mx-8">
        <SearchInput placeholder="Search orders, items, customers..." />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <button className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-background-alt transition-all md:hidden cursor-pointer">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-background-alt transition-all cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-surface" />
        </button>

        {/* Live Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-50 border border-success-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
          </span>
          <span className="text-xs font-semibold text-success-700">Live</span>
        </div>
      </div>
    </header>
  );
}
