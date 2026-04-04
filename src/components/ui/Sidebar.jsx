import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  ChefHat,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutGrid,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'floors', label: 'Floor Plan', icon: LayoutGrid },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: '12' },
  { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat, badge: '3' },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export default function Sidebar({
  activeItem = 'dashboard',
  onItemClick,
  collapsed: controlledCollapsed,
  onToggle,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapsed = onToggle ?? (() => setInternalCollapsed(!internalCollapsed));

  return (
    <aside
      className={`flex flex-col h-screen bg-surface border-r border-border transition-all duration-300 ease-out shrink-0
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border-light shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md shadow-primary-700/20 shrink-0">
          <span className="text-white font-bold text-sm">☕</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-text-primary tracking-tight whitespace-nowrap">
              Café POS
            </h1>
            <p className="text-[10px] text-text-tertiary font-medium tracking-wider uppercase whitespace-nowrap">
              Restaurant System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group relative
                ${
                  isActive
                    ? 'bg-primary-700 text-white shadow-md shadow-primary-700/20'
                    : 'text-text-secondary hover:bg-background-alt hover:text-text-primary'
                }
                ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-text-tertiary group-hover:text-primary-600'}`} />
              {!collapsed && (
                <>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap
                        ${isActive ? 'bg-white/20 text-white' : 'bg-accent-100 text-accent-700'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 bg-accent-500 text-white text-[10px] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-2 space-y-1 border-t border-border-light pt-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-background-alt hover:text-text-primary transition-all duration-150 cursor-pointer group
                ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0 text-text-tertiary group-hover:text-primary-600" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}

        {/* User Profile */}
        <div
          className={`flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-background-alt
            ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            SP
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-text-primary truncate">
                Shubham P.
              </p>
              <p className="text-[11px] text-text-tertiary truncate">Manager</p>
            </div>
          )}
          {!collapsed && (
            <button className="p-1 rounded-lg text-text-tertiary hover:text-danger-500 hover:bg-danger-50 transition-all cursor-pointer" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-center h-10 border-t border-border-light text-text-tertiary hover:text-text-primary hover:bg-background-alt transition-all cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
