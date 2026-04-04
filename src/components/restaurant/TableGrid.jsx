import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, PlusCircle, Trash } from 'lucide-react';
import TableCard from '../floorplan/TableCard';

/**
 * Floor plan grid — same layout/classes as UnifiedPOS left pane.
 * `resolveTable` lets KDS stages override card state without changing base table data.
 */
export default function TableGrid({
  activeFloor,
  onFloorChange,
  floors = ['ground', 'first'],
  onAddFloor,
  onDeleteFloor,
  tables,
  onAddTable,
  onDeleteTable,
  selectedTable,
  onTableClick,
  sessionSalesTotal,
  resolveTable,
  isCollapsed,
}) {
  const [showAddFloorModal, setShowAddFloorModal] = React.useState(false);
  const [showAddTableModal, setShowAddTableModal] = React.useState(false);
  const [floorToDelete, setFloorToDelete] = React.useState(null);
  const [tableToDelete, setTableToDelete] = React.useState(null);
  
  const [newFloorName, setNewFloorName] = React.useState('');
  const [newTableNum, setNewTableNum] = React.useState('');
  const [newTableSeats, setNewTableSeats] = React.useState('4');

  const handleAddFloorSubmit = () => {
    onAddFloor(newFloorName);
    setNewFloorName('');
    setShowAddFloorModal(false);
  };

  const handleAddTableSubmit = () => {
    onAddTable(activeFloor, newTableNum, newTableSeats);
    setNewTableNum('');
    setNewTableSeats('4');
    setShowAddTableModal(false);
  };

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
          <div className="flex bg-white p-1.5 rounded-full shadow-sm border border-slate-200/60 transition-all items-center">
            {floors.map((f) => (
              <div key={f} className="relative group flex items-center">
                <button
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
                {activeFloor === f && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFloorToDelete(f); }}
                    className="absolute -top-1 -right-1 z-10 p-1 bg-white hover:bg-rose-50 text-rose-500 rounded-full shadow-md border border-rose-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Floor"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={() => setShowAddFloorModal(true)}
              className="ml-2 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-indigo-600 transition-colors"
              title="Add Floor"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddTableModal(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Table
            </button>
            <div className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-black shadow-lg shadow-indigo-600/30">
              Total: ₹{sessionSalesTotal.toFixed(2)}
            </div>
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
            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5 w-full"
          >
            {tables.map((t) => {
              const display = resolveTable ? resolveTable(t) : t;
              return (
                <div key={t.id} className="relative group">
                  {selectedTable?.id === t.id && (
                    <motion.div
                      layoutId="tableSelection"
                      className="absolute -inset-2 border-2 border-primary-500 bg-primary-500/5 z-0 rounded-[2rem]"
                    />
                  )}
                  <div className="relative z-10 w-full h-full cursor-pointer">
                    <TableCard table={display} onClick={onTableClick} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTableToDelete(t.id); }}
                      className="absolute top-0 right-0 z-20 p-2 m-2 bg-white/90 backdrop-blur hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 active:scale-95"
                      title="Delete Table"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Internal Modals */}
      <AnimatePresence>
        {showAddFloorModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-black text-slate-800 mb-4">Add New Floor</h3>
              <input 
                autoFocus
                type="text" 
                placeholder="Floor Name (e.g. Patio)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddFloorModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleAddFloorSubmit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Add Floor</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAddTableModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-black text-slate-800 mb-4">Add Table to {activeFloor}</h3>
              <input 
                autoFocus
                type="number" 
                placeholder="Table Number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Seat Capacity (default: 4)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddTableModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleAddTableSubmit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Add Table</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {floorToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Delete Floor</h3>
              <p className="text-slate-500 mb-6">Are you sure you want to delete the <span className="font-bold text-slate-700 uppercase">{floorToDelete}</span> floor? All tables on this floor will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setFloorToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={() => { onDeleteFloor(floorToDelete); setFloorToDelete(null); }} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {tableToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Delete Table</h3>
              <p className="text-slate-500 mb-6">Remove this table from the floor plan?</p>
              <div className="flex gap-3">
                <button onClick={() => setTableToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={() => { onDeleteTable(tableToDelete); setTableToDelete(null); }} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
