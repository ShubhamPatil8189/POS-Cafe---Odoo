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
}) {
  return (
    <div className="w-[45%] h-full flex flex-col border-r border-border bg-surface-base relative z-10">
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/50 bg-white/30 backdrop-blur-md">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-border">
          {['ground', 'first'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFloorChange(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${
                activeFloor === f
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f} Floor
            </button>
          ))}
        </div>
        <div className="px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-bold shadow-md shadow-primary-500/20">
          Total: ₹{sessionSalesTotal.toFixed(2)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  );
}
