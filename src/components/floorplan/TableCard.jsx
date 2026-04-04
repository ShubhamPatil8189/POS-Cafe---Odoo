import React from 'react';
import { motion } from 'framer-motion';

export default function TableCard({ table, onClick }) {
  // Ultra-Premium iPad Pro POS Styling
  const stateStyles = {
    available: {
      bg: 'bg-white',
      border: 'border-slate-200/60',
      shadow: 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]',
      text: 'text-slate-700',
      subtext: 'text-slate-400',
      badge: 'bg-slate-100 text-slate-500'
    },
    occupied: {
      bg: 'bg-white',
      border: 'border-emerald-500',
      shadow: 'shadow-[0_8px_30px_-6px_rgba(16,185,129,0.3)]',
      text: 'text-emerald-900',
      subtext: 'text-emerald-600',
      badge: 'bg-emerald-500 text-white',
    },
    reserved: {
      bg: 'bg-white',
      border: 'border-amber-500',
      shadow: 'shadow-[0_8px_30px_-6px_rgba(245,158,11,0.2)]',
      text: 'text-amber-900',
      subtext: 'text-amber-600',
      badge: 'bg-amber-500 text-white'
    },
    preparing: {
      bg: 'bg-white',
      border: 'border-indigo-400',
      shadow: 'shadow-[0_8px_30px_-6px_rgba(99,102,241,0.2)]',
      text: 'text-indigo-900',
      subtext: 'text-indigo-600',
      badge: 'bg-indigo-500 text-white'
    },
    blocked: {
      bg: 'bg-rose-50',
      border: 'border-rose-500',
      shadow: 'shadow-[0_8px_30px_-6px_rgba(225,29,72,0.2)]',
      text: 'text-rose-900',
      subtext: 'text-rose-600',
      badge: 'bg-rose-500 text-white'
    }
  };

  const currentStyle = stateStyles[table.state] || stateStyles.available;

  return (
    <motion.button
      whileHover={table.state !== 'inactive' ? { scale: 1.03, y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' } : {}}
      whileTap={table.state !== 'inactive' && table.state !== 'blocked' ? { scale: 0.96 } : {}}
      onClick={() => table.state !== 'inactive' && table.state !== 'blocked' && onClick(table)}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      disabled={table.state === 'inactive' || table.state === 'blocked'}
      className={`
        relative flex flex-col items-center justify-center p-6 w-full
        rounded-[1.5rem] aspect-square transition-colors duration-300 border bg-clip-padding backdrop-filter backdrop-blur-md
        ${table.state === 'inactive' ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer'}
        ${currentStyle.bg} ${currentStyle.border} ${currentStyle.shadow}
      `}
    >
      {/* Pulse / Ring effects for active states */}
      {table.state === 'occupied' && (
        <motion.div 
          animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-2px] border-2 border-emerald-400 rounded-[1.6rem] pointer-events-none"
        />
      )}
      {table.state === 'preparing' && (
        <motion.div 
          animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-2px] border-2 border-indigo-400 rounded-[1.6rem] pointer-events-none"
        />
      )}

      {/* Pill Badge for Status */}
      {(table.state === 'reserved' || table.state === 'preparing' || table.state === 'occupied') && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${currentStyle.badge}`}>
          {table.state}
        </div>
      )}

      {/* Main Content */}
      <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${currentStyle.subtext}`}>
        Table
      </span>
      <h3 className={`text-[2.5rem] leading-none font-black tracking-tight mb-3 ${currentStyle.text}`}>
        {table.number}
      </h3>
      
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/50 backdrop-blur-sm border border-slate-200/50 ${currentStyle.subtext}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span className="text-[11px] font-extrabold">{table.seats}</span>
      </div>
    </motion.button>
  );
}