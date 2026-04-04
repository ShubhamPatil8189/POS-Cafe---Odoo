import React from 'react';
import { motion } from 'framer-motion';

export default function TableCard({ table, onClick }) {
  // Classic, Clean, Professional SaaS Styling
  const stateStyles = {
    available: {
      bg: 'bg-white',
      border: 'border-border',
      shadow: 'shadow-sm',
      text: 'text-text-primary',
      subtext: 'text-text-secondary',
      badge: 'bg-surface-hover text-text-secondary'
    },
    occupied: {
      bg: 'bg-[#10B981]/10',
      border: 'border-[#10B981]',
      shadow: 'shadow-md shadow-[#10B981]/10',
      text: 'text-[#065F46]',
      subtext: 'text-[#065F46]/80',
      badge: 'bg-[#10B981] text-white',
      pulse: 'ring-4 ring-[#10B981]/20'
    },
    reserved: {
      bg: 'bg-[#F59E0B]/10',
      border: 'border-[#F59E0B]',
      shadow: 'shadow-md shadow-[#F59E0B]/10',
      text: 'text-[#92400E]',
      subtext: 'text-[#92400E]/80',
      badge: 'bg-[#F59E0B] text-white'
    },
    preparing: {
      bg: 'bg-primary-50',
      border: 'border-primary-400',
      shadow: 'shadow-md shadow-primary-500/10',
      text: 'text-primary-800',
      subtext: 'text-primary-700/80',
      badge: 'bg-primary-500 text-white'
    }
  };

  const currentStyle = stateStyles[table.state] || stateStyles.available;

  return (
    <motion.button
      whileHover={table.state !== 'inactive' ? { scale: 1.02, y: -2, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' } : {}}
      whileTap={table.state !== 'inactive' ? { scale: 0.98 } : {}}
      onClick={() => table.state !== 'inactive' && onClick(table)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={table.state === 'inactive'}
      className={`
        relative flex flex-col items-center justify-center p-6 
        rounded-3xl aspect-square transition-colors duration-300 border
        ${table.state === 'inactive' ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer'}
        ${currentStyle.bg} ${currentStyle.border}
      `}
    >
      {/* Pulse / Ring effects */}
      {table.state === 'occupied' && (
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-[-2px] border-2 border-[#10B981]/50 rounded-3xl pointer-events-none"
        />
      )}
      {table.state === 'preparing' && (
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-[-2px] border-2 border-primary-400/50 rounded-3xl pointer-events-none"
        />
      )}

      {/* Pill Badge for Status */}
      {(table.state === 'reserved' || table.state === 'preparing' || table.state === 'occupied') && (
        <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStyle.badge}`}>
          {table.state}
        </div>
      )}

      {/* Main Content */}
      <span className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${currentStyle.subtext}`}>
        Table
      </span>
      <h3 className={`text-4xl font-extrabold mb-2 ${currentStyle.text}`}>
        {table.number}
      </h3>
      
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 border border-black/5 ${currentStyle.subtext}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span className="text-xs font-bold">{table.seats}</span>
      </div>
      
    </motion.button>
  );
}