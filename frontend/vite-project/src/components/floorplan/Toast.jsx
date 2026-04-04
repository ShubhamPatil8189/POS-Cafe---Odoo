import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Search } from 'lucide-react';

// Custom Toast System specific for the FloorPlan context
export function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md border border-white/20
              ${toast.type === 'success' ? 'bg-[#10B981]/90 text-white' : 
                toast.type === 'preparing' ? 'bg-primary-600/90 text-white' : 
                'bg-white/90 text-text-primary border-border'}
            `}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === 'preparing' ? <Clock className="w-5 h-5 animate-pulse" /> : 
             <MapPin className="w-5 h-5 text-primary-500" />}
            <span className="font-semibold">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
