import React from 'react';
import { motion } from 'framer-motion';
import TableCard from '../floorplan/TableCard';

/**
 * Floor plan grid — same layout/classes as UnifiedPOS left pane.
 * `resolveTable` lets KDS stages override card state without changing base table data.
 */
export default function TableGrid({
  activeFloor,
  onFloorChange,
  tables,
  selectedTable,
  onTableClick,
  sessionSalesTotal,
  resolveTable,
  isCollapsed,
}) {
  return (
    <div className="w-full h-full flex flex-col border-r border-border bg-slate-50 relative z-10">
      {/* Decorative background glow to give an iPad Pro feeling */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-100/40 rounded-full blur-[100px] pointer-events-none" />

      {!isCollapsed && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="px-8 py-5 flex items-center justify-between border-b border-border/40 bg-white/40 xl:bg-white/60 backdrop-blur-xl shrink-0 z-20"
        >
          <div className="flex bg-white p-1.5 rounded-full shadow-sm border border-slate-200/60 transition-all">
            {['ground', 'first'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFloorChange(f)}
                className={`px-5 py-2 rounded-full text-sm font-extrabold capitalize transition-all duration-300 ${
                  activeFloor === f
                    ? 'bg-primary-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f} Floor
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-black shadow-lg shadow-indigo-600/30">
            Total: ₹{sessionSalesTotal.toFixed(2)}
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col items-center">
        {isCollapsed ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[170px] flex flex-col gap-5 mt-2"
          >
            <button 
              onClick={() => onTableClick(null)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-[1.25rem] bg-white border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-extrabold transition-all active:scale-95"
            >
              ← Back to Floor
            </button>
            <div className="relative mb-6">
              <motion.div
                layoutId="tableSelection"
                className="absolute -inset-2 border-2 border-indigo-400 bg-indigo-50/30 z-0 rounded-[2rem]"
              />
              <div className="relative z-10 w-full">
                <TableCard table={resolveTable ? resolveTable(selectedTable) : selectedTable} onClick={() => {}} />
              </div>
            </div>

            {/* Elegant filler widgets */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3 w-full"
            >
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-center">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Terminal Link</div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] tracking-wide">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                  SYNCED
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100/50 text-center">
                <div className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest mb-1.5">Tip</div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Tap the <span className="font-bold text-slate-700">Pay Now</span> button to immediately route the order to checkout.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full"
          >
            {tables.map((t) => {
              const display = resolveTable ? resolveTable(t) : t;
              return (
                <div key={t.id} className="relative">
                  {selectedTable?.id === t.id && (
                    <motion.div
                      layoutId="tableSelection"
                      className="absolute -inset-2 border-2 border-primary-500 bg-primary-500/5 z-0 rounded-[2rem]"
                    />
                  )}
                  <div className="relative z-10 w-full h-full">
                    <TableCard table={display} onClick={onTableClick} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
