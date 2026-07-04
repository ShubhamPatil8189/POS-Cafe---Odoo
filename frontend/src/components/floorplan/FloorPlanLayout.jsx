import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Home, Search } from 'lucide-react';
import TableCard from './TableCard';
import { ToastContainer } from './Toast';

export default function FloorPlanLayout({ tables, onTableSelect, toasts, activeFloor, setActiveFloor, onNavigate }) {

  const floors = [
    { id: 'ground', name: 'Ground Floor' },
    { id: 'first', name: 'First Floor' }
  ];

  const currentTables = tables.filter(t => t.floor === activeFloor);

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      
      {/* Background Subtle Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(#E5E7EB 1.5px, transparent 1.5px)',
          backgroundSize: '30px 30px'
        }}
      />
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-8 py-5 flex items-center justify-between z-10 bg-white/70 backdrop-blur-xl border-b border-border-light shadow-sm sticky top-0">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => onNavigate('dashboard')} 
             className="p-3 rounded-2xl bg-white shadow-sm border border-border-light hover:bg-surface-hover hover:border-primary-300 transition-colors"
           >
             <Home className="w-5 h-5 text-primary-700" />
           </button>
           <div>
             <h1 className="text-2xl font-black text-text-primary tracking-tight">Floor Management</h1>
             <p className="text-sm text-text-secondary font-medium">Select a table to place or manage orders.</p>
           </div>
        </div>
        
        {/* Floor Switcher */}
        <div className="flex items-center bg-surface-hover p-1.5 rounded-2xl border border-border-light shadow-inner">
           {floors.map(floor => (
             <button
               key={floor.id}
               onClick={() => setActiveFloor(floor.id)}
               className={`relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 outline-none
                 ${activeFloor === floor.id ? 'text-primary-800 shadow-md' : 'text-text-secondary hover:text-text-primary'}
               `}
             >
               {activeFloor === floor.id && (
                 <motion.div 
                   layoutId="floorTabActive"
                   className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-border-light"
                   transition={{ type: "spring", stiffness: 400, damping: 30 }}
                   style={{ zIndex: -1 }}
                 />
               )}
               <span className="relative z-10 flex items-center gap-2">
                 <Layers className={`w-4 h-4 ${activeFloor === floor.id ? 'text-primary-600' : ''}`} />
                 {floor.name}
               </span>
             </button>
           ))}
        </div>
      </header>

      {/* Main Floor Grid */}
      <div className="flex-1 flex items-start justify-center p-8 z-10 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFloor}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="w-full max-w-6xl mx-auto"
          >
            {currentTables.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {currentTables.map(table => (
                  <TableCard key={table.id} table={table} onClick={onTableSelect} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur rounded-3xl border border-dashed border-border py-24 shadow-sm">
                <Search className="w-12 h-12 text-text-tertiary mb-4" />
                <h3 className="text-xl font-bold text-text-primary">No tables configured</h3>
                <p className="text-text-secondary mt-1">This floor has no tables assigned to it yet.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
